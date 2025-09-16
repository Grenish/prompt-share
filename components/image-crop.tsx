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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Download,
  Loader2,
} from "lucide-react";
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
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [quality, setQuality] = React.useState("balanced");
  const [previewStats, setPreviewStats] = React.useState<{
    originalSize: string;
    estimatedSize: string;
  } | null>(null);

  // Get original image size
  React.useEffect(() => {
    if (imageUrl) {
      fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const originalSize = formatFileSize(blob.size);
          const estimatedSize = formatFileSize(
            blob.size * getQualityMultiplier(quality)
          );
          setPreviewStats({ originalSize, estimatedSize });
        });
    }
  }, [imageUrl, quality]);

  const onCropAreaChange = React.useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const { file, url } = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation,
        quality
      );

      onCropComplete(url, file);
      toast.success("Image cropped and optimized", {
        description: `Final size: ${formatFileSize(file.size)}`,
      });
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Crop & Optimize Image</DialogTitle>
          <DialogDescription>
            Adjust your image and we'll optimize it for web use
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[400px] bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropAreaChange}
            showGrid={false}
            style={{
              containerStyle: {
                background: "hsl(var(--muted))",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4 p-6">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Zoom</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={1}
                max={3}
                step={0.01}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Rotation</Label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setRotation(0)}
              >
                <Maximize className="h-3 w-3" />
              </Button>
              <Slider
                value={[rotation]}
                onValueChange={([v]) => setRotation(v)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quality" className="text-sm">
                Optimization Level
              </Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    High Quality (Larger file)
                  </SelectItem>
                  <SelectItem value="balanced">
                    Balanced (Recommended)
                  </SelectItem>
                  <SelectItem value="optimized">
                    Max Optimization (Smaller file)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {previewStats && (
              <div className="space-y-2">
                <Label className="text-sm">File Size</Label>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original:</span>
                    <span>{previewStats.originalSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ~{previewStats.estimatedSize}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t p-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save & Optimize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Image processing utilities
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  quality = "balanced"
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  const maxSize = getMaxSize(quality);
  const scale = Math.min(
    1,
    maxSize / Math.max(pixelCrop.width, pixelCrop.height)
  );

  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Apply rotation if needed
  if (rotation) {
    const rotRad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rotRad));
    const cos = Math.abs(Math.cos(rotRad));
    const newWidth = pixelCrop.width * cos + pixelCrop.height * sin;
    const newHeight = pixelCrop.width * sin + pixelCrop.height * cos;

    canvas.width = newWidth * scale;
    canvas.height = newHeight * scale;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.translate(
      (-pixelCrop.width * scale) / 2,
      (-pixelCrop.height * scale) / 2
    );
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width * scale,
    pixelCrop.height * scale
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }

        // Apply additional compression if needed
        const file = new File([blob], "avatar.webp", { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        resolve({ file, url });
      },
      "image/webp",
      getCompressionQuality(quality)
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function getMaxSize(quality: string): number {
  switch (quality) {
    case "high":
      return 512;
    case "optimized":
      return 256;
    default:
      return 384;
  }
}

function getCompressionQuality(quality: string): number {
  switch (quality) {
    case "high":
      return 0.95;
    case "optimized":
      return 0.75;
    default:
      return 0.85;
  }
}

function getQualityMultiplier(quality: string): number {
  switch (quality) {
    case "high":
      return 0.7;
    case "optimized":
      return 0.3;
    default:
      return 0.5;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}
