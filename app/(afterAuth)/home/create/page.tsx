"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { optimizeMedia, type OptimizeOptions } from "@/lib/media-optimizer";

type MediaItem = {
  file: File;
  url: string;
};

type VideoOptions = NonNullable<OptimizeOptions["video"]>;

// TODO(video-upload): Re-enable video uploads in a later version.
// Context: Video uploads were temporarily disabled because users were seeing
// "Some files were skipped" errors when compression couldn't always reach the ~1MB
// target even for inputs < 10MB. The UI now only accepts images and rejects videos.
// 
// When re-enabling, consider:
// - Accepting videos up to a strict raw cap (e.g., 10MB) without requiring final ~1MB.
// - Tuning optimizeMedia video settings (bitrate, resolution, fps, attempts) or adding a
//   multi-pass strategy with a sensible floor to avoid excessive quality loss.
// - Aligning frontend policy with /api/posts server validations so uploads aren’t rejected
//   after client-side acceptance.
// - Surfacing final file size in the UI so users understand any skips.
// - Optionally offloading transcoding to a backend job and storing an optimized copy for feed.

export default function DashboardCreatePage() {
  const MAX_FILES = 4;
  const IMAGE_MAX_MB = 5;
  const VIDEO_RAW_MAX_MB = 10; // strict raw input cap
  const VIDEO_TARGET_MB = 1; // compress to ~1MB after upload

  const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;
  const VIDEO_RAW_MAX_BYTES = VIDEO_RAW_MAX_MB * 1024 * 1024;
  const VIDEO_TARGET_BYTES = VIDEO_TARGET_MB * 1024 * 1024;

  const MAX_CHARS = 2000;

  const [text, setText] = React.useState("");
  const [media, setMedia] = React.useState<MediaItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [optState, setOptState] = React.useState<{
    total: number;
    currentIndex: number;
    currentPercent: number;
    fileName: string | null;
  }>({ total: 0, currentIndex: 0, currentPercent: 0, fileName: null });

  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");

  const [model, setModel] = React.useState<string>("");
  const [customModel, setCustomModel] = React.useState<string>("");

  const [category, setCategory] = React.useState<string>("Image");
  const [customCategory, setCustomCategory] = React.useState<string>("");

  const [subCategory, setSubCategory] = React.useState<string>("");
  const [customSubCategory, setCustomSubCategory] = React.useState<string>("");

  const subCategories: Record<string, string[]> = {
    Image: ["Artwork", "Meme", "Photography"],
    Brainstorm: ["Ideas", "Writing", "Startup"],
    Others: [],
  };

  const remaining = 2000 - text.length;
  const canPost =
    (text.trim().length > 0 || media.length > 0) &&
    remaining >= 0 &&
    !isOptimizing;

  const addFiles = async (files: File[]) => {
    setError(null);

    const currentCount = media.length;
    if (currentCount >= MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const availableSlots = MAX_FILES - currentCount;
    const picked = files.slice(0, availableSlots);

    const valid: File[] = [];
    let rejectedVideos = 0;
    let rejectedImages = 0;

    for (const f of picked) {
      if (f.type.startsWith("video/")) {
        // Videos are currently disabled
        rejectedVideos++;
        continue;
      } else if (f.type.startsWith("image/")) {
        if (f.size > IMAGE_MAX_BYTES) {
          rejectedImages++;
          continue;
        }
        valid.push(f);
      }
    }

    if (!valid.length) {
      const errs = [];
      if (rejectedVideos)
        errs.push(`${rejectedVideos} video(s) not supported`);
      if (rejectedImages)
        errs.push(`${rejectedImages} image(s) > ${IMAGE_MAX_MB}MB`);
      const msg = errs.length
        ? `Some files were rejected (${errs.join(", ")}).`
        : "No valid files selected.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsOptimizing(true);
    setOptState({
      total: valid.length,
      currentIndex: 0,
      currentPercent: 0,
      fileName: null,
    });

    const added: MediaItem[] = [];
    let skippedAfterCompress = false;

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const isVideo = file.type.startsWith("video/");
      const perFileTargetBytes = isVideo ? VIDEO_TARGET_BYTES : IMAGE_MAX_BYTES;

      setOptState({
        total: valid.length,
        currentIndex: i,
        currentPercent: 0,
        fileName: file.name,
      });

      const baseVideo: VideoOptions = {
        maxWidth: 960,
        maxHeight: 960,
        fps: 24,
        preset: "medium",
        attempts: 5,
        audioBitrate: "48k",
      };

      const runOptimize = (vOverride?: Partial<VideoOptions>) =>
        optimizeMedia(
          file,
          {
            maxImageWidth: 2048,
            maxImageHeight: 2048,
            imageQuality: 0.82,
            maxBytes: perFileTargetBytes,
            ...(isVideo
              ? { video: { ...baseVideo, ...(vOverride || {}) } }
              : {}),
          },
          (p) => {
            const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
            setOptState((s) => ({
              ...s,
              currentIndex: i,
              currentPercent: pct,
              fileName: file.name,
            }));
          }
        );

      let result = await runOptimize();
      let optimized = result.file;

      setOptState((s) => ({ ...s, currentPercent: 100 }));

      if (isVideo && optimized.size > perFileTargetBytes) {
        const fallback = await runOptimize({
          maxWidth: 640,
          maxHeight: 640,
          fps: 18,
          audioBitrate: "32k",
          preset: "medium",
          attempts: 6,
        });
        if (fallback.file.size < optimized.size) {
          result = fallback;
          optimized = fallback.file;
        }
      }

      if (optimized.size > perFileTargetBytes) {
        skippedAfterCompress = true;
        continue;
      }

      added.push({ file: optimized, url: URL.createObjectURL(optimized) });
      await new Promise((r) => setTimeout(r, 0));
    }

    if (rejectedVideos || rejectedImages || skippedAfterCompress) {
      const parts = [];
      if (rejectedVideos)
        parts.push(`${rejectedVideos} video(s) not supported`);
      if (rejectedImages)
        parts.push(`${rejectedImages} image(s) > ${IMAGE_MAX_MB}MB`);
      if (skippedAfterCompress)
        parts.push(`some images exceeded ${IMAGE_MAX_MB}MB after optimization`);
      const msg = `Some files were skipped (${parts.join(", ")}).`;
      setError(msg);
      toast.error(msg);
    }

    setMedia((prev) => [...prev, ...added]);
    setIsOptimizing(false);
  };

  const handleMediaInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await addFiles(files);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const removeMediaAt = (idx: number) => {
    setMedia((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearAllMedia = () => {
    media.forEach((m) => URL.revokeObjectURL(m.url));
    setMedia([]);
  };

  React.useEffect(() => {
    return () => {
      media.forEach((m) => URL.revokeObjectURL(m.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
  };
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handlePost = async () => {
    if (!canPost || isOptimizing) return;
    setError(null);

    try {
      const form = new FormData();
      form.append("text", text.trim());
      form.append(
        "category",
        category === "Others" ? customCategory.trim() : category
      );
      form.append(
        "subCategory",
        subCategory === "others" || category === "Others"
          ? customSubCategory.trim()
          : subCategory
      );
      form.append("modelName", model === "others" ? customModel.trim() : model);
      form.append("tags", JSON.stringify(tags));
      media.forEach((m) => form.append("files", m.file));

      const res = await fetch("/api/posts", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Failed to create post";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Post created");
      setText("");
      clearAllMedia();
      setTags([]);
      setModel("");
      setCustomModel("");
      setCategory("Image");
      setCustomCategory("");
      setSubCategory("");
      setCustomSubCategory("");
    } catch (e: any) {
      const msg = e?.message || "Unexpected error";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">Create</h1>
            <p className="text-sm text-muted-foreground">
              Share a prompt or upload visuals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setText("");
                clearAllMedia();
                setTags([]);
                setModel("");
                setCustomModel("");
                setCategory("Image");
                setCustomCategory("");
                setSubCategory("");
                setCustomSubCategory("");
                setError(null);
              }}
              disabled={isOptimizing}
            >
              Reset
            </Button>
            <Button
              className="rounded-full px-5"
              disabled={!canPost}
              onClick={handlePost}
            >
              {isOptimizing ? "Optimizing..." : "Post"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <section className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Prompt</label>
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handlePost();
                    }
                  }}
                  placeholder="Write something thoughtful..."
                  className={cn(
                    "min-h-[180px] text-base resize-none",
                    "focus-visible:ring-1"
                  )}
                  disabled={isOptimizing}
                />
                <div className="absolute right-2 bottom-2 text-xs text-muted-foreground select-none">
                  <span
                    className={cn(
                      remaining < 0 && "text-red-600",
                      remaining >= 0 && remaining <= 25 && "text-amber-600"
                    )}
                  >
                    {Math.max(remaining, -999)}/2000
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Attachments</label>
                {media.length > 0 && (
                  <button
                    onClick={clearAllMedia}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    disabled={isOptimizing}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="relative">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isOptimizing) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "group relative block w-full cursor-pointer rounded-xl border border-dashed p-6 transition",
                    "bg-muted/30 hover:bg-muted/50",
                    isDragging && "border-primary/40 bg-muted",
                    isOptimizing && "opacity-70 pointer-events-none"
                  )}
                >
                  <div className="flex flex-col items-center justify-center text-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Click to upload</span> or
                      drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Up to {MAX_FILES} files · Images only (≤ {IMAGE_MAX_MB}MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleMediaInput}
                    disabled={isOptimizing}
                  />
                </label>

                {isOptimizing && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        Optimizing {optState.fileName ?? "media"} (
                        {optState.currentIndex + 1}/{optState.total})
                      </div>
                      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-[width] duration-150"
                          style={{ width: `${optState.currentPercent}%` }}
                        />
                      </div>
                      <div className="text-sm tabular-nums">
                        {optState.currentPercent}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {media.length > 0 && (
                <div
                  className={cn(
                    "grid gap-3",
                    media.length === 1 && "grid-cols-1",
                    media.length === 2 && "grid-cols-2",
                    media.length >= 3 && "grid-cols-2 md:grid-cols-3"
                  )}
                >
                  {media.map((item, idx) => {
                    const isImage = item.file.type.startsWith("image");
                    return (
                      <div
                        key={idx}
                        className="group relative overflow-hidden rounded-lg border bg-muted"
                      >
                        {isImage ? (
                          <img
                            src={item.url}
                            alt={item.file.name}
                            className="w-full aspect-[4/3] object-cover"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full aspect-[4/3] object-cover"
                            controls
                          />
                        )}
                        <button
                          onClick={() => removeMediaAt(idx)}
                          className={cn(
                            "absolute top-2 right-2 rounded-full p-1.5",
                            "bg-background/80 backdrop-blur border",
                            "opacity-90 hover:opacity-100 transition"
                          )}
                          aria-label="Remove media"
                          title="Remove"
                          disabled={isOptimizing}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={isOptimizing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
              {model === "others" && (
                <Input
                  placeholder="Enter custom model"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  disabled={isOptimizing}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={category}
                onValueChange={(val) => {
                  setCategory(val);
                  setSubCategory("");
                  setCustomSubCategory("");
                }}
                disabled={isOptimizing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Brainstorm">Brainstorm</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
              {category === "Others" && (
                <Input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  disabled={isOptimizing}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              {category !== "Others" ? (
                <Select
                  value={subCategory}
                  onValueChange={setSubCategory}
                  disabled={isOptimizing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories[category].map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter custom subcategory"
                  value={customSubCategory}
                  onChange={(e) => setCustomSubCategory(e.target.value)}
                  disabled={isOptimizing}
                />
              )}
              {subCategory === "others" && category !== "Others" && (
                <Input
                  placeholder="Enter custom subcategory"
                  value={customSubCategory}
                  onChange={(e) => setCustomSubCategory(e.target.value)}
                  disabled={isOptimizing}
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="Add tags (Enter or Tab)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={isOptimizing}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-sm border bg-muted/60 flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== idx))
                        }
                        className="opacity-70 hover:opacity-100"
                        aria-label={`Remove tag ${tag}`}
                        disabled={isOptimizing}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
