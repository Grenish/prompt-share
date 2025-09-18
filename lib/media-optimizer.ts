// src/lib/media-optimizer.ts

// Optional: to enable video optimization, install ffmpeg.wasm:
//   npm i @ffmpeg/ffmpeg
// This module will gracefully fall back (return original video) if ffmpeg is not available.

export type OptimizeResult = {
  file: File;
  optimized: boolean;
  originalSize: number;
  optimizedSize: number;
  type: "image" | "video" | "other";
  reason?: string;
};

export type OptimizeOptions = {
  // Image options
  maxImageWidth?: number; // default 2048
  maxImageHeight?: number; // default 2048
  imageQuality?: number; // default 0.82 (0-1)
  imageFormats?: string[]; // default ["image/webp", "image/jpeg", "image/png"]
  // Global budget (applied to both image/video). If provided, optimizer tries to get under this size.
  maxBytes?: number;

  // Video options (require ffmpeg.wasm)
  video?: {
    maxWidth?: number; // default 1920
    maxHeight?: number; // default 1080
    crf?: number; // default 24 (lower = better quality/bigger)
    preset?:
      | "ultrafast"
      | "superfast"
      | "veryfast"
      | "faster"
      | "fast"
      | "medium"
      | "slow"
      | "slower"
      | "veryslow"; // default "veryfast"
    fps?: number; // optional (e.g., 30)
    videoBitrate?: string; // optional (e.g., "2500k")
    audioBitrate?: string; // default "128k"
    corePath?: string; // optional custom core path for ffmpeg.wasm
  };
};

const DEFAULTS: Required<
  Pick<OptimizeOptions, "maxImageWidth" | "maxImageHeight" | "imageQuality">
> = {
  maxImageWidth: 2048,
  maxImageHeight: 2048,
  imageQuality: 0.82,
};

const DEFAULT_IMAGE_FORMATS = ["image/webp", "image/jpeg", "image/png"];

// Public API
export async function optimizeMedia(
  file: File,
  options: OptimizeOptions = {},
  onProgress?: (p: number) => void // 0 -> 1
): Promise<OptimizeResult> {
  const originalSize = file.size;

  if (file.type.startsWith("image/")) {
    const out = await optimizeImage(file, options, onProgress);
    const resultFile = out ?? file;
    onProgress?.(1);
    return {
      file: resultFile,
      optimized: Boolean(out && out.size < originalSize),
      originalSize,
      optimizedSize: resultFile.size,
      type: "image",
      reason: !out ? "Image optimization failed or unsupported." : undefined,
    };
  }

  if (file.type.startsWith("video/")) {
    const out = await optimizeVideo(file, options, onProgress);
    const resultFile = out ?? file;
    onProgress?.(1);
    return {
      file: resultFile,
      optimized: Boolean(out && out.size < originalSize),
      originalSize,
      optimizedSize: resultFile.size,
      type: "video",
      reason: !out
        ? "Video optimization skipped (ffmpeg unavailable) or failed."
        : undefined,
    };
  }

  onProgress?.(1);
  return {
    file,
    optimized: false,
    originalSize,
    optimizedSize: originalSize,
    type: "other",
    reason: "Unsupported file type.",
  };
}

/* ------------------------------- IMAGES ---------------------------------- */

async function optimizeImage(
  file: File,
  opts: OptimizeOptions,
  onProgress?: (p: number) => void // 0 -> 1
): Promise<File | null> {
  const {
    maxImageWidth = DEFAULTS.maxImageWidth,
    maxImageHeight = DEFAULTS.maxImageHeight,
    imageQuality = DEFAULTS.imageQuality,
    imageFormats = DEFAULT_IMAGE_FORMATS,
    maxBytes,
  } = opts;

  // Progress scaffolding
  const PROG_DECODE = 0.1; // after decode
  const PROG_DRAW = 0.35; // after draw
  const PROG_TOTAL = 1.0;

  onProgress?.(0);

  // Try to decode and draw to canvas
  const imgData = await decodeImage(file).catch(() => null);
  if (!imgData) {
    onProgress?.(1);
    return null;
  }
  onProgress?.(PROG_DECODE);

  const { width, height, bitmap, element } = imgData;
  const { dstW, dstH } = fitInBox(width, height, maxImageWidth, maxImageHeight);

  let scale = 1;
  let attempt = 0;
  const maxAttempts = 4;

  let bestBlob: Blob | null = null;
  let bestMime = "";

  // Estimate how many encoding steps we might take to spread progress updates.
  const QUALITY_MIN = 0.5;
  const QUALITY_STEP = 0.1;
  const possibleQualitySteps = Math.max(
    1,
    Math.floor((imageQuality - QUALITY_MIN) / QUALITY_STEP) + 1
  );
  const formatsLen = Math.max(1, imageFormats.length);
  const stepsPerAttempt = (maxBytes ? possibleQualitySteps : 1) * formatsLen;
  const dynamicStepsTotal = Math.max(1, maxAttempts * stepsPerAttempt);
  const dynamicBudget = Math.max(0.0001, PROG_TOTAL - PROG_DRAW); // remaining for encode loop
  const stepDelta = dynamicBudget / dynamicStepsTotal;
  let stepCount = 0;

  // First draw
  {
    const w = Math.max(1, Math.round(dstW * scale));
    const h = Math.max(1, Math.round(dstH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanupDecoded(imgData);
      onProgress?.(1);
      return null;
    }
    ctx.drawImage(bitmap ?? element!, 0, 0, w, h);
    onProgress?.(PROG_DRAW);

    // We'll reuse this function each attempt by redrawing at a new scale
    const encodeAtCurrentCanvas = async (cnv: HTMLCanvasElement) => {
      let localBest: { blob: Blob; mime: string } | null = null;

      for (const mime of imageFormats) {
        let q = clamp(imageQuality, 0.4, 0.95);
        let blob = await canvasToBlob(cnv, mime, q);
        stepCount++;
        onProgress?.(Math.min(PROG_DRAW + stepDelta * stepCount, 0.99));
        if (!blob) continue;

        if (maxBytes) {
          while (blob.size > maxBytes && q >= QUALITY_MIN) {
            q = parseFloat((q - QUALITY_STEP).toFixed(2));
            if (q < QUALITY_MIN) break;
            const next = await canvasToBlob(cnv, mime, q);
            stepCount++;
            onProgress?.(Math.min(PROG_DRAW + stepDelta * stepCount, 0.99));
            if (next) blob = next;
          }
        }

        if (!localBest || blob.size < localBest.blob.size) {
          localBest = { blob, mime };
        }
      }
      return localBest;
    };

    // Try iterative downscales if still above budget
    while (attempt < maxAttempts) {
      const bestForThisAttempt = await encodeAtCurrentCanvas(canvas);
      if (bestForThisAttempt) {
        const { blob, mime } = bestForThisAttempt;
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
          bestMime = mime;
        }
        if (!maxBytes || blob.size <= maxBytes) {
          break; // within budget or no budget required
        }
      } else {
        break;
      }

      // Reduce dimensions and redraw for next attempt
      scale *= 0.85;
      attempt += 1;

      const nw = Math.max(1, Math.round(dstW * scale));
      const nh = Math.max(1, Math.round(dstH * scale));
      canvas.width = nw;
      canvas.height = nh;
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) break;
      ctx2.drawImage(bitmap ?? element!, 0, 0, nw, nh);

      // Small progress nudge after redraw
      stepCount++;
      onProgress?.(Math.min(PROG_DRAW + stepDelta * stepCount, 0.99));
    }
  }

  cleanupDecoded(imgData);

  if (!bestBlob) {
    onProgress?.(1);
    return null;
  }

  // If not better than original and no strict maxBytes, keep original
  if (!opts.maxBytes && bestBlob.size >= file.size) {
    onProgress?.(1);
    return file;
  }

  const ext = mimeToExt(bestMime) || extFromName(file.name) || ".webp";
  const name = replaceExt(file.name, ext);
  const outFile = new File([bestBlob], name, {
    type: bestMime || "application/octet-stream",
    lastModified: file.lastModified,
  });

  onProgress?.(1);
  return outFile;
}

type DecodedImage =
  | { width: number; height: number; bitmap: ImageBitmap; element: null }
  | { width: number; height: number; bitmap: null; element: HTMLImageElement };

async function decodeImage(file: File): Promise<DecodedImage | null> {
  try {
    // @ts-ignore: older TS libdom might not know imageOrientation
    const bmp = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    return { width: bmp.width, height: bmp.height, bitmap: bmp, element: null };
  } catch {
    try {
      const url = URL.createObjectURL(file);
      const el = await loadImage(url);
      URL.revokeObjectURL(url);
      return {
        width: el.naturalWidth,
        height: el.naturalHeight,
        bitmap: null,
        element: el,
      };
    } catch {
      return null;
    }
  }
}

function cleanupDecoded(decoded: DecodedImage) {
  if (decoded.bitmap) decoded.bitmap.close();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function fitInBox(srcW: number, srcH: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
  return { dstW: Math.round(srcW * ratio), dstH: Math.round(srcH * ratio) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } else {
      try {
        const dataURL = canvas.toDataURL(type, quality);
        const blob = dataURLtoBlob(dataURL);
        resolve(blob);
      } catch {
        resolve(null);
      }
    }
  });
}

function dataURLtoBlob(dataURL: string): Blob | null {
  const parts = dataURL.split(",");
  if (parts.length < 2) return null;
  const header = parts[0];
  const isBase64 = header.includes("base64");
  const mimeMatch = /data:([^;]+);/i.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const data = isBase64 ? atob(parts[1]) : decodeURIComponent(parts[1]);
  const u8 = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) u8[i] = data.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/* ------------------------------- VIDEO ----------------------------------- */

let _ffmpegInstance: any | null = null;
let _ffmpegLoading: Promise<any> | null = null;

async function loadFFmpeg(corePath?: string): Promise<any | null> {
  if (_ffmpegInstance) return _ffmpegInstance;
  if (_ffmpegLoading) return _ffmpegLoading;

  _ffmpegLoading = (async () => {
    try {
      // @ts-ignore: optional dependency
      const mod = (await import("@ffmpeg/ffmpeg")) as any;
      const createFFmpeg = mod.createFFmpeg;
      _ffmpegInstance = createFFmpeg({
        log: false,
        ...(corePath ? { corePath } : {}),
      });
      await _ffmpegInstance.load();
      return _ffmpegInstance;
    } catch {
      _ffmpegInstance = null;
      return null;
    }
  })();

  return _ffmpegLoading;
}

async function optimizeVideo(
  file: File,
  opts: OptimizeOptions,
  onProgress?: (p: number) => void
): Promise<File | null> {
  const ff = await loadFFmpeg(opts.video?.corePath);
  if (!ff) return null;

  // @ts-ignore: optional dependency
  const { fetchFile } = (await import("@ffmpeg/ffmpeg")) as any;

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    crf = 24,
    preset = "veryfast",
    fps,
    videoBitrate,
    audioBitrate = "128k",
  } = opts.video || {};

  const inputName = `in_${Date.now()}${extFromName(file.name) || ""}`;
  const outputName = `out_${Date.now()}.mp4`;

  ff.FS("writeFile", inputName, await fetchFile(file));

  if (onProgress) {
    ff.setProgress(({ ratio }: { ratio: number }) => {
      const r = typeof ratio === "number" ? Math.max(0, Math.min(1, ratio)) : 0;
      onProgress(r);
    });
  }

  const scaleFilter = `scale='min(iw,${maxWidth})':'min(ih,${maxHeight})':force_original_aspect_ratio=decrease`;
  const args = [
    "-i",
    inputName,
    "-vf",
    scaleFilter,
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    ...(videoBitrate ? ["-b:v", videoBitrate] : []),
    ...(fps ? ["-r", String(fps)] : []),
    "-c:a",
    "aac",
    "-b:a",
    audioBitrate,
    "-movflags",
    "+faststart",
    outputName,
  ];

  try {
    await ff.run(...args);
    const data = ff.FS("readFile", outputName);
    try {
      ff.FS("unlink", inputName);
      ff.FS("unlink", outputName);
    } catch {}

    const outBlob = new Blob([data.buffer], { type: "video/mp4" });
    if (!opts.maxBytes && outBlob.size >= file.size) {
      return file;
    }
    const outFile = new File([outBlob], replaceExt(file.name, ".mp4"), {
      type: "video/mp4",
      lastModified: file.lastModified,
    });
    return outFile;
  } catch {
    return null;
  } finally {
    if (onProgress) ff.setProgress(() => {});
  }
}

/* ------------------------------- UTILS ----------------------------------- */

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function mimeToExt(mime: string): string | null {
  if (!mime) return null;
  const map: Record<string, string> = {
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "video/mp4": ".mp4",
  };
  return map[mime] ?? null;
}

function extFromName(name: string): string | null {
  const m = /\.[^/.]+$/.exec(name);
  return m ? m[0] : null;
}

function replaceExt(name: string, newExt: string) {
  return name.replace(/\.[^/.]+$/, "") + newExt;
}
