"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Smile, Paperclip } from "lucide-react";

export type CommentBoxProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string) => void | Promise<void>;
  isSubmitting?: boolean;

  placeholder?: string;
  maxChars?: number;

  // Optional UI details
  showAvatar?: boolean;
  avatarUrl?: string | null;
  avatarName?: string; // used for initials fallback
  avatarSize?: number;

  // Optional toolbar callbacks (show icons if provided)
  onEmojiClick?: () => void;
  onAttachClick?: () => void;

  // Layout
  className?: string;
  inputClassName?: string;
  showHint?: boolean; // "Enter to send • Shift+Enter for newline"
};

function initialsOf(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  const res = (first + last).toUpperCase();
  return res || "U";
}

export function CommentBox({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  placeholder = "Write a reply...",
  maxChars = 500,
  showAvatar = true,
  avatarUrl = null,
  avatarName,
  avatarSize = 36,
  onEmojiClick,
  onAttachClick,
  className,
  inputClassName,
  showHint = true,
}: CommentBoxProps) {
  const taRef = React.useRef<HTMLTextAreaElement | null>(null);
  const remaining = maxChars - value.length;
  const canSend = value.trim().length > 0 && remaining >= 0 && !isSubmitting;

  // Auto-resize
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit(value.trim());
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <div
            className="relative shrink-0 overflow-hidden rounded-full border bg-muted"
            style={{ width: avatarSize, height: avatarSize }}
            aria-label="Your avatar"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="You"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-muted-foreground leading-none grid place-items-center h-full">
                {initialsOf(avatarName)}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="relative">
            <Textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "min-h-[44px] resize-none pr-12 focus-visible:ring-1",
                inputClassName
              )}
              aria-label="Write a reply"
              aria-invalid={remaining < 0}
              disabled={isSubmitting}
            />

            <Button
              type="button"
              size="icon"
              onClick={() => canSend && onSubmit(value.trim())}
              disabled={!canSend}
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              title="Send (Enter)"
              aria-label="Send reply"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {onEmojiClick && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onEmojiClick}
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              )}
              {onAttachClick && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onAttachClick}
                  title="Attach"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              )}
              {showHint && (
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  Enter to send • Shift+Enter for newline
                </span>
              )}
            </div>

            <span
              className={cn(
                "text-xs tabular-nums",
                remaining < 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {value.length}/{maxChars}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
