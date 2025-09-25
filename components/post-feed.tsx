"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { deletePosts } from "@/util/actions/postsActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient as createSupabaseClient } from "@/util/supabase/client";
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Arrow } from "@radix-ui/react-tooltip";

/* ============================== Types =============================== */

export type PostMedia = {
  id?: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  posterUrl?: string;
};

export type PostUser = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  verified?: boolean;
  bio?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
};

export type PostComment = {
  id: string;
  user: PostUser;
  text: string;
  createdAt: string | number | Date;
};

export type Post = {
  id: string;
  user: PostUser;
  createdAt: string | number | Date;
  text?: string;
  attachments?: PostMedia[];
  tags?: string[];
  meta?: {
    model?: string;
    category?: string;
    subCategory?: string;
    // internal UI flags used by onMore in this file
    deleted?: boolean;
    restore?: boolean;
    hidden?: boolean;
    notInterested?: boolean;
    muteUserId?: string;
    blockUserId?: string;
    reported?: boolean;
  };
  stats?: {
    likes: number;
    comments: number;
    shares: number;
  };
  liked?: boolean;
  saved?: boolean;
  comments?: PostComment[];
};

export type PostItemProps = {
  post: Post;
  dense?: boolean;
  className?: string;
  // Optional current user's id to determine authorization for actions (e.g., Edit)
  currentUserId?: string;

  onLike?: (post: Post, nextLiked: boolean) => void | Promise<void>;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onSave?: (post: Post, nextSaved: boolean) => void | Promise<void>;
  onMore?: (post: Post) => void;
  onTagClick?: (tag: string) => void;
  onUserClick?: (user: PostUser) => void;

  fetchComments?: (post: Post) => Promise<PostComment[]>;
  onSubmitComment?: (post: Post, text: string) => Promise<PostComment | void>;
};

export type PostFeedProps = {
  posts: Post[];
  className?: string;
  dense?: boolean;
  showDividers?: boolean;
  // Optional current user's id to determine authorization for actions (e.g., Edit)
  currentUserId?: string;

  onLike?: PostItemProps["onLike"];
  onComment?: PostItemProps["onComment"];
  onShare?: PostItemProps["onShare"];
  onSave?: PostItemProps["onSave"];
  onMore?: PostItemProps["onMore"];
  onTagClick?: PostItemProps["onTagClick"];
  onUserClick?: PostItemProps["onUserClick"];

  fetchComments?: PostItemProps["fetchComments"];
  onSubmitComment?: PostItemProps["onSubmitComment"];

  loading?: boolean;
  skeletonCount?: number;
};

/* ============================ Utilities ============================= */

function initialsOf(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function formatRelativeTime(dateInput: string | number | Date) {
  const d = new Date(dateInput);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function numberCompact(n: number | undefined) {
  if (n == null) return "0";
  return Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function Avatar({
  user,
  size = 40,
  onClick,
}: {
  user: PostUser;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative shrink-0 inline-flex items-center justify-center rounded-full overflow-hidden bg-muted border"
      style={{ width: size, height: size }}
      aria-label={`${user.name}'s profile`}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          {initialsOf(user.name)}
        </span>
      )}
    </button>
  );
}

function TagChip({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-xs border bg-muted/60 hover:bg-muted transition"
      aria-label={`Tag ${text}`}
      title={`#${text}`}
    >
      #{text}
    </button>
  );
}

function MetaBadge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] border bg-muted/50">
      {label}
    </span>
  );
}

function PostMediaGrid({
  items = [],
  onOpen,
}: {
  items: PostMedia[];
  onOpen: (index: number) => void;
}) {
  if (!items.length) return null;

  const count = items.length;
  const base =
    "relative w-full overflow-hidden rounded-xl border bg-muted cursor-pointer";
  const imgCls = "w-full h-full object-cover";
  const videoCls = "w-full h-full object-cover";

  if (count === 1) {
    const m = items[0];
    const aspect =
      m.type === "video" ? "aspect-video" : "aspect-[4/3] sm:aspect-[16/10]";
    return (
      <div className={cn(base, aspect)}>
        <MediaThumb media={m} imgCls={imgCls} videoCls={videoCls} />
        <button
          className="absolute inset-0"
          onClick={() => onOpen(0)}
          aria-label="Open media"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map((m, i) => (
          <div key={i} className={cn(base, "aspect-[4/3] sm:aspect-[16/10]")}>
            <MediaThumb media={m} imgCls={imgCls} videoCls={videoCls} />
            <button
              className="absolute inset-0"
              onClick={() => onOpen(i)}
              aria-label={`Open media ${i + 1}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(base, "row-span-2 aspect-[3/4] sm:aspect-[4/5]")}>
          <MediaThumb media={items[0]} imgCls={imgCls} videoCls={videoCls} />
          <button
            className="absolute inset-0"
            onClick={() => onOpen(0)}
            aria-label="Open media 1"
          />
        </div>
        <div className={cn(base, "aspect-[4/3] sm:aspect-[16/10]")}>
          <MediaThumb media={items[1]} imgCls={imgCls} videoCls={videoCls} />
          <button
            className="absolute inset-0"
            onClick={() => onOpen(1)}
            aria-label="Open media 2"
          />
        </div>
        <div className={cn(base, "aspect-[4/3] sm:aspect-[16/10]")}>
          <MediaThumb media={items[2]} imgCls={imgCls} videoCls={videoCls} />
          <button
            className="absolute inset-0"
            onClick={() => onOpen(2)}
            aria-label="Open media 3"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.slice(0, 4).map((m, i) => {
        const isLast = i === 3 && items.length > 4;
        const extra = items.length - 4;
        return (
          <div key={i} className={cn(base, "aspect-[4/3] sm:aspect-[16/10]")}>
            <MediaThumb media={m} imgCls={imgCls} videoCls={videoCls} />
            {isLast && (
              <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-lg font-medium">
                +{extra}
              </div>
            )}
            <button
              className="absolute inset-0"
              onClick={() => onOpen(i)}
              aria-label={`Open media ${i + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function MediaThumb({
  media,
  imgCls,
  videoCls,
}: {
  media: PostMedia;
  imgCls?: string;
  videoCls?: string;
}) {
  if (media.type === "video") {
    return (
      <video
        src={media.url}
        className={videoCls}
        preload="metadata"
        controls={false}
        muted
        playsInline
        onMouseEnter={(e) => {
          try {
            const v = e.currentTarget;
            v.currentTime = 0;
            v.play().catch(() => {});
          } catch {}
        }}
        onMouseLeave={(e) => {
          try {
            e.currentTarget.pause();
          } catch {}
        }}
        poster={media.posterUrl}
      />
    );
  }
  return <img src={media.url} alt={media.alt ?? ""} className={imgCls} />;
}

function PostDetailDialog({
  post,
  open,
  onOpenChange,
  initialIndex = 0,
  fetchComments,
  onSubmitComment,
  onLike,
  onShare,
  onSave,
}: {
  post: Post;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialIndex?: number;
  fetchComments?: (post: Post) => Promise<PostComment[]>;
  onSubmitComment?: (post: Post, text: string) => Promise<PostComment | void>;
  onLike?: (post: Post, nextLiked: boolean) => void | Promise<void>;
  onShare?: (post: Post) => void;
  onSave?: (post: Post, nextSaved: boolean) => void | Promise<void>;
}) {
  const [mediaIndex, setMediaIndex] = React.useState(initialIndex);
  const [liked, setLiked] = React.useState(Boolean(post.liked));
  const [saved, setSaved] = React.useState(Boolean(post.saved));
  const [stats, setStats] = React.useState(
    post.stats ?? { likes: 0, comments: 0, shares: 0 }
  );
  const [comments, setComments] = React.useState<PostComment[] | null>(
    post.comments ?? null
  );
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [reply, setReply] = React.useState("");
  const attachments = post.attachments ?? [];

  React.useEffect(() => {
    setMediaIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (open && !comments && fetchComments) {
      setLoadingComments(true);
      fetchComments(post)
        .then((res) => setComments(res))
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [open, comments, fetchComments, post]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowLeft" && attachments.length > 1) {
        setMediaIndex((i) => (i === 0 ? attachments.length - 1 : i - 1));
      } else if (e.key === "ArrowRight" && attachments.length > 1) {
        setMediaIndex((i) => (i === attachments.length - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, attachments.length, onOpenChange]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setStats((s) => ({ ...s, likes: s.likes + (next ? 1 : -1) }));
    try {
      await onLike?.(post, next);
    } catch {
      setLiked(!next);
      setStats((s) => ({ ...s, likes: s.likes + (next ? -1 : 1) }));
    }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await onSave?.(post, next);
    } catch {
      setSaved(!next);
    }
  };

  const handleSubmitReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setReply("");
    const newComment: PostComment = {
      id: `local-${Date.now()}`,
      user: post.user, // replace with current user if available
      text,
      createdAt: Date.now(),
    };
    setComments((c) => [newComment, ...(c ?? [])]);
    setStats((s) => ({ ...s, comments: s.comments + 1 }));
    try {
      const created = await onSubmitComment?.(post, text);
      if (created) {
        setComments((c) =>
          (c ?? []).map((cm) => (cm.id === newComment.id ? created : cm))
        );
      }
    } catch {
      // ignore; optimistic only
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />

      {/* Modal */}
      <div
        className="relative w-[92vw] max-w-7xl h-[88vh] bg-card rounded-2xl overflow-hidden flex shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Media */}
        <div className="relative flex-1 flex items-center justify-center">
          {attachments.length > 0 ? (
            <>
              {attachments[mediaIndex].type === "image" ? (
                <Image
                  fill
                  src={attachments[mediaIndex].url}
                  alt={attachments[mediaIndex].alt ?? ""}
                  className="object-contain w-full h-full"
                />
              ) : (
                <video
                  src={attachments[mediaIndex].url}
                  className="object-contain w-full h-full"
                  controls
                  autoPlay
                />
              )}

              {/* Navigation */}
              {attachments.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    onClick={() =>
                      setMediaIndex((i) =>
                        i === 0 ? attachments.length - 1 : i - 1
                      )
                    }
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    onClick={() =>
                      setMediaIndex((i) =>
                        i === attachments.length - 1 ? 0 : i + 1
                      )
                    }
                    aria-label="Next"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {attachments.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIndex(i)}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          i === mediaIndex
                            ? "w-6 bg-white"
                            : "bg-white/50 hover:bg-white/70"
                        )}
                        aria-label={`Go to media ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-white/70 text-sm">No media</div>
          )}
        </div>

        <div className="w-[420px] flex flex-col bg-card border-l">
          <div className="p-6 border-b flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar user={post.user} size={42} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{post.user.name}</h3>
                  {post.user.verified && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{post.user.username} • {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors group"
            >
              <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Post content */}
            <div className="p-6 space-y-4 border-b">
              {post.text && (
                <p className="text-[15px] leading-relaxed">{post.text}</p>
              )}

              {(post.meta?.model ||
                post.meta?.category ||
                post.meta?.subCategory) && (
                <div className="pt-2">
                  <p className="text-[10px] font-medium tracking-wider text-muted-foreground mb-2">
                    DETAILS
                  </p>
                  <div className="space-y-1">
                    {post.meta?.model && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Model:</span>{" "}
                        {post.meta.model}
                      </p>
                    )}
                    {(post.meta?.category || post.meta?.subCategory) && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Category:</span>{" "}
                        {post.meta?.category}
                        {post.meta?.subCategory &&
                          ` → ${post.meta.subCategory}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-xs border bg-muted/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                <button
                  onClick={handleLike}
                  className={cn(
                    "inline-flex items-center gap-2 hover:text-foreground transition-colors",
                    liked && "text-primary"
                  )}
                >
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  <span>{numberCompact(stats.likes)}</span>
                </button>
                <div className="inline-flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>{numberCompact(stats.comments)}</span>
                </div>
                <button
                  onClick={() => {
                    setStats((s) => ({ ...s, shares: s.shares + 1 }));
                    onShare?.(post);
                  }}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{numberCompact(stats.shares)}</span>
                </button>
                <button
                  onClick={handleSave}
                  className={cn(
                    "ml-auto inline-flex items-center gap-2 hover:text-foreground transition-colors",
                    saved && "text-primary"
                  )}
                >
                  <Bookmark
                    className={cn("w-5 h-5", saved && "fill-current")}
                  />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="p-6">
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground mb-4">
                COMMENTS
              </p>
              {loadingComments ? (
                <div className="text-sm text-muted-foreground">
                  Loading comments…
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar user={c.user} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{c.user.name}</span>
                          <span className="text-muted-foreground">
                            • {formatRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}
            </div>
          </div>

          {/* Reply composer */}
          <div className="p-6 border-t mt-auto">
            <div className="flex items-end gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply…"
                className="min-h-[44px] max-h-32 resize-none"
              />
              <Button
                onClick={handleSubmitReply}
                disabled={!reply.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostItem({
  post,
  dense,
  className,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onMore,
  onTagClick,
  onUserClick,
  fetchComments,
  onSubmitComment,
}: PostItemProps) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(Boolean(post.liked));
  const [saved, setSaved] = React.useState(Boolean(post.saved));
  const [stats, setStats] = React.useState(
    post.stats ?? { likes: 0, comments: 0, shares: 0 }
  );
  const attachments = post.attachments ?? [];
  const [expanded, setExpanded] = React.useState(false);

  // Detail dialog
  const [open, setOpen] = React.useState(false);
  const [openIndex, setOpenIndex] = React.useState(0);
  const openViewer = (i: number) => {
    setOpenIndex(i);
    setOpen(true);
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setStats((s) => ({ ...s, likes: s.likes + (next ? 1 : -1) }));
    try {
      await onLike?.(post, next);
    } catch {
      setLiked(!next);
      setStats((s) => ({ ...s, likes: s.likes + (next ? -1 : 1) }));
    }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await onSave?.(post, next);
    } catch {
      setSaved(!next);
    }
  };

  const isAuthor = currentUserId === post.user.id;

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/posts/${post.id}`
      : `/posts/${post.id}`;

  const handleShareMenu = async () => {
    try {
      setStats((s) => ({ ...s, shares: s.shares + 1 }));
      if (navigator?.share) {
        await navigator.share({
          title: `${post.user.name} on Social`,
          text: post.text?.slice(0, 140),
          url: postUrl,
        });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard");
      }
      onShare?.(post);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Clipboard is not available");
      }
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleReportMenu = () => {
    onMore?.({
      ...post,
      meta: { ...(post.meta || {}), reported: true },
    });
    toast.success("Thanks for your report. Our team will review it.");
  };

  const handleNotInterestedMenu = () => {
    onMore?.({
      ...post,
      meta: { ...(post.meta || {}), hidden: true, notInterested: true },
    });
    toast("We'll show you fewer posts like this");
  };

  const handleMuteMenu = () => {
    onMore?.({
      ...post,
      meta: { ...(post.meta || {}), muteUserId: post.user.id },
    });
    toast(
      `Muted ${post.user.username ? `@${post.user.username}` : post.user.name}`
    );
  };

  const handleBlockMenu = () => {
    onMore?.({
      ...post,
      meta: { ...(post.meta || {}), blockUserId: post.user.id },
    });
    toast.success(
      `Blocked ${
        post.user.username ? `@${post.user.username}` : post.user.name
      }`
    );
  };

  const handleDeleteMenu = async () => {
    onMore?.({
      ...post,
      meta: { ...(post.meta || {}), deleted: true },
    });

    try {
      const res = await deletePosts(post.id);
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to delete post");
      }
      toast.success("Post deleted successfully");
    } catch (e: any) {
      // Restore on failure
      onMore?.({
        ...post,
        meta: { ...(post.meta || {}), restore: true },
      });
      toast.error(e?.message || "Could not delete post");
    }
  };

  return (
    <>
      <article className={cn("w-full", dense ? "py-4" : "py-6", className)}>
        <div className="flex items-start gap-3">
          <Avatar user={post.user} onClick={() => onUserClick?.(post.user)} />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
                <HoverCard openDelay={150} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick?.(post.user);
                      }}
                      className="group relative font-medium text-foreground transition-colors duration-200 hover:text-primary hover:underline focus:outline-none"
                      aria-label={`View profile of ${post.user.name}`}
                    >
                      {post.user.name}
                    </button>
                  </HoverCardTrigger>

                  <HoverCardContent
                    className="w-80 p-0 overflow-hidden border border-border/60 backdrop-blur-md bg-card/95 shadow-xl rounded-xl animate-in fade-in-50 zoom-in-95"
                    sideOffset={8}
                    align="start"
                  >
                    {/* Gradient Header Accent */}
                    <div className="h-1 bg-gradient-to-r from-primary/30 to-transparent" />

                    <div className="p-4 space-y-3">
                      {/* Avatar + Info Row */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUserClick?.(post.user);
                          }}
                          className="shrink-0 transition-transform hover:scale-105 active:scale-95"
                          aria-label={`Visit ${post.user.name}'s profile`}
                        >
                          <Avatar user={post.user} size={42} />
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold truncate leading-tight">
                              {post.user.name}
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              @{post.user.username}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 max-h-[4.5rem]">
                            {post.user.bio || "No bio yet."}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                        <span>Posts: {post.user.postsCount ?? 0}</span>
                        <span>Followers: {post.user.followersCount ?? 0}</span>
                        <span>Following: {post.user.followingCount ?? 0}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/home/profile/${post.user.username}`);
                        }}
                        className="w-full mt-1 py-2 text-sm font-medium text-primary hover:bg-primary/5 active:bg-primary/10 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        aria-label={`Go to ${post.user.name}'s profile`}
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                {post.user.verified && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
                {post.user.username && (
                  <span className="text-muted-foreground">
                    @{post.user.username}
                  </span>
                )}
                <span className="text-muted-foreground">·</span>
                <time
                  className="text-muted-foreground"
                  title={new Date(post.createdAt).toLocaleString()}
                >
                  {formatRelativeTime(post.createdAt)}
                </time>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-muted shrink-0"
                    aria-label="More"
                    title="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-44">
                  {isAuthor ? (
                    <>
                      <DropdownMenuItem onClick={() => onMore?.(post)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareMenu}>
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleDeleteMenu}
                      >
                        Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={handleShareMenu}>
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink}>
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleNotInterestedMenu}>
                        Not interested
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMuteMenu}>
                        Mute{" "}
                        {post.user.username
                          ? `@${post.user.username}`
                          : post.user.name}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleBlockMenu}
                      >
                        Block{" "}
                        {post.user.username
                          ? `@${post.user.username}`
                          : post.user.name}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleReportMenu}
                      >
                        Report
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta badges */}
            {(post.meta?.model ||
              post.meta?.category ||
              post.meta?.subCategory) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <MetaBadge label={post.meta?.model} />
                <MetaBadge label={post.meta?.category} />
                <MetaBadge label={post.meta?.subCategory} />
              </div>
            )}

            {/* Text */}
            {post.text && (
              <div className="mt-2 whitespace-pre-wrap text-[15px] leading-6">
                {!expanded && post.text.length > 250
                  ? `${post.text.slice(0, 250)}…`
                  : post.text}
                {!expanded && post.text.length > 250 && !open && (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="ml-1 text-primary hover:underline font-medium"
                    aria-label="Expand and see full post text"
                  >
                    See more
                  </button>
                )}
              </div>
            )}

            {/* Media */}
            {attachments.length > 0 && (
              <div className="mt-3">
                <PostMediaGrid items={attachments} onOpen={openViewer} />
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t, i) => (
                  <TagChip key={i} text={t} onClick={() => onTagClick?.(t)} />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className={cn(
                    "inline-flex items-center gap-2 hover:text-foreground transition-colors",
                    liked && "text-primary"
                  )}
                  aria-pressed={liked}
                  aria-label="Like"
                >
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  <span>{numberCompact(stats.likes)}</span>
                </button>
                <button
                  onClick={() => {
                    onComment?.(post);
                    setOpenIndex(0);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                  aria-label="Comment"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{numberCompact(stats.comments)}</span>
                </button>
                <button
                  onClick={() => {
                    setStats((s) => ({ ...s, shares: s.shares + 1 }));
                    onShare?.(post);
                  }}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{numberCompact(stats.shares)}</span>
                </button>
              </div>
              <button
                onClick={handleSave}
                className={cn(
                  "inline-flex items-center gap-2 hover:text-foreground transition-colors",
                  saved && "text-primary"
                )}
                aria-pressed={saved}
                aria-label="Save"
                title={saved ? "Saved" : "Save"}
              >
                <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Detail dialog */}
      <PostDetailDialog
        post={{ ...post, stats }}
        open={open}
        onOpenChange={setOpen}
        initialIndex={openIndex}
        fetchComments={fetchComments}
        onSubmitComment={onSubmitComment}
        onLike={onLike}
        onShare={onShare}
        onSave={onSave}
      />
    </>
  );
}

export function PostFeed({
  posts,
  className,
  dense,
  showDividers = true,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onMore,
  onTagClick,
  onUserClick,
  fetchComments,
  onSubmitComment,
  loading,
  skeletonCount = 3,
}: PostFeedProps) {
  const [items, setItems] = React.useState(posts);
  // Determine viewer (current) user id if not provided via props
  const [viewerId, setViewerId] = React.useState<string | undefined>(
    currentUserId
  );

  // Keep internal viewerId in sync with prop if parent provides/changes it
  React.useEffect(() => {
    setViewerId(currentUserId);
  }, [currentUserId]);

  // If not provided, fetch from Supabase client on the browser
  React.useEffect(() => {
    let cancelled = false;
    if (viewerId == null) {
      const supabase = createSupabaseClient();
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (!cancelled) setViewerId(user?.id);
        })
        .catch(() => {
          if (!cancelled) setViewerId(undefined);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  // Keep local items in sync when props.posts changes (e.g., navigation or refetch)
  React.useEffect(() => {
    setItems(posts);
  }, [posts]);

  // Internal handler to catch item-level signals (e.g., optimistic delete/restore)
  const handleMore = React.useCallback(
    (p: Post) => {
      const meta: any = (p as any).meta || {};
      if (meta.deleted || meta.hidden || meta.notInterested) {
        setItems((prev) => prev.filter((x) => x.id !== p.id));
      } else if (meta.restore) {
        setItems((prev) =>
          prev.some((x) => x.id === p.id) ? prev : [p, ...prev]
        );
      }

      if (meta.muteUserId || meta.blockUserId) {
        const userId = meta.muteUserId || meta.blockUserId;
        setItems((prev) => prev.filter((x) => x.user.id !== userId));
      }
      onMore?.(p);
    },
    [onMore]
  );

  return (
    <div className={cn("w-full", className)}>
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <PostSkeleton
              key={i}
              dense={dense}
              showDivider={showDividers && i < skeletonCount - 1}
            />
          ))
        : items.map((post, i) => (
            <div key={post.id}>
              <PostItem
                post={post}
                dense={dense}
                currentUserId={viewerId}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onSave={onSave}
                onMore={handleMore}
                onTagClick={onTagClick}
                onUserClick={onUserClick}
                fetchComments={fetchComments}
                onSubmitComment={onSubmitComment}
              />
              {showDividers && i < items.length - 1 && (
                <div className="border-b" />
              )}
            </div>
          ))}
    </div>
  );
}

/* ----------------------------- Skeletons ----------------------------- */

function PostSkeleton({
  dense,
  showDivider = true,
}: {
  dense?: boolean;
  showDivider?: boolean;
}) {
  return (
    <div className={cn(dense ? "py-4" : "py-6")}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted border animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/5 bg-muted rounded animate-pulse" />
          </div>
          <div className="mt-3 rounded-xl border bg-muted/50 h-48 animate-pulse" />
          <div className="mt-3 h-4 w-56 bg-muted rounded animate-pulse" />
        </div>
      </div>
      {showDivider && <div className="mt-6 border-b" />}
    </div>
  );
}
