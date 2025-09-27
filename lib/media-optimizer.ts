export type OptimizeResult = {
  file: File;
  optimized: boolean;
  originalSize: number;
  optimizedSize: number;
  type: "image" | "video" | "other";
  reason?: string;
};

export type OptimizeOptions = {
  maxImageWidth?: number;
  maxImageHeight?: number;
  imageQuality?: number;
  imageFormats?: string[];
  maxBytes?: number;
  video?: {
    maxWidth?: number;
    maxHeight?: number;
    crf?: number;
    preset?:
      | "ultrafast"
      | "superfast"
      | "veryfast"
      | "faster"
      | "fast"
      | "medium"
      | "slow"
      | "slower"
      | "veryslow";
    fps?: number;
    videoBitrate?: string;
    audioBitrate?: string;
    corePath?: string;
    attempts?: number;
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

export async function optimizeMedia(
  file: File,
  options: OptimizeOptions = {},
  onProgress?: (p: number) => void
): Promise<OptimizeResult> {
  const originalSize = file.size;

  if (file.type.startsWith("image/")) {
    const out = await optimizeImage(file, options, onProgress);
    const res = out ?? file;
    onProgress?.(1);
    return {
      file: res,
      optimized: Boolean(out && out.size < originalSize),
      originalSize,
      optimizedSize: res.size,
      type: "image",
      reason: !out ? "Image optimization failed or unsupported." : undefined,
    };
  }

  if (file.type.startsWith("video/")) {
    const out = await optimizeVideo(file, options, onProgress);
    const res = out ?? file;
    onProgress?.(1);
    return {
      file: res,
      optimized: Boolean(out && out.size < originalSize),
      originalSize,
      optimizedSize: res.size,
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

/* -------------------------------- IMAGES --------------------------------- */

async function optimizeImage(
  file: File,
  opts: OptimizeOptions,
  onProgress?: (p: number) => void
): Promise<File | null> {
  const {
    maxImageWidth = DEFAULTS.maxImageWidth,
    maxImageHeight = DEFAULTS.maxImageHeight,
    imageQuality = DEFAULTS.imageQuality,
    imageFormats = DEFAULT_IMAGE_FORMATS,
    maxBytes,
  } = opts;

  const PROG_DECODE = 0.1;
  const PROG_DRAW = 0.35;
  const PROG_TOTAL = 1.0;

  onProgress?.(0);
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

  const QUALITY_MIN = 0.5;
  const QUALITY_STEP = 0.1;
  const possibleQualitySteps = Math.max(
    1,
    Math.floor((imageQuality - QUALITY_MIN) / QUALITY_STEP) + 1
  );
  const formatsLen = Math.max(1, imageFormats.length);
  const stepsPerAttempt = (maxBytes ? possibleQualitySteps : 1) * formatsLen;
  const dynamicStepsTotal = Math.max(1, maxAttempts * stepsPerAttempt);
  const dynamicBudget = Math.max(0.0001, PROG_TOTAL - PROG_DRAW);
  const stepDelta = dynamicBudget / dynamicStepsTotal;
  let stepCount = 0;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    cleanupDecoded(imgData);
    onProgress?.(1);
    return null;
  }

  const encodeAtCanvas = async (cnv: HTMLCanvasElement) => {
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

  while (attempt < maxAttempts) {
    const w = Math.max(1, Math.round(dstW * scale));
    const h = Math.max(1, Math.round(dstH * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(bitmap ?? element!, 0, 0, w, h);
    onProgress?.(
      attempt === 0
        ? PROG_DRAW
        : Math.min(PROG_DRAW + stepDelta * stepCount, 0.99)
    );

    const bestForThisAttempt = await encodeAtCanvas(canvas);
    if (bestForThisAttempt) {
      const { blob, mime } = bestForThisAttempt;
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
        bestMime = mime;
      }
      if (!maxBytes || blob.size <= maxBytes) break;
    } else {
      break;
    }
    scale *= 0.85;
    attempt += 1;
    stepCount++;
    onProgress?.(Math.min(PROG_DRAW + stepDelta * stepCount, 0.99));
  }

  cleanupDecoded(imgData);
  if (!bestBlob) {
    onProgress?.(1);
    return null;
  }
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
    // @ts-ignore
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
  const r = Math.min(maxW / srcW, maxH / srcH, 1);
  return { dstW: Math.round(srcW * r), dstH: Math.round(srcH * r) };
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

/* -------------------------------- VIDEO ---------------------------------- */

let _ffmpegInstance: any | null = null;
let _ffmpegLoading: Promise<any> | null = null;

async function loadFFmpeg(corePath?: string): Promise<any | null> {
  if (_ffmpegInstance) return _ffmpegInstance;
  if (_ffmpegLoading) return _ffmpegLoading;

  _ffmpegLoading = (async () => {
    try {
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

  const { fetchFile } = (await import("@ffmpeg/ffmpeg")) as any;

  const {
    maxWidth = 1280,
    maxHeight = 720,
    crf = 30,
    preset = "medium",
    fps = 24,
    videoBitrate,
    audioBitrate = "48k",
    attempts = 5,
  } = opts.video || {};

  const meta = await getVideoMeta(file).catch(() => null);
  const duration = Math.max(0.2, meta?.duration || 6);
  const srcW = meta?.width || maxWidth;
  const srcH = meta?.height || maxHeight;

  const inputName = `in_${Date.now()}${extFromName(file.name) || ""}`;
  let outputName = `out_${Date.now()}.mp4`;

  ff.FS("writeFile", inputName, await fetchFile(file));

  if (onProgress) {
    ff.setProgress(({ ratio }: { ratio: number }) => {
      const r = typeof ratio === "number" ? Math.max(0, Math.min(1, ratio)) : 0;
      onProgress(r);
    });
  }

  const targetBytes = opts.maxBytes || 0;
  const audioBpsInit = parseBitrate(audioBitrate) || 48000;
  const heightPlan = buildHeightsPlan(srcW, srcH, maxWidth, maxHeight);
  const fpsOut = clamp(Math.round(fps), 10, 60);

  const encode = async (
    h: number,
    vbrBps?: number,
    useCRF?: boolean,
    abps?: number,
    fpsOverride?: number
  ) => {
    const args: string[] = ["-y", "-i", inputName];

    const filters: string[] = [];
    const hh = Math.min(h, srcH);
    if (hh > 0 && hh < srcH) filters.push(`scale=-2:${even(hh)}`);
    if (fpsOverride || fpsOut)
      filters.push(`fps=${clamp(Math.round(fpsOverride || fpsOut), 10, 60)}`);
    if (filters.length) args.push("-vf", filters.join(","));

    args.push("-c:v", "libx264", "-preset", preset);
    if (useCRF) {
      args.push("-crf", String(crf));
    } else if (vbrBps) {
      const vb = Math.max(32000, vbrBps);
      const vbStr = formatBitrate(vb);
      args.push(
        "-b:v",
        vbStr,
        "-maxrate",
        vbStr,
        "-bufsize",
        formatBitrate(vb * 2)
      );
    }

    const aBps = Math.max(24000, abps || audioBpsInit);
    args.push("-c:a", "aac", "-b:a", formatBitrate(aBps));
    args.push("-pix_fmt", "yuv420p", "-movflags", "+faststart", outputName);

    try {
      await ff.run(...args);
      const data = ff.FS("readFile", outputName);
      return new Blob([data.buffer], { type: "video/mp4" });
    } catch {
      return null;
    } finally {
      try {
        ff.FS("unlink", outputName);
      } catch {}
      outputName = `out_${Date.now()}.mp4`;
    }
  };

  let bestBlob: Blob | null = null;

  if (targetBytes > 0) {
    let audioBps = audioBpsInit;
    let vbr = Math.max(
      24000,
      Math.floor((targetBytes * 8 * 0.97) / duration) - audioBps
    );

    for (let i = 0; i < Math.max(2, attempts); i++) {
      const chosenH = chooseHeightForBitrate(heightPlan, vbr, fpsOut);
      const blob = await encode(chosenH, vbr, false, audioBps);
      if (!blob) continue;

      if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
      if (blob.size <= targetBytes) break;

      const overshoot = Math.max(1.05, blob.size / targetBytes);
      vbr = Math.max(20000, Math.floor(vbr / Math.min(overshoot * 1.2, 2.2)));

      if (i >= attempts - 2 && audioBps > 32000) {
        audioBps = Math.max(24000, Math.floor(audioBps * 0.7));
      }
      if (i >= attempts - 2 && fpsOut > 18) {
        const blob2 = await encode(chosenH, vbr, false, audioBps, 18);
        if (blob2 && (!bestBlob || blob2.size < bestBlob.size))
          bestBlob = blob2;
        if (blob2 && blob2.size <= targetBytes) break;
      }
    }
  } else {
    const startH = heightPlan[0] || Math.min(srcH, maxHeight);
    const blob = await encode(
      startH,
      parseBitrate(videoBitrate || ""),
      !videoBitrate
    );
    if (blob) bestBlob = blob;
  }

  try {
    ff.FS("unlink", inputName);
  } catch {}

  if (onProgress) ff.setProgress(() => {});

  if (!bestBlob) return null;
  if (!opts.maxBytes && bestBlob.size >= file.size) return file;

  const outFile = new File([bestBlob], replaceExt(file.name, ".mp4"), {
    type: "video/mp4",
    lastModified: file.lastModified,
  });
  return outFile;
}

/* -------------------------------- UTILS ---------------------------------- */

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function even(n: number) {
  return n % 2 === 0 ? n : n - 1;
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

function parseBitrate(s?: string) {
  if (!s) return 0;
  const m = /^(\d+(?:\.\d+)?)([kKmM])?$/.exec(s.trim());
  if (!m) return 0;
  const v = parseFloat(m[1]);
  const unit = (m[2] || "").toLowerCase();
  if (unit === "m") return Math.floor(v * 1_000_000);
  if (unit === "k") return Math.floor(v * 1_000);
  return Math.floor(v);
}

function formatBitrate(bps: number) {
  if (bps >= 1_000_000) return `${Math.round(bps / 10_000) / 100}M`;
  return `${Math.max(1, Math.round(bps / 1000))}k`;
}

function buildHeightsPlan(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): number[] {
  const capR = Math.min(maxW / srcW, maxH / srcH, 1);
  const maxOutH = Math.floor(srcH * capR);
  const ladder = [
    1080, 960, 900, 864, 720, 640, 576, 540, 480, 432, 360, 320, 288, 240, 180,
    144,
  ];
  const plan = ladder.filter((h) => h <= maxOutH);
  if (!plan.length) plan.push(Math.max(144, Math.min(maxOutH, even(maxOutH))));
  return plan.map(even);
}

function chooseHeightForBitrate(
  heights: number[],
  vbrBps: number,
  fps: number
) {
  const minBPP = 0.06;
  const pick = heights.find((h) => {
    const w = Math.floor((16 / 9) * h);
    const bpp = vbrBps / (fps * w * h);
    return bpp >= minBPP;
  });
  return pick || heights[heights.length - 1] || 360;
}

function getVideoMeta(
  file: File
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const meta = {
        width: v.videoWidth || 0,
        height: v.videoHeight || 0,
        duration: isFinite(v.duration) ? v.duration : 0,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    v.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    v.src = url;
  });
}
