"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface DisplayPromptBoxProps {
  className?: string;
  prompt: string;
}

export default function DisplayPromptBox({ className, prompt }: DisplayPromptBoxProps) {
  const pRef = useRef<HTMLParagraphElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!pRef.current) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(pRef.current);
    return () => observer.disconnect();
  }, []);

  const text = prompt

  const words = text.split(" ");

  const WORD_DELAY_MS = 32; // spacing between word starts
  const DURATION_MS = 1100; // per-word transition duration

  return (
    <div className={cn(className, "w-10/12")}>
      <p ref={pRef} className="leading-relaxed">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              "transition-[color,filter,opacity] ease-[cubic-bezier(0.22,1,0.36,1)]",
              inView
                ? "text-white opacity-100 blur-0"
                : "text-white/5 opacity-95 blur-[0.35px]"
            )}
            style={{
              transitionDelay: `${i * WORD_DELAY_MS}ms`,
              transitionDuration: `${DURATION_MS}ms`,
              willChange: "color, filter, opacity",
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
