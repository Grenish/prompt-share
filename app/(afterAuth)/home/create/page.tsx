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
import {
  Image as ImageIcon,
  X,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { optimizeMedia, type OptimizeOptions } from "@/lib/media-optimizer";
import {
  PROVIDERS,
  MODELS_BY_PROVIDER,
  CATEGORY_OPTIONS,
  SUB_CATEGORIES,
} from "@/lib/model-options";

type MediaItem = { file: File; url: string };
type VideoOptions = NonNullable<OptimizeOptions["video"]>;

function graphemeLength(input: string): number {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const _ of seg.segment(input)) count++;
    return count;
  }
  return Array.from(input).length;
}

export default function DashboardCreatePage() {
  const MAX_FILES = 4;
  const IMAGE_MAX_MB = 5;
  const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;
  const MAX_CHARS = 2000;

  const [text, setText] = React.useState("");
  const [media, setMedia] = React.useState<MediaItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [optState, setOptState] = React.useState({
    total: 0,
    currentIndex: 0,
    currentPercent: 0,
    fileName: null as string | null,
  });

  const [isPosting, setIsPosting] = React.useState(false);
  const [postProgress, setPostProgress] = React.useState(0);
  const postIntervalRef = React.useRef<number | null>(null);
  const postAbortRef = React.useRef<AbortController | null>(null);

  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");

  const [provider, setProvider] = React.useState<string>("");
  const [customProvider, setCustomProvider] = React.useState<string>("");
  const [modelKey, setModelKey] = React.useState<string>("");
  const [customModel, setCustomModel] = React.useState<string>("");
  const [modelOpen, setModelOpen] = React.useState(false);

  const [category, setCategory] = React.useState<string>("Text Generation");
  const [customCategory, setCustomCategory] = React.useState<string>("");
  const [subCategory, setSubCategory] = React.useState<string>("");
  const [customSubCategory, setCustomSubCategory] = React.useState<string>("");

  const [showErrors, setShowErrors] = React.useState(false);

  const charCount = React.useMemo(() => graphemeLength(text), [text]);
  const remaining = MAX_CHARS - charCount;

  // Tag helpers
  const toSlug = (raw: string) =>
    raw
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const slugifyTag = (raw: string) => toSlug(raw);

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const t = slugifyTag(trimmed).slice(0, 40); // small guardrail
    if (!t) return;
    if (tags.includes(t)) {
      toast.message(`Tag "${t}" already added`);
      return;
    }
    if (tags.length >= 5) {
      toast.error("You can add up to 5 tags.");
      return;
    }
    setTags((prev) => [...prev, t]);
  };

  const addManyTags = (raw: string) => {
    const parts = raw
      .split(/[,\n]+/)
      .map((p) => slugifyTag(p).slice(0, 40))
      .filter(Boolean);
    if (!parts.length) return;
    const toAdd: string[] = [];
    for (const p of parts) {
      if (toAdd.includes(p) || tags.includes(p)) continue;
      if (tags.length + toAdd.length >= 5) break;
      toAdd.push(p);
    }
    if (toAdd.length === 0) {
      toast.error("Max 5 tags, or tags already added.");
      return;
    }
    setTags((prev) => [...prev, ...toAdd]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === "Enter" || e.key === "Tab" || e.key === ",") &&
      tagInput.trim()
    ) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Media
  const addFiles = async (files: File[]) => {
    setError(null);
    const currentCount = media.length;
    if (currentCount >= MAX_FILES) {
      const msg = `You can attach up to ${MAX_FILES} files.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    const availableSlots = MAX_FILES - currentCount;
    const picked = files.slice(0, availableSlots);

    const valid: File[] = [];
    let rejectedVideos = 0;
    let rejectedImages = 0;

    for (const f of picked) {
      if (f.type.startsWith("video/")) {
        rejectedVideos++;
      } else if (f.type.startsWith("image/")) {
        if (f.size > IMAGE_MAX_BYTES) rejectedImages++;
        else valid.push(f);
      }
    }

    if (!valid.length) {
      const errs = [];
      if (rejectedVideos) errs.push(`${rejectedVideos} video(s) not supported`);
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
      const perFileTargetBytes = IMAGE_MAX_BYTES;

      setOptState((s) => ({
        ...s,
        currentIndex: i,
        currentPercent: 0,
        fileName: file.name,
      }));

      const runOptimize = () =>
        optimizeMedia(
          file,
          {
            maxImageWidth: 2048,
            maxImageHeight: 2048,
            imageQuality: 0.82,
            maxBytes: perFileTargetBytes,
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
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
      // abort an in-flight post on unmount
      postAbortRef.current?.abort();
      if (postIntervalRef.current)
        window.clearInterval(postIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation
  const promptValid = text.trim().length > 0 && remaining >= 0;
  const providerValid =
    provider && (provider !== "others" || customProvider.trim().length > 0);
  const modelSelectionValid =
    (provider === "others" && customModel.trim().length > 0) ||
    (provider !== "others" &&
      modelKey &&
      (modelKey !== "other" || customModel.trim().length > 0));
  const modelValid = !!providerValid && !!modelSelectionValid;

  const categoryValid =
    category && (category !== "Others" || customCategory.trim().length > 0);
  const subCategoryValid =
    (category === "Others" && customSubCategory.trim().length > 0) ||
    (category !== "Others" &&
      ((subCategory && subCategory !== "others") ||
        (subCategory === "others" && customSubCategory.trim().length > 0)));
  const tagsValid = tags.length >= 1 && tags.length <= 5;

  const requiredOk =
    promptValid && modelValid && categoryValid && subCategoryValid && tagsValid;
  const busy = isOptimizing || isPosting;
  const canPost = requiredOk && !busy;

  const providerLabel =
    provider === "others"
      ? customProvider.trim()
      : PROVIDERS.find((p) => p.id === provider)?.label || "";
  const selectedModelLabel =
    provider === "others"
      ? customModel.trim()
      : modelKey === "other"
      ? customModel.trim()
      : MODELS_BY_PROVIDER[provider]?.find((m) => m.key === modelKey)?.label ||
        "";

  // Indeterminate progress driver for "Posting…"
  const startPostProgress = React.useCallback(() => {
    setPostProgress(10);
    if (postIntervalRef.current) window.clearInterval(postIntervalRef.current);
    postIntervalRef.current = window.setInterval(() => {
      setPostProgress((p) => (p < 90 ? p + 2 : 90));
    }, 120);
  }, []);

  const stopPostProgress = React.useCallback((to = 100) => {
    if (postIntervalRef.current) {
      window.clearInterval(postIntervalRef.current);
      postIntervalRef.current = null;
    }
    setPostProgress(to);
    // allow the bar to reach 100% before hiding
    window.setTimeout(() => setPostProgress(0), 300);
  }, []);

  const handlePost = async () => {
    if (!requiredOk || busy) {
      setShowErrors(true);
      if (!busy) toast.error("Please fill all required fields.");
      return;
    }

    setError(null);
    setIsPosting(true);
    startPostProgress();

    const controller = new AbortController();
    postAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 45_000);

    try {
      const providerSlug =
        provider === "others" ? toSlug(customProvider) : provider;
      const providerModels = MODELS_BY_PROVIDER[provider] || [];
      const selectedPresetModel = providerModels.find(
        (m) => m.key === modelKey
      );
      const resolvedModelLabel = selectedModelLabel.trim();
      const resolvedModelKey =
        provider === "others" || modelKey === "other"
          ? toSlug(customModel)
          : modelKey;
      const resolvedModelKind =
        provider === "others"
          ? "custom"
          : selectedPresetModel?.kind || (resolvedModelKey ? "custom" : "");

      const resolvedCategory =
        category === "Others" ? customCategory.trim() : category;
      const resolvedSubCategory =
        category === "Others" || subCategory === "others"
          ? customSubCategory.trim()
          : subCategory;
      const categorySlug = toSlug(resolvedCategory);
      const subCategorySlug = toSlug(resolvedSubCategory);

      const combinedModelName = [providerLabel, resolvedModelLabel]
        .filter(Boolean)
        .join(" > ")
        .trim();

      const form = new FormData();
      form.append("text", text.trim());
      form.append("modelName", combinedModelName);
      form.append("category", resolvedCategory);
      form.append("subCategory", resolvedSubCategory);
      if (categorySlug) form.append("categorySlug", categorySlug);
      if (subCategorySlug) form.append("subCategorySlug", subCategorySlug);
      form.append("modelProviderLabel", providerLabel);
      if (providerSlug) form.append("modelProviderSlug", providerSlug);
      if (resolvedModelKey) form.append("modelKey", resolvedModelKey);
      if (resolvedModelLabel) form.append("modelLabel", resolvedModelLabel);
      if (resolvedModelKind) form.append("modelKind", resolvedModelKind);
      form.append("tags", JSON.stringify(tags));
      media.forEach((m) => form.append("files", m.file));

      const res = await fetch("/api/posts", {
        method: "POST",
        body: form,
        signal: controller.signal,
        // credentials are same-origin by default in Next.js; add if needed:
        // credentials: "same-origin",
        // Use custom CSRF header in your API if implemented:
        // headers: { "X-CSRF-Token": csrfToken }
      });

      let data: any = null;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          // ignore JSON parse errors
        }
      }

      if (!res.ok || data?.ok === false) {
        const msg = data?.error || `Failed to create post (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }

      stopPostProgress(100);
      toast.success("Post created");
      resetAll();
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Request timed out. Please try again.");
        toast.error("Request timed out. Please try again.");
      } else {
        const msg = e?.message || "Unexpected error";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      window.clearTimeout(timeout);
      postAbortRef.current = null;
      setIsPosting(false);
      stopPostProgress();
    }
  };

  const resetAll = () => {
    setText("");
    clearAllMedia();
    setTags([]);
    setProvider("");
    setCustomProvider("");
    setModelKey("");
    setCustomModel("");
    setCategory("Text Generation");
    setCustomCategory("");
    setSubCategory("");
    setCustomSubCategory("");
    setError(null);
    setShowErrors(false);
  };

  const headerProgressActive = isOptimizing || isPosting;
  const headerProgress = isOptimizing ? optState.currentPercent : postProgress;

  return (
    <div className="min-h-screen bg-background" aria-busy={busy}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight">Create</h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={resetAll}
              disabled={busy}
            >
              Reset
            </Button>
            <Button
              type="button"
              className="rounded-full px-4"
              disabled={!canPost}
              onClick={handlePost}
            >
              {isPosting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </span>
              ) : isOptimizing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Optimizing...
                </span>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>

        {headerProgressActive && (
          <div className="h-[2px] bg-muted relative">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-[width] duration-150"
              style={{
                width: `${Math.min(100, Math.max(0, headerProgress))}%`,
              }}
            />
          </div>
        )}
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Subtle blocking overlay while posting */}
        {isPosting && (
          <div
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/40 backdrop-blur-sm"
            aria-hidden
          >
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border bg-background/90 px-3 py-1.5 text-sm shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </div>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8",
            busy && "opacity-95"
          )}
        >
          {/* Left: Prompt + Media */}
          <section aria-disabled={busy}>
            {/* Prompt */}
            <div className="pb-6 border-b">
              <label className="text-sm font-medium flex items-center gap-1">
                Prompt <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !busy)
                      handlePost();
                  }}
                  placeholder="Write your prompt..."
                  className={cn(
                    "min-h-[180px] text-base resize-none pr-12",
                    showErrors && !promptValid && "ring-1 ring-destructive"
                  )}
                  aria-invalid={showErrors && !promptValid}
                  disabled={busy}
                />
                <div className="absolute right-2 bottom-2 text-xs select-none tabular-nums">
                  <span
                    className={cn(
                      "text-muted-foreground",
                      remaining < 0 && "text-destructive"
                    )}
                  >
                    {Math.max(remaining, -999)}/{MAX_CHARS}
                  </span>
                </div>
              </div>
              {showErrors && !promptValid && (
                <p className="mt-2 text-xs text-destructive">
                  Prompt is required and must be within {MAX_CHARS} characters.
                </p>
              )}
            </div>

            {/* Media */}
            <div className="py-6 border-b">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Attachments</label>
                {media.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllMedia}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    disabled={busy}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-dashed px-3 py-3 transition",
                  isDragging && "border-primary/40 bg-muted/30"
                )}
                aria-label="Drop images to attach"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy || media.length >= MAX_FILES}
                >
                  <ImageIcon className="w-4 h-4" />
                  Add images
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaInput}
                  disabled={busy}
                />
                <span className="text-xs text-muted-foreground">
                  Images only (≤ {IMAGE_MAX_MB}MB each) ·{" "}
                  {Math.max(0, MAX_FILES - media.length)} slot(s) left
                </span>
              </div>

              {error && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {media.length > 0 && (
                <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {media.map((item, idx) => {
                    const isImage = item.file.type.startsWith("image/");
                    return (
                      <div
                        key={idx}
                        className="group relative overflow-hidden rounded-md border bg-muted"
                      >
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.url}
                            alt={item.file.name}
                            className="w-full aspect-[4/3] object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full aspect-[4/3] object-cover"
                            controls
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaAt(idx)}
                          className={cn(
                            "absolute top-2 right-2 rounded-full p-1.5",
                            "bg-background/80 backdrop-blur border",
                            "opacity-90 hover:opacity-100 transition"
                          )}
                          aria-label="Remove media"
                          title="Remove"
                          disabled={busy}
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

          {/* Right: Details */}
          <aside className="md:border-l md:pl-8 space-y-8" aria-disabled={busy}>
            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Tags <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Add up to 5 tags. We’ll convert to lowercase-with-hyphens.
              </p>
              <div
                className={cn(
                  "mt-1.5 flex flex-wrap items-center gap-2 rounded-md border px-2 py-2",
                  showErrors && !tagsValid && "ring-1 ring-destructive"
                )}
                aria-invalid={showErrors && !tagsValid}
              >
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 h-7 leading-7 rounded-full text-xs border bg-muted/60 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                      className="opacity-70 hover:opacity-100"
                      aria-label={`Remove tag ${tag}`}
                      disabled={busy}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      addTag(tagInput);
                      setTagInput("");
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted) {
                      e.preventDefault();
                      addManyTags(pasted);
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="h-9 min-w-[120px] flex-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={busy || tags.length >= 5}
                />
              </div>

              {/* Custom Provider/Model panel when provider = Others */}
              {provider === "others" ? (
                <div className="mt-1 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Custom model</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-7 px-0"
                      onClick={() => {
                        setProvider("");
                        setCustomProvider("");
                        setModelKey("");
                        setCustomModel("");
                      }}
                    >
                      Back to presets
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Provider (e.g., OpenAI)"
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      disabled={busy}
                      className={cn(
                        "h-9",
                        showErrors &&
                          !providerValid &&
                          "ring-1 ring-destructive"
                      )}
                      aria-invalid={showErrors && !providerValid}
                    />
                    <Input
                      placeholder="Model (e.g., GPT-4o)"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      disabled={busy}
                      className={cn(
                        "h-9",
                        showErrors &&
                          !modelSelectionValid &&
                          "ring-1 ring-destructive"
                      )}
                      aria-invalid={showErrors && !modelSelectionValid}
                    />
                  </div>
                  {showErrors && !modelValid && (
                    <p className="mt-2 text-xs text-destructive">
                      Please enter provider and model.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    {/* Provider */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Provider
                      </span>
                      <Select
                        value={provider}
                        onValueChange={(val) => {
                          setProvider(val);
                          setModelKey("");
                          setCustomModel("");
                          if (val !== "others") setCustomProvider("");
                        }}
                        disabled={busy}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9",
                            "w-full",
                            showErrors &&
                              !providerValid &&
                              "ring-1 ring-destructive"
                          )}
                          aria-invalid={showErrors && !providerValid}
                        >
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDERS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model combobox */}
                    <div className="space-y-1 min-w-0">
                      <span className="text-xs text-muted-foreground">
                        Model
                      </span>
                      <Popover open={modelOpen} onOpenChange={setModelOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={modelOpen}
                            className={cn(
                              "h-9 w-full justify-between text-left font-normal min-w-0",
                              showErrors &&
                                !modelSelectionValid &&
                                "ring-1 ring-destructive"
                            )}
                            disabled={busy || !provider}
                          >
                            <span className="truncate">
                              {modelKey
                                ? MODELS_BY_PROVIDER[provider]?.find(
                                    (m) => m.key === modelKey
                                  )?.label ||
                                  (modelKey === "other"
                                    ? "Other (custom)"
                                    : "Select a model")
                                : "Select a model"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="p-0 w-[min(90vw,380px)]"
                        >
                          <Command>
                            <CommandInput placeholder="Search models..." />
                            <CommandEmpty>No model found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup
                                heading={`${
                                  provider
                                    ? PROVIDERS.find((p) => p.id === provider)
                                        ?.label ?? "Provider"
                                    : "Provider"
                                } models`}
                              >
                                {(MODELS_BY_PROVIDER[provider] || []).map(
                                  (m) => (
                                    <CommandItem
                                      key={m.key}
                                      value={m.label}
                                      onSelect={() => {
                                        setModelKey(m.key);
                                        if (m.key !== "other")
                                          setCustomModel("");
                                        setModelOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          modelKey === m.key
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate">
                                        {m.label}
                                      </span>
                                      <span className="ml-auto text-xs rounded px-1.5 py-0.5 border bg-muted text-muted-foreground">
                                        {m.kind}
                                      </span>
                                    </CommandItem>
                                  )
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Inline custom model input when "Other (custom)" is chosen for a preset provider */}
                  {provider && modelKey === "other" && (
                    <div className="mt-2 rounded-md border bg-muted/30 p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">
                          Custom model for{" "}
                          {PROVIDERS.find((p) => p.id === provider)?.label}
                        </span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-7 px-0"
                          onClick={() => {
                            setModelKey("");
                            setCustomModel("");
                          }}
                        >
                          Back to list
                        </Button>
                      </div>
                      <Input
                        placeholder="Enter custom model"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        disabled={busy}
                        className={cn(
                          "h-9",
                          showErrors &&
                            !modelSelectionValid &&
                            "ring-1 ring-destructive"
                        )}
                        aria-invalid={showErrors && !modelSelectionValid}
                      />
                    </div>
                  )}

                  {showErrors && !modelValid && (
                    <p className="text-xs text-destructive mt-1">
                      Please select a provider and model (or enter a custom
                      value).
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Category & Subcategory */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Category <span className="text-destructive">*</span>
              </label>

              {/* Custom Category panel when category = Others */}
              {category === "Others" ? (
                <div className="mt-1 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">Custom category</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-7 px-0"
                      onClick={() => {
                        setCategory("");
                        setCustomCategory("");
                        setSubCategory("");
                        setCustomSubCategory("");
                      }}
                    >
                      Back to presets
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      disabled={busy}
                      className={cn(
                        "h-9",
                        showErrors &&
                          !categoryValid &&
                          "ring-1 ring-destructive"
                      )}
                      aria-invalid={showErrors && !categoryValid}
                    />
                    <Input
                      placeholder="Subcategory name"
                      value={customSubCategory}
                      onChange={(e) => setCustomSubCategory(e.target.value)}
                      disabled={busy}
                      className={cn(
                        "h-9",
                        showErrors &&
                          !subCategoryValid &&
                          "ring-1 ring-destructive"
                      )}
                      aria-invalid={showErrors && !subCategoryValid}
                    />
                  </div>
                  {(showErrors && !categoryValid) ||
                  (showErrors && !subCategoryValid) ? (
                    <p className="mt-2 text-xs text-destructive">
                      Category and Subcategory are required.
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Select
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val);
                        setSubCategory("");
                        setCustomSubCategory("");
                        if (val !== "Others") setCustomCategory("");
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9",
                          showErrors &&
                            !categoryValid &&
                            "ring-1 ring-destructive"
                        )}
                        aria-invalid={showErrors && !categoryValid}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Subcategory select */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Subcategory
                      </span>
                      <Select
                        value={subCategory}
                        onValueChange={setSubCategory}
                        disabled={busy}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-9",
                            showErrors &&
                              !subCategoryValid &&
                              "ring-1 ring-destructive"
                          )}
                          aria-invalid={showErrors && !subCategoryValid}
                        >
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUB_CATEGORIES[
                            category as keyof typeof SUB_CATEGORIES
                          ].map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                          <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Inline custom subcategory input when "Others" chosen in subcategory */}
                    {subCategory === "others" && (
                      <div className="rounded-md border bg-muted/30 p-2 mt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">
                            Custom subcategory
                          </span>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-7 px-0"
                            onClick={() => {
                              setSubCategory("");
                              setCustomSubCategory("");
                            }}
                          >
                            Back to list
                          </Button>
                        </div>
                        <Input
                          placeholder="Enter custom subcategory"
                          value={customSubCategory}
                          onChange={(e) => setCustomSubCategory(e.target.value)}
                          disabled={busy}
                          className={cn(
                            "h-9 mt-2",
                            showErrors &&
                              !subCategoryValid &&
                              "ring-1 ring-destructive"
                          )}
                          aria-invalid={showErrors && !subCategoryValid}
                        />
                      </div>
                    )}

                    {showErrors && !categoryValid && (
                      <p className="text-xs text-destructive">
                        Category is required.
                      </p>
                    )}
                    {showErrors && !subCategoryValid && (
                      <p className="text-xs text-destructive">
                        Subcategory is required.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Tip: Press Ctrl/⌘ + Enter to post.
        </p>
      </main>
    </div>
  );
}
