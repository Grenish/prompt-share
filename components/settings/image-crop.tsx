"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImage: string, file: File) => void;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
}

export function ImageCropper({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round",
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const onCropAreaChange = React.useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const { file, url } = await getCroppedImageAuto({
        imageSrc: imageUrl,
        pixelCrop: croppedAreaPixels,
        cropShape,
        aspectRatio,
      });

      onCropComplete(url, file);
      toast.success("Image cropped and optimized", {
        description: `Final size: ${formatFileSize(file.size)}`,
      });
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>Drag to move • Scroll/Pinch to zoom. We’ll optimize automatically.</DialogDescription>
        </DialogHeader>

        <div className="relative h-[420px] bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaChange}
            zoomWithScroll
            restrictPosition
            showGrid={false}
            objectFit="contain"
            style={{
              containerStyle: { background: "hsl(var(--muted))" },
              cropAreaStyle: { border: "1px solid hsl(var(--border))" },
            }}
            mediaProps={{ crossOrigin: "anonymous" }}
            minZoom={1}
            maxZoom={4}
          />

          {/* Subtle hint badge */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/75 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            Drag to move • Scroll/Pinch to zoom
          </div>
        </div>

        <DialogFooter className="border-t p-6">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Auto-optimizes the cropped image:
 * - Exports WebP at high visual quality
 * - Smart downscale: caps longest edge to a sensible max (avatar vs cover)
 * - Falls back to slightly lower quality only if very large
 * - Keeps transparency for round crops
 */
async function getCroppedImageAuto({
  imageSrc,
  pixelCrop,
  cropShape,
  aspectRatio,
}: {
  imageSrc: string;
  pixelCrop: Area;
  cropShape: "rect" | "round";
  aspectRatio: number;
}): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);

  // Heuristics: round+1:1 → avatar; otherwise treat as cover/banner
  const isAvatar = cropShape === "round" && Math.abs(aspectRatio - 1) < 0.01;
  const MAX_EDGE = isAvatar ? 640 : 1600; // cap longest edge to keep files lean without visible loss

  const srcW = pixelCrop.width;
  const srcH = pixelCrop.height;
  const longest = Math.max(srcW, srcH);
  const scale = Math.min(1, MAX_EDGE / longest);

  const outW = Math.round(srcW * scale);
  const outH = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  canvas.width = outW;
  canvas.height = outH;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (cropShape === "round") {
    ctx.save();
    ctx.beginPath();
    const r = Math.min(outW, outH) / 2;
    ctx.arc(outW / 2, outH / 2, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    srcW,
    srcH,
    0,
    0,
    outW,
    outH
  );

  if (cropShape === "round") {
    ctx.restore();
  }

  // Prefer high-quality WebP; gracefully reduce only if massive
  const type = "image/webp";
  const qualities = [0.92, 0.88, 0.84, 0.8]; // keeps visual differences negligible
  const MAX_BYTES = isAvatar ? 900_000 : 1_600_000; // soft caps

  let blob: Blob | null = null;
  for (const q of qualities) {
    blob = await canvasToBlob(canvas, type, q);
    if (blob && blob.size <= MAX_BYTES) break;
  }
  // Fallback last try if toBlob returned null
  if (!blob) {
    blob = await canvasToBlob(canvas, "image/png"); // lossless fallback (larger)
  }
  if (!blob) throw new Error("Failed to encode image");

  const ext = blob.type.includes("webp") ? "webp" : blob.type.includes("png") ? "png" : "jpg";
  const file = new File([blob], `crop.${ext}`, { type: blob.type });
  const url = URL.createObjectURL(blob);
  return { file, url };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type?: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // helps avoid canvas taint for same-origin/object URLs; requires server CORS headers for remote URLs
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
    image.src = url;
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}