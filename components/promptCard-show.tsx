"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Check, Maximize2, X } from "lucide-react";

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
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy text: ", err);
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

  const shortId = id.slice(0, 6).toUpperCase();

  return (
    <>
      <div className="relative w-full flex flex-col items-center">
        {imgSrc && (
          <div
            onClick={() => setImageOpen(true)}
            className="relative w-[90%] aspect-[16/9] -mb-12 z-20 cursor-pointer group rounded-2xl overflow-hidden shadow-lg"
          >
            <Image
              src={imgSrc}
              alt={text}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        <div
          className="relative w-full max-w-3xl flex flex-col rounded-3xl p-5 pt-14 md:p-6 md:pt-16 border border-white/20 bg-white/10 dark:border-gray-700/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-[0_6px_22px_rgba(0,0,0,0.07)] dark:shadow-[0_6px_22px_rgba(0,0,0,0.18)]"
        >
          {/* Category chips + ID */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex px-0.5 gap-1.5">
              <span className="py-0.5 px-2.5 text-[10px] rounded-full bg-white/20 border border-white/30 text-slate-700 dark:bg-gray-700/20 dark:border-gray-600/30 dark:text-slate-300">
                {category}
              </span>
              <span className="py-0.5 px-2.5 text-[10px] rounded-full bg-white/15 border border-white/25 text-slate-600 dark:bg-gray-700/10 dark:border-gray-600/20 dark:text-slate-400">
                {subCategory}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">#{shortId}</span>
          </div>

          {/* Prompt text */}
          <p className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed mb-4 line-clamp-4">
            {text}
          </p>

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleCopy}
              aria-live="polite"
              className="inline-flex items-center gap-1.5 py-1 px-2.5 text-[11px] rounded-full bg-white/30 border border-white/40 text-slate-700 hover:bg-white/40 dark:bg-gray-700/30 dark:border-gray-600/40 dark:text-slate-300 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
              title={copied ? "Copied" : "Copy prompt"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {createdAt.toLocaleDateString()}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-4 border-t border-white/20 dark:border-gray-700/50 pt-2.5 flex justify-between text-xs md:text-[13px]">
            <span className="text-slate-700 dark:text-slate-300">
              By <span className="font-semibold">{author}</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">{modelName}</span>
          </div>
        </div>
      </div>

      {/* Image modal */}
      {imageOpen && (
        <div
          onClick={() => setImageOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            className="relative w-[94vw] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageOpen(false)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <Image
              src={imgSrc!}
              alt={text}
              width={1920}
              height={1080}
              className="rounded-xl object-contain w-full h-auto"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
