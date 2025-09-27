"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CommentAuthor = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
};

export type CommentItem = {
  id: string;
  text: string;
  createdAt: string | number | Date;
  author: CommentAuthor;
};

export type CommentsListProps = {
  comments: CommentItem[];
  loading?: boolean;
  emptyLabel?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  relativeTimeFormatter?: (date: CommentItem["createdAt"]) => string;
  avatarSize?: number;
  className?: string;
};

const defaultEmpty = <p className="text-sm text-muted-foreground">No comments yet</p>;
const defaultLoading = (
  <p className="text-sm text-muted-foreground">Loading comments...</p>
);

function fallbackRelativeTime(dateInput: CommentItem["createdAt"]) {
  const date = new Date(dateInput);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  try {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function initialsFor(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const result = `${first}${last}`.toUpperCase();
  return result || "?";
}

export function CommentsList({
  comments,
  loading,
  emptyLabel = defaultEmpty,
  loadingLabel = defaultLoading,
  relativeTimeFormatter,
  avatarSize = 32,
  className,
}: CommentsListProps) {
  if (loading) {
    return <>{loadingLabel}</>;
  }

  if (!comments.length) {
    return <>{emptyLabel}</>;
  }

  const formatTime = relativeTimeFormatter ?? fallbackRelativeTime;

  return (
    <div className={cn("space-y-4", className)}>
      {comments.map((comment) => {
        const timeLabel = formatTime(comment.createdAt);
        return (
          <div key={comment.id} className="flex gap-3">
            <div
              className="relative shrink-0 overflow-hidden rounded-full border bg-muted"
              style={{ width: avatarSize, height: avatarSize }}
              aria-label={`${comment.author.name}'s avatar`}
            >
              {comment.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {initialsFor(comment.author.name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {comment.author.name}
                </span>
                {comment.author.username && (
                  <span>@{comment.author.username}</span>
                )}
                {timeLabel && <span>{timeLabel}</span>}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground break-words">
                {comment.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
