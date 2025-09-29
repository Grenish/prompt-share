"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import BackButton from "@/components/back-button";
import { CommentsList } from "@/components/post/comments-list";
import { CommentBox } from "@/components/post/comment-box";
import {
  togglePostLike,
  togglePostSave,
  createPostComment,
  type PostCommentPayload,
} from "@/util/actions/postsActions";
import { toast } from "sonner";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

export type MobilePostComment = {
  id: string;
  text: string;
  createdAt: string | number | Date;
  author: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
};

export type MobilePost = {
  id: string;
  createdAt: string | number | Date | null;
  text: string;
  media: string[];
  modelName?: string;
  modelLabel?: string;
  modelKey?: string;
  modelKind?: string;
  modelProvider?: string;
  modelProviderSlug?: string;
  category?: string;
  subCategory?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  author?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  liked?: boolean;
  saved?: boolean;
  likesCount?: number;
  commentCount?: number;
  comments?: MobilePostComment[];
};

function formatRelativeTime(
  dateInput: string | number | Date | null | undefined
) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  try {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function formatFullTimestamp(
  dateInput: string | number | Date | null | undefined
) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  try {
    const time = d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${time} · ${date}`;
  } catch {
    return d.toISOString();
  }
}

type MobileMetaChip = {
  key: string;
  prefix: string;
  value: string;
};

function formatMetaValue(raw?: string | null) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/[\s]/.test(trimmed)) return trimmed;
  return trimmed
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function derivePostMetaChips(post: MobilePost): MobileMetaChip[] {
  const chips: MobileMetaChip[] = [];
  const seen = new Set<string>();
  const add = (key: string, prefix: string, raw?: string | null) => {
    const value = formatMetaValue(raw);
    if (!value) return;
    const dedupeKey = `${prefix}|${value}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    chips.push({ key, prefix, value });
  };

  add("provider", "Provider", post.modelProvider ?? post.modelProviderSlug);
  add("model", "Model", post.modelLabel ?? post.modelName ?? post.modelKey);
  add("kind", "Type", post.modelKind);
  add("category", "Category", post.category ?? post.categorySlug);
  add("subCategory", "Subcategory", post.subCategory ?? post.subCategorySlug);

  return chips;
}

const MetaChip = ({ prefix, value }: { prefix: string; value: string }) => (
  <span
    className="inline-flex max-w-[200px] items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
    title={`${prefix}: ${value}`}
  >
    <span className="font-medium text-foreground">{prefix}</span>
    <span className="truncate">{value}</span>
  </span>
);

function isVideoUrl(url: string) {
  const lower = url.toLowerCase();
  return /\.(mp4|webm|ogg|m4v)$/i.test(lower);
}

/* ================ Atoms ================ */

const IconButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-full",
      "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = React.useMemo(() => {
    const parts = (name || "").trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
    return (first + last || "?").toUpperCase();
  }, [name]);
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`${name}'s avatar`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

/* ================ Lightbox Viewer (Twitter-like) ================ */

function useLockBodyScroll(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function Lightbox({
  media,
  index,
  open,
  onClose,
  onIndexChange,
}: {
  media: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useLockBodyScroll(open);
  const [startX, setStartX] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
      if (e.key === "ArrowRight")
        onIndexChange(Math.min(media.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, media.length, onClose, onIndexChange]);

  if (!open) return null;

  const current = media[index];

  const onTouchStart = (e: React.TouchEvent) => setStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) onIndexChange(Math.max(0, index - 1));
      else onIndexChange(Math.min(media.length - 1, index + 1));
    }
    setStartX(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2">
        <IconButton
          aria-label="Close"
          onClick={onClose}
          className="text-foreground hover:bg-foreground/10"
        >
          <X className="h-5 w-5" />
        </IconButton>
        {media.length > 1 && (
          <div className="text-xs text-foreground/80">
            {index + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Main media area */}
      <div
        className="absolute inset-0 grid place-items-center px-3 md:px-8"
        onClick={onClose}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          {isVideoUrl(current) ? (
            <video
              src={current}
              controls
              playsInline
              className="block w-auto h-auto max-h-[92dvh] max-w-[92vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[1200px] object-cover"
            />
          ) : (
            <img
              src={current}
              alt="media"
              draggable={false}
              className="block w-auto h-auto max-h-[92dvh] max-w-[92vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[1200px] select-none object-cover"
            />
          )}
        </div>
      </div>

      {/* Nav buttons */}
      {media.length > 1 && (
        <>
          <button
            aria-label="Previous"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label="Next"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndexChange(Math.min(media.length - 1, index + 1))}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

function MediaInline({
  media,
  onOpenViewer,
}: {
  media: string[];
  onOpenViewer: (i: number) => void;
}) {
  if (!media.length) return null;

  // Single media: show at natural aspect ratio (no forced box)
  if (media.length === 1) {
    const url = media[0];
    if (isVideoUrl(url)) {
      return (
        <div className="w-full overflow-hidden rounded-xl border">
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto max-h-[80dvh] bg-black object-cover"
          />
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onOpenViewer(0)}
        className="w-full overflow-hidden rounded-xl border"
        aria-label="Open image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="media"
          className="w-full h-auto max-h-[80dvh] select-none object-cover"
          draggable={false}
        />
      </button>
    );
  }

  // Multiple media: show main + thumbs like Twitter's detail (simple version).
  const [active, setActive] = React.useState(0);
  const current = media[active];
  const isVideo = isVideoUrl(current);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border">
        {isVideo ? (
          <video
            key={current}
            src={current}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto max-h-[75dvh] bg-black object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current}
            src={current}
            alt="media"
            className="w-full h-auto max-h-[75dvh] select-none object-cover"
            draggable={false}
            onClick={() => onOpenViewer(active)}
          />
        )}
      </div>

      {/* Thumbs */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        {media.map((u, i) => (
          <button
            key={u + i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "relative overflow-hidden rounded-md border",
              i === active
                ? "ring-2 ring-primary"
                : "opacity-90 hover:opacity-100"
            )}
            aria-label={`Select media ${i + 1}`}
            style={{ aspectRatio: "1 / 1" }}
          >
            {isVideoUrl(u) ? (
              <div className="relative h-full w-full">
                <video
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                >
                  <source src={u} />
                </video>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/50 p-1.5">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u} alt="thumb" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function useShareCurrentUrl() {
  return React.useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {}
  }, []);
}

function ActionsRow({
  liked,
  saved,
  onLike,
  onSave,
  onShare,
  onComment,
}: {
  liked: boolean;
  saved: boolean;
  onLike: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onShare: () => void;
  onComment: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <IconButton
          aria-label={liked ? "Unlike" : "Like"}
          onClick={onLike}
          className={liked ? "text-rose-500" : undefined}
        >
          <Heart className={cn("h-5 w-5", liked && "fill-current")} />
        </IconButton>
        <IconButton aria-label="Reply" onClick={onComment}>
          <MessageCircle className="h-5 w-5" />
        </IconButton>
        <IconButton aria-label="Share" onClick={onShare}>
          <Share2 className="h-5 w-5" />
        </IconButton>
      </div>
      <IconButton
        aria-label={saved ? "Remove bookmark" : "Bookmark"}
        onClick={onSave}
        className={saved ? "text-primary" : undefined}
      >
        <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
      </IconButton>
    </div>
  );
}

function HeaderBar({ createdAt }: { createdAt: MobilePost["createdAt"] }) {
  return (
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-2">
          <BackButton className="h-9 rounded-full px-3 hover:bg-muted">
            <ArrowLeft size={20} />
          </BackButton>
          <span className="ml-auto text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function AuthorRow({ post }: { post: MobilePost }) {
  if (!post.author) return null;
  const { name, username, avatarUrl } = post.author;
  return (
    <div className="flex items-center gap-3">
      <Avatar url={avatarUrl} name={name} />
      <div className="min-w-0">
        <div className="flex flex-col gap-1">
          <span className="truncate text-sm font-semibold">{name}</span>
          {username && (
            <span className="truncate text-xs text-muted-foreground">
              @{username}
            </span>
          )}
        </div>
      </div>
      <IconButton className="ml-auto" aria-label="More">
        <MoreHorizontal className="h-5 w-5" />
      </IconButton>
    </div>
  );
}

export function MobilePostView({ post }: { post: MobilePost }) {
  const onShare = useShareCurrentUrl();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [liked, setLiked] = React.useState(Boolean(post.liked));
  const [saved, setSaved] = React.useState(Boolean(post.saved));
  const [likesCount, setLikesCount] = React.useState(post.likesCount ?? 0);
  const [commentCount, setCommentCount] = React.useState(
    post.commentCount ?? post.comments?.length ?? 0
  );
  const [comments, setComments] = React.useState<MobilePostComment[]>(
    post.comments ?? []
  );
  const [commentInput, setCommentInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const metaChips = React.useMemo(() => derivePostMetaChips(post), [post]);

  React.useEffect(() => {
    setLiked(Boolean(post.liked));
    setSaved(Boolean(post.saved));
    setLikesCount(post.likesCount ?? 0);
    setCommentCount(post.commentCount ?? post.comments?.length ?? 0);
    setComments(post.comments ?? []);
  }, [post]);

  const openViewer = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const focusCommentInput = React.useCallback(() => {
    commentInputRef.current?.focus();
  }, []);

  const toMobileComment = React.useCallback(
    (payload: PostCommentPayload): MobilePostComment => ({
      id: payload.id,
      text: payload.text,
      createdAt: payload.createdAt,
      author: {
        id: payload.user.id,
        name: payload.user.name,
        username: payload.user.username,
        avatarUrl: payload.user.avatarUrl,
      },
    }),
    []
  );

  const handleToggleLike = React.useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    try {
      const res = await togglePostLike(post.id, next);
      if (!res.ok) throw new Error(res.error ?? "Couldn't update like");
      if (typeof res.likes === "number") {
        setLikesCount(res.likes);
      }
    } catch (error) {
      setLiked(!next);
      setLikesCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
      toast.error((error as Error).message || "Couldn't update like");
    }
  }, [liked, post.id]);

  const handleToggleSave = React.useCallback(async () => {
    const next = !saved;
    setSaved(next);
    try {
      const res = await togglePostSave(post.id, next);
      if (!res.ok) throw new Error(res.error ?? "Couldn't update save");
      if (typeof res.saved === "boolean") setSaved(res.saved);
    } catch (error) {
      setSaved(!next);
      toast.error((error as Error).message || "Couldn't update save");
    }
  }, [saved, post.id]);

  const handleSubmitComment = React.useCallback(
    async (rawText?: string) => {
      const source = rawText ?? commentInput;
      const body = source.trim();
      if (!body) return;
      setIsSubmitting(true);
      setCommentInput("");
      try {
        const res = await createPostComment(post.id, body);
        if (!res.ok || !res.comment) {
          throw new Error(res.error ?? "Couldn't post comment");
        }
        const mapped = toMobileComment(res.comment);
        setComments((prev) => [mapped, ...prev]);
        setCommentCount((prev) =>
          res.commentsCount != null ? res.commentsCount : prev + 1
        );
      } catch (error) {
        toast.error((error as Error).message || "Couldn't post comment");
        setCommentInput(source);
      } finally {
        setIsSubmitting(false);
      }
    },
    [commentInput, post.id, toMobileComment]
  );

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar createdAt={post.createdAt} />

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <AuthorRow post={post} />

        {post.text && (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {post.text}
          </p>
        )}

        {/* Inline media */}
        {post.media.length > 0 && (
          <MediaInline media={post.media} onOpenViewer={openViewer} />
        )}

        {metaChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {metaChips.map((chip) => (
              <MetaChip
                key={chip.key}
                prefix={chip.prefix}
                value={chip.value}
              />
            ))}
          </div>
        )}

        <div className="border-b" />

        <div className="text-xs text-muted-foreground">
          {formatFullTimestamp(post.createdAt)}
        </div>

        <div className="border-b" />

        <ActionsRow
          liked={liked}
          saved={saved}
          onLike={handleToggleLike}
          onSave={handleToggleSave}
          onShare={onShare}
          onComment={focusCommentInput}
        />

        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </span>
          <span>
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>

        <div className="space-y-4 rounded-2xl border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Comments</h3>
          <CommentBox
            ref={commentInputRef}
            value={commentInput}
            onChange={setCommentInput}
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
            placeholder="Add a comment..."
            className="flex-1"
          />

          <CommentsList
            comments={comments}
            relativeTimeFormatter={formatRelativeTime}
            avatarSize={32}
          />
        </div>
      </div>

      {/* Lightbox viewer (Twitter-like full screen) */}
      <Lightbox
        media={post.media}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
