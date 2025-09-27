"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export type CommentBoxProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string) => void | Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  maxChars?: number;
  className?: string;
};

// Emoji-safe length
function graphemeLength(input: string): number {
  // Prefer Intl.Segmenter if available, fallback to code points
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const _ of seg.segment(input)) count++;
    return count;
  }
  return Array.from(input).length;
}

export const CommentBox = React.forwardRef<
  HTMLTextAreaElement,
  CommentBoxProps
>(
  (
    {
      value,
      onChange,
      onSubmit,
      isSubmitting = false,
      placeholder = "Add a comment...",
      maxChars = 280,
      className,
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [focused, setFocused] = React.useState(false);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            node;
      },
      [ref]
    );

    const charCount = React.useMemo(() => graphemeLength(value), [value]);
    const remaining = maxChars - charCount;
    const nearLimit = remaining <= Math.ceil(maxChars * 0.1);
    const used = Math.min(charCount, maxChars);
    const percent = Math.max(0, Math.min(100, (used / maxChars) * 100));

    const dirty = value.trim().length > 0;
    const canSend = dirty && remaining >= 0 && !isSubmitting;

    // Auto-resize
    React.useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      const id = requestAnimationFrame(() => {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 200) + "px";
      });
      return () => cancelAnimationFrame(id);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (canSend) onSubmit(value.trim());
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (canSend) onSubmit(value.trim());
    };

    const counterId = React.useId();

    const ringColorClass =
      remaining < 0
        ? "text-destructive"
        : nearLimit
        ? "text-amber-500"
        : "text-primary";

    return (
      <form onSubmit={handleSubmit} className={cn("w-full", className)}>
        <div
          className={cn(
            "group relative rounded-xl border bg-background/60",
            "supports-[backdrop-filter]:bg-background/50 backdrop-blur-sm",
            "transition-all",
            "focus-within:ring-1 focus-within:ring-primary/30 focus-within:shadow-sm"
          )}
        >
          {/* Text area */}
          <div className="relative">
            <Textarea
              ref={setRefs}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              className={cn(
                // Reset default textarea chrome
                "bg-transparent border-0 shadow-none",
                // Layout
                "min-h-[44px] w-full pl-4 pr-14 py-3 resize-none",
                // Typography + focus
                "focus-visible:ring-0 focus-visible:outline-none",
                "placeholder:text-muted-foreground/70"
              )}
              aria-label="Write a comment"
              aria-invalid={remaining < 0}
              aria-describedby={counterId}
              disabled={isSubmitting}
            />

            {/* Creative but subtle: progress as a circular ring around the send button */}
            <div
              className={cn(
                "absolute bottom-2 right-2 h-9 w-9",
                ringColorClass
              )}
            >
              {/* Ring background */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(currentColor ${percent}%, hsl(var(--muted-foreground) / 0.15) 0)`,
                  transition: "background 140ms ease",
                }}
              />
              {/* Button sits on top, inset so the ring peeks around it */}
              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                variant="outline"
                className={cn(
                  "flex items-center justify-center",
                  "rounded-full transition-transform duration-150",
                  canSend ? "active:scale-95" : "opacity-60"
                )}
                title="Send (Enter)"
                aria-label="Send comment"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Subtle helper + counter; appears on focus or when typing */}
          <div
            className={cn(
              "flex items-center justify-between px-3 pb-2 pt-1 text-xs text-muted-foreground",
              "transition-opacity duration-150",
              focused || dirty ? "opacity-100" : "opacity-0"
            )}
          >
            <span className="hidden sm:inline select-none">
              Enter to send • Shift+Enter for newline
            </span>
            <span
              id={counterId}
              aria-live="polite"
              className={cn(
                "tabular-nums",
                remaining < 0
                  ? "text-destructive"
                  : nearLimit
                  ? "text-amber-600"
                  : ""
              )}
            >
              {charCount}/{maxChars}
            </span>
          </div>
        </div>
      </form>
    );
  }
);

CommentBox.displayName = "CommentBox";
