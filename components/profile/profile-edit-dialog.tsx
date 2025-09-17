"use client";

import * as React from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // shadcn component
import { updateProfileSettings, type UpdateProfileSettingsState } from "@/util/actions";
import { Image as ImageIcon, Upload, X, Loader2, Trash2 } from "lucide-react"; // icons

const BIO_MAX = 160;

export function ProfileEditDialog({
  open,
  onOpenChange,
  initialBio,
  initialBackgroundUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBio: string | null | undefined;
  initialBackgroundUrl: string | null | undefined;
}) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [removeBg, setRemoveBg] = useState(false);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<UpdateProfileSettingsState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      setBio(initialBio ?? "");
      setRemoveBg(false);
      setBgFile(null);
      setServerState(null);
    }
  }, [open, initialBio]);

  useEffect(() => {
    if (bgFile) {
      const url = URL.createObjectURL(bgFile);
      setBgPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setBgPreview(null);
  }, [bgFile]);

  const hasChanges =
    (bio ?? "") !== (initialBio ?? "") || Boolean(bgFile) || Boolean(removeBg);

  const canRemoveExisting = Boolean(initialBackgroundUrl) && !bgFile;

  async function compressImage(
    file: File,
    opts?: { maxDimension?: number; quality?: number; mimeType?: string; targetBytes?: number }
  ): Promise<File> {
    const { maxDimension = 1920, quality = 0.8, mimeType = "image/webp", targetBytes = 900_000 } = opts || {};
    if (file.size <= targetBytes) return file;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      image.src = url;
    });

    const { width: w, height: h } = img;
    let tw = w;
    let th = h;
    if (Math.max(w, h) > maxDimension) {
      const scale = maxDimension / Math.max(w, h);
      tw = Math.round(w * scale);
      th = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, tw, th);

    async function toBlob(q: number): Promise<Blob> {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(blob);
          },
          mimeType,
          q
        );
      });
    }

    const qualities = [quality, 0.72, 0.62, 0.52, 0.44];
    let outBlob: Blob | null = null;
    for (const q of qualities) {
      const b = await toBlob(q);
      if (b.size <= targetBytes || q === qualities[qualities.length - 1]) {
        outBlob = b;
        break;
      }
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + (mimeType.includes("webp") ? ".webp" : ".jpg");
    return new File([outBlob!], newName, { type: mimeType, lastModified: Date.now() });
  }

  function formatBytes(bytes: number) {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }

  const handleFile = async (file: File) => {
    setRemoveBg(false);
    setCompressing(true);
    try {
      const compressed = await compressImage(file, {
        maxDimension: 1920,
        quality: 0.82,
        mimeType: "image/webp",
        targetBytes: 900_000,
      });
      setBgFile(compressed);
    } catch {
      setBgFile(file);
    } finally {
      setCompressing(false);
    }
  };

  const onBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setBgFile(null);
      return;
    }
    await handleFile(f);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) await handleFile(f);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    const formData = new FormData();
    formData.append("bio", bio);
    if (removeBg) formData.append("removeBackground", "on");
    if (bgFile) formData.append("background", bgFile);

    startTransition(async () => {
      const res = await updateProfileSettings({ ok: false }, formData);
      setServerState(res);
      if (res.ok) onOpenChange(false);
    });
  };

  const showExistingPreview = !bgPreview && !!initialBackgroundUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your bio and background image.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">Bio</Label>
                <span className="text-xs text-muted-foreground">{bio.length} / {BIO_MAX}</span>
              </div>
              <Textarea
                id="bio"
                value={bio}
                maxLength={BIO_MAX}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell something about yourself"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short and sweet. This appears on your profile.
              </p>
            </div>

            {/* Background image */}
            <div className="space-y-2">
              <Label>Background image</Label>

              <input
                ref={fileInputRef}
                id="background"
                type="file"
                accept="image/*"
                onChange={onBackgroundChange}
                className="hidden"
                disabled={compressing || pending}
              />

              <div
                className={`relative rounded-md border border-dashed bg-muted/30 p-3 transition-colors ${
                  compressing ? "opacity-90" : ""
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                {/* Preview area */}
                {(bgPreview || showExistingPreview) ? (
                  <div className="relative overflow-hidden rounded-md">
                    <div className="aspect-video w-full bg-muted">
                      <img
                        src={bgPreview || initialBackgroundUrl!}
                        alt="Background preview"
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    </div>

                    {/* Overlay while compressing */}
                    {compressing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Optimizing image…
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    disabled={compressing || pending}
                  >
                    <Upload className="h-4 w-4" />
                    Drag & drop your image here, or click to upload
                  </button>
                )}

                {/* Controls row */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {bgFile
                      ? <>Selected: {bgFile.name} • {formatBytes(bgFile.size)}</>
                      : showExistingPreview
                      ? <>Current background</>
                      : <>Max ~1MB after optimization</>}
                  </div>

                  <div className="flex items-center gap-2">
                    {bgFile ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={compressing || pending}
                        >
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBgFile(null)}
                          disabled={compressing || pending}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Clear
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={compressing || pending}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Choose image
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove existing background toggle */}
              {initialBackgroundUrl ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="remove-bg"
                    type="checkbox"
                    className="size-4"
                    checked={removeBg}
                    onChange={(e) => setRemoveBg(e.target.checked)}
                    disabled={!canRemoveExisting || pending}
                  />
                  <Label
                    htmlFor="remove-bg"
                    className={canRemoveExisting ? "" : "pointer-events-none opacity-50"}
                  >
                    Remove existing background
                  </Label>
                </div>
              ) : null}
            </div>

            {/* Server error */}
            {serverState?.error && (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {serverState.error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || compressing || !hasChanges}
            >
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}