"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Check, ArrowUpRight, Sparkles } from "lucide-react";

interface PromptCardShowProps {
  id: string;
  text: string;
  imgSrc?: string;
  category: string;
  subCategory: string;
  author: string;
  createdAt: Date;
  modelName: string;
}

export default function PromptCardShow({
  id,
  text,
  imgSrc,
  category,
  subCategory,
  author,
  createdAt,
  modelName,
}: PromptCardShowProps) {
  const [copied, setCopied] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!imageOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setImageOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [imageOpen]);

  const shortId = id.slice(0, 8).toUpperCase();
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="group relative w-full max-w-2xl md:max-w-3xl mx-auto px-2 sm:px-0">
        <div className="relative bg-card border border-primary/20 dark:border-0 text-card-foreground rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500">
          {imgSrc && (
            <div
              onClick={() => setImageOpen(true)}
              className="relative w-full aspect-[16/10] cursor-pointer overflow-hidden bg-muted"
            >
              <Image
                src={imgSrc}
                alt={text}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />

              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-popover/90 backdrop-blur-md rounded-full p-2">
                  <ArrowUpRight className="w-4 h-4 text-foreground" />
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-muted-foreground truncate max-w-[40vw]">
                  {category.toUpperCase()}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wider text-muted-foreground truncate max-w-[40vw]">
                  {subCategory.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground shrink-0">
                #{shortId}
              </span>
            </div>

            {/* Prompt Text */}
            <p className="text-xs sm:text-sm text-muted-foreground leading-[1.7] font-light">
              {text.length > 150 ? `${text.slice(0, 150)}...` : text}
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[38vw] sm:max-w-none">
                    {author}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formattedDate}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className={`group/btn relative overflow-hidden px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all duration-300 shrink-0 ${
                  copied
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {imageOpen && imgSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm md:backdrop-blur-xl px-2 sm:px-3"
          onClick={() => setImageOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-[100vw] md:w-[92vw] h-[100dvh] md:h-[88vh] bg-card text-card-foreground rounded-none md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media area */}
            <div className="relative w-full md:flex-1 bg-muted flex items-center justify-center h-[55vh] sm:h-[60vh] md:h-auto">
              <Image
                src={imgSrc}
                alt={text}
                width={1920}
                height={1080}
                className="object-contain w-full h-full"
                priority
              />

              {/* Floating close on mobile */}
              <button
                onClick={() => setImageOpen(false)}
                className="md:hidden absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 text-white/90 hover:bg-black/40 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Details panel */}
            <div className="w-full md:w-[380px] flex flex-col bg-card text-card-foreground border-t md:border-t-0 md:border-l border-border">
              <div className="p-4 sm:p-6 border-b border-border flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium mb-0.5 truncate">
                    {author}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {formattedDate} • {modelName}
                  </p>
                </div>
                <button
                  onClick={() => setImageOpen(false)}
                  className="hidden md:flex w-8 h-8 rounded-full items-center justify-center hover:bg-muted transition-colors group"
                  aria-label="Close"
                >
                  <svg
                    className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                    <Sparkles className="w-3 h-3" /> PROMPT {shortId}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                    CATEGORIES
                  </p>
                  <p className="text-sm">
                    {category} → {subCategory}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-medium tracking-wider text-muted-foreground">
                    PROMPT CONTENT
                  </p>
                  <div className="relative group">
                    <p className="text-sm leading-relaxed bg-muted rounded-lg p-3 sm:p-4 pr-10 sm:pr-12">
                      {text}
                    </p>
                    <button
                      onClick={handleCopy}
                      className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 rounded-md transition-all duration-200 ${
                        copied
                          ? "bg-primary text-primary-foreground"
                          : "bg-popover text-muted-foreground hover:text-foreground"
                      }`}
                      title={copied ? "Copied!" : "Copy prompt"}
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-border">
                  <p className="text-[10px] font-medium tracking-wider text-muted-foreground mb-2">
                    AI MODEL
                  </p>
                  <p className="text-sm">{modelName}</p>
                </div>
              </div>

              {/* Sticky footer for mobile ergonomics */}
              <div className="sticky bottom-0 p-3 sm:p-6 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <button
                  onClick={handleCopy}
                  className={`w-full py-2.5 sm:py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    copied
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {copied ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Copied to clipboard
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Copy className="w-4 h-4" /> Copy prompt
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
