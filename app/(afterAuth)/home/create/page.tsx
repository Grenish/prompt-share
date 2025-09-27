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

// Pre-made options for a prompt-engineering community
const MODEL_OPTIONS = [
  // Text models
  { value: "openai-gpt-4o", label: "OpenAI — GPT‑4o" },
  { value: "openai-gpt-4o-mini", label: "OpenAI — GPT‑4o mini" },
  { value: "openai-o4-mini", label: "OpenAI — o4 mini" },
  {
    value: "anthropic-claude-3-5-sonnet",
    label: "Anthropic — Claude 3.5 Sonnet",
  },
  {
    value: "anthropic-claude-3-5-haiku",
    label: "Anthropic — Claude 3.5 Haiku",
  },
  { value: "google-gemini-1-5-pro", label: "Google — Gemini 1.5 Pro" },
  { value: "google-gemini-1-5-flash", label: "Google — Gemini 1.5 Flash" },
  { value: "meta-llama-3-1-8b", label: "Meta — Llama 3.1 8B Instruct" },
  { value: "meta-llama-3-1-70b", label: "Meta — Llama 3.1 70B Instruct" },
  { value: "mistral-large", label: "Mistral — Mistral Large" },
  { value: "cohere-command-r-plus", label: "Cohere — Command R+" },
  { value: "perplexity-sonar-large", label: "Perplexity — Sonar Large" },
  { value: "xai-grok-2", label: "xAI — Grok‑2" },
  // Image models (still useful for prompt sharing)
  { value: "openai-dalle-3", label: "OpenAI — DALL·E 3 (image)" },
  { value: "midjourney-v6", label: "Midjourney v6 (image)" },
  { value: "stability-sdxl", label: "Stable Diffusion XL (image)" },
  { value: "flux-1-1", label: "Flux 1.1 (image)" },
  { value: "ideogram-1", label: "Ideogram 1 (image)" },
  { value: "playground-v2-5", label: "Playground v2.5 (image)" },
  { value: "others", label: "Others" },
] as const;

const CATEGORY_OPTIONS = [
  "Text Generation",
  "Coding & Dev",
  "Research & Analysis",
  "Education & Tutoring",
  "Marketing & SEO",
  "Product & UX",
  "Data & SQL",
  "System / Instruction",
  "Agents & Tools",
  "Evaluation / Benchmarks",
  "Image Generation",
  "Audio & Voice",
  "Video & Motion",
  "Roleplay & Persona",
  "Brainstorming",
  "Automation / Scripting",
  "Others",
] as const;

const SUB_CATEGORIES: Record<(typeof CATEGORY_OPTIONS)[number], string[]> = {
  "Text Generation": [
    "General Chat",
    "Summarization",
    "Translation",
    "Rewrite / Paraphrase",
    "Persona",
    "Socratic",
    "Critique / Review",
    "Explain",
  ],
  "Coding & Dev": [
    "Bug Fix",
    "Refactor",
    "Code Review",
    "Unit Tests",
    "Generate Snippets",
    "Docstrings",
    "Regex",
    "Optimization",
  ],
  "Research & Analysis": [
    "Literature Review",
    "Compare / Contrast",
    "SWOT",
    "Pros & Cons",
    "Data Extraction",
    "Fact‑check",
  ],
  "Education & Tutoring": [
    "Lesson Plan",
    "Quiz",
    "Flashcards",
    "Step‑by‑step",
    "ELI5",
    "Tutor Persona",
  ],
  "Marketing & SEO": [
    "Ad Copy",
    "Product Description",
    "Email",
    "Landing Page Copy",
    "SEO Keywords",
    "Meta Descriptions",
  ],
  "Product & UX": [
    "User Stories",
    "Acceptance Criteria",
    "UX Heuristics",
    "Onboarding",
    "Microcopy",
    "Wireframe Prompts",
  ],
  "Data & SQL": [
    "SQL Query",
    "Pandas / Dataframes",
    "Data Cleaning",
    "Visualization",
    "Prompting over Tables",
    "Schema Design",
  ],
  "System / Instruction": [
    "System Prompt",
    "Safety / Guardrails",
    "Style Guide",
    "Function / Tool Spec",
    "Memory / Persona",
    "JSON Schema",
  ],
  "Agents & Tools": [
    "ReAct",
    "RAG",
    "Planner",
    "Tool Use",
    "Retriever",
    "Multi‑step Agent",
  ],
  "Evaluation / Benchmarks": [
    "Rubric",
    "Test Cases",
    "Adversarial",
    "Self‑critique",
    "Judge Prompt",
  ],
  "Image Generation": [
    "Photography",
    "Concept Art",
    "Product Shot",
    "Logo",
    "UI Mockup",
    "Illustration",
    "Anime",
    "Sticker",
    "3D / Render",
  ],
  "Audio & Voice": [
    "TTS Style",
    "Lyrics",
    "Podcast Outline",
    "Voice Clone Prompt",
  ],
  "Video & Motion": [
    "Storyboard",
    "Shot List",
    "Scene Description",
    "VFX Prompt",
  ],
  "Roleplay & Persona": ["Character", "Interview", "Simulation", "Game Master"],
  Brainstorming: ["Ideas", "Names", "Outlines", "Mind Map"],
  "Automation / Scripting": [
    "Shell",
    "Python Script",
    "Zapier / Workflow",
    "API Prompt",
  ],
  Others: [],
};

export default function DashboardCreatePage() {
  const MAX_FILES = 4;
  const IMAGE_MAX_MB = 5;
  const VIDEO_RAW_MAX_MB = 10; // videos currently disabled
  const VIDEO_TARGET_MB = 1;

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

  const [category, setCategory] = React.useState<string>("Text Generation");
  const [customCategory, setCustomCategory] = React.useState<string>("");

  const [subCategory, setSubCategory] = React.useState<string>("");
  const [customSubCategory, setCustomSubCategory] = React.useState<string>("");

  const [showErrors, setShowErrors] = React.useState(false);

  const remaining = MAX_CHARS - text.length;

  // Tag helpers (lowercase + hyphens, unique, max 5)
  const slugifyTag = (raw: string) =>
    raw
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const addTag = (raw: string) => {
    if (!raw) return;
    const t = slugifyTag(raw);
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
      .map(slugifyTag)
      .filter(Boolean);
    if (!parts.length) return;
    let toAdd: string[] = [];
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validation
  const promptValid = text.trim().length > 0 && remaining >= 0;
  const modelValid =
    model && (model !== "others" || customModel.trim().length > 0);
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

  const canPost = requiredOk && !isOptimizing;

  const handlePost = async () => {
    if (!requiredOk) {
      setShowErrors(true);
      toast.error("Please fill all required fields.");
      return;
    }
    if (isOptimizing) return;

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
      resetAll();
    } catch (e: any) {
      const msg = e?.message || "Unexpected error";
      setError(msg);
      toast.error(msg);
    }
  };

  const resetAll = () => {
    setText("");
    clearAllMedia();
    setTags([]);
    setModel("");
    setCustomModel("");
    setCategory("Text Generation");
    setCustomCategory("");
    setSubCategory("");
    setCustomSubCategory("");
    setError(null);
    setShowErrors(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header with single CTA and global progress */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight">Create</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={resetAll}
              disabled={isOptimizing}
            >
              Reset
            </Button>
            <Button
              className="rounded-full px-4"
              disabled={!canPost}
              onClick={handlePost}
            >
              {isOptimizing ? "Optimizing..." : "Post"}
            </Button>
          </div>
        </div>
        {isOptimizing && (
          <div className="h-[2px] bg-muted relative">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-[width] duration-150"
              style={{ width: `${optState.currentPercent}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Two-column on desktop, stacked on mobile. No cards. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Prompt + Media */}
          <section className="md:col-span-2">
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
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                      handlePost();
                  }}
                  placeholder="Write your prompt..."
                  className={cn(
                    "min-h-[180px] text-base resize-none pr-12",
                    showErrors && !promptValid && "ring-1 ring-destructive"
                  )}
                  aria-invalid={showErrors && !promptValid}
                  disabled={isOptimizing}
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
                    onClick={clearAllMedia}
                    className="text-sm text-muted-foreground hover:text-foreground"
                    disabled={isOptimizing}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isOptimizing) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "mt-3 flex flex-wrap items-center gap-3 rounded-md border border-dashed px-3 py-3 transition",
                  isDragging && "border-primary/40 bg-muted/30"
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOptimizing || media.length >= MAX_FILES}
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
                  disabled={isOptimizing}
                />
                <span className="text-xs text-muted-foreground">
                  Images only (≤ {IMAGE_MAX_MB}MB each) ·{" "}
                  {MAX_FILES - media.length} slot(s) left
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

          {/* Right: Required details */}
          <aside className="md:col-span-1 md:border-l md:pl-6 space-y-6">
            {/* Tags */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Tags <span className="text-destructive">*</span>
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Add up to 5 tags. We’ll convert to lowercase-with-hyphens.
              </p>
              <div
                className={cn(
                  "mt-2 flex flex-wrap items-center gap-2 rounded-md border p-2",
                  showErrors && !tagsValid && "ring-1 ring-destructive"
                )}
                aria-invalid={showErrors && !tagsValid}
              >
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-full text-xs border bg-muted/60 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                      className="opacity-70 hover:opacity-100"
                      aria-label={`Remove tag ${tag}`}
                      disabled={isOptimizing}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
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
                  className="min-w-[140px] flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  disabled={isOptimizing || tags.length >= 5}
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {tags.length}/5
                </span>
                {showErrors && !tagsValid && (
                  <span className="text-xs text-destructive">
                    At least 1 tag required (max 5).
                  </span>
                )}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                AI Model <span className="text-destructive">*</span>
              </label>
              <div className="mt-2 space-y-2">
                <Select
                  value={model}
                  onValueChange={setModel}
                  disabled={isOptimizing}
                >
                  <SelectTrigger
                    className={cn(
                      showErrors && !modelValid && "ring-1 ring-destructive"
                    )}
                    aria-invalid={showErrors && !modelValid}
                  >
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {model === "others" && (
                  <Input
                    placeholder="Enter custom model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    disabled={isOptimizing}
                    className={cn(
                      showErrors && !modelValid && "ring-1 ring-destructive"
                    )}
                    aria-invalid={showErrors && !modelValid}
                  />
                )}
                {showErrors && !modelValid && (
                  <p className="text-xs text-destructive">
                    Please select a model or enter a custom model.
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Category <span className="text-destructive">*</span>
              </label>
              <div className="mt-2 space-y-2">
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val);
                    setSubCategory("");
                    setCustomSubCategory("");
                    if (val !== "Others") setCustomCategory("");
                  }}
                  disabled={isOptimizing}
                >
                  <SelectTrigger
                    className={cn(
                      showErrors && !categoryValid && "ring-1 ring-destructive"
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
                {category === "Others" && (
                  <Input
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    disabled={isOptimizing}
                    className={cn(
                      showErrors && !categoryValid && "ring-1 ring-destructive"
                    )}
                    aria-invalid={showErrors && !categoryValid}
                  />
                )}
                {showErrors && !categoryValid && (
                  <p className="text-xs text-destructive">
                    Category is required.
                  </p>
                )}
              </div>
            </div>

            {/* Subcategory */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                Subcategory <span className="text-destructive">*</span>
              </label>
              <div className="mt-2 space-y-2">
                {category !== "Others" ? (
                  <Select
                    value={subCategory}
                    onValueChange={setSubCategory}
                    disabled={isOptimizing}
                  >
                    <SelectTrigger
                      className={cn(
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
                ) : null}
                {(category === "Others" || subCategory === "others") && (
                  <Input
                    placeholder="Enter custom subcategory"
                    value={customSubCategory}
                    onChange={(e) => setCustomSubCategory(e.target.value)}
                    disabled={isOptimizing}
                    className={cn(
                      showErrors &&
                        !subCategoryValid &&
                        "ring-1 ring-destructive"
                    )}
                    aria-invalid={showErrors && !subCategoryValid}
                  />
                )}
                {showErrors && !subCategoryValid && (
                  <p className="text-xs text-destructive">
                    Subcategory is required.
                  </p>
                )}
              </div>
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
