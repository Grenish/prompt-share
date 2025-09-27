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
  Edit,
  Trash2,
  Flag,
  UserX,
  VolumeX,
  Link2,
  EyeOff,
  ChevronDown,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deletePosts } from "@/util/actions/postsActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { createClient as createSupabaseClient } from "@/util/supabase/client";
import { useRouter } from "next/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return isMobile;
}

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
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function numberCompact(n: number | undefined) {
  if (n == null) return "0";
  return Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function Avatar({
  user,
  size = 40,
  onClick,
  className,
}: {
  user: PostUser;
  size?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "relative shrink-0 inline-flex items-center justify-center rounded-full overflow-hidden bg-muted border",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`${user.name}'s profile`}
      data-stop-nav
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
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="px-2 py-0.5 rounded-full text-xs border bg-muted/60 hover:bg-muted transition"
      aria-label={`Tag ${text}`}
      data-stop-nav
    >
      #{text}
    </button>
  );
}

/* ===================== Video Autoplay on View ===================== */

function useAutoplayOnView(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled = true
) {
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !enabled) return;

    el.muted = true;
    el.loop = true;
    el.playsInline = true;

    let playing = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            try {
              await el.play();
              playing = true;
            } catch {}
          } else if (playing) {
            el.pause();
            playing = false;
          }
        });
      },
      { threshold: [0.0, 0.5, 1.0] }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      try {
        el.pause();
      } catch {}
    };
  }, [videoRef, enabled]);
}

/* ======================== Video Player Component ======================== */

function VideoPlayer({
  src,
  poster,
  className,
  autoPlayInView = true,
  muted = true,
  showTapOverlay = true,
  onNavigate, // call to navigate on first tap if needed
}: {
  src: string;
  poster?: string;
  className?: string;
  autoPlayInView?: boolean;
  muted?: boolean;
  showTapOverlay?: boolean;
  onNavigate?: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useAutoplayOnView(videoRef, autoPlayInView);

  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;

    // If we want navigation (e.g., on mobile), do it on the first tap
    if (!hasInteracted && onNavigate) {
      onNavigate();
      return;
    }

    setHasInteracted(true);
    v.muted = muted; // stay muted unless you implement a mute toggle

    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  return (
    <div
      className="relative w-full h-full group"
      onClick={handleTap}
      data-stop-nav
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={className}
        muted={true} // keep muted for autoplay policies
        loop
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {showTapOverlay && !hasInteracted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      )}
      {hasInteracted && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white fill-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================== Mobile Media Viewer ======================== */

function MobileMediaViewer({
  items = [],
  initialIndex = 0,
  open,
  onOpenChange,
}: {
  items: PostMedia[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [index, setIndex] = React.useState(initialIndex);
  const [startX, setStartX] = React.useState(0);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && index > 0) setIndex(index - 1);
      else if (diff < 0 && index < items.length - 1) setIndex(index + 1);
    }
  };

  if (!open || !items.length) return null;

  const current = items[index];

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => onOpenChange(false)}
          className="p-2 rounded-full bg-white/10 backdrop-blur"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm font-medium">
          {index + 1} / {items.length}
        </span>
      </div>

      <div
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {current.type === "image" ? (
          <img
            src={current.url}
            alt={current.alt ?? ""}
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            src={current.url}
            poster={current.posterUrl}
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            muted
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-safe left-0 right-0 flex justify-center gap-1.5 pb-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================= Mobile Post Detail ======================== */

function MobilePostDetail({
  post,
  open,
  onOpenChange,
  fetchComments,
  onSubmitComment,
  onLike,
  onShare,
  onSave,
}: {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchComments?: (post: Post) => Promise<PostComment[]>;
  onSubmitComment?: (post: Post, text: string) => Promise<PostComment | void>;
  onLike?: (post: Post, nextLiked: boolean) => void | Promise<void>;
  onShare?: (post: Post) => void;
  onSave?: (post: Post, nextSaved: boolean) => void | Promise<void>;
}) {
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
  const [mediaViewerOpen, setMediaViewerOpen] = React.useState(false);
  const [mediaIndex, setMediaIndex] = React.useState(0);

  React.useEffect(() => {
    if (open && !comments && fetchComments) {
      setLoadingComments(true);
      fetchComments(post)
        .then((res) => setComments(res))
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [open, comments, fetchComments, post]);

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
    const optimistic: PostComment = {
      id: `local-${Date.now()}`,
      user: post.user,
      text,
      createdAt: Date.now(),
    };
    setComments((c) => [optimistic, ...(c ?? [])]);
    setStats((s) => ({ ...s, comments: s.comments + 1 }));
    try {
      const created = await onSubmitComment?.(post, text);
      if (created) {
        setComments((c) =>
          (c ?? []).map((cm) => (cm.id === optimistic.id ? created : cm))
        );
      }
    } catch {}
  };

  const openMedia = (index: number) => {
    setMediaIndex(index);
    setMediaViewerOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
        >
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar user={post.user} size={36} />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm">
                      {post.user.name}
                    </span>
                    {post.user.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{post.user.username} · {formatRelativeTime(post.createdAt)}
                  </p>
                </div>
              </div>
              <button onClick={() => onOpenChange(false)}>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {post.text && (
                <p className="text-[15px] leading-relaxed">{post.text}</p>
              )}

              {post.attachments && post.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.attachments.slice(0, 4).map((media, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-black"
                    >
                      {media.type === "image" ? (
                        <button
                          onClick={() => openMedia(i)}
                          className="w-full h-full"
                          data-stop-nav
                        >
                          <img
                            src={media.url}
                            alt={media.alt ?? ""}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <VideoPlayer
                          src={media.url}
                          poster={media.posterUrl}
                          className="w-full h-full object-cover"
                          onNavigate={() => openMedia(i)}
                        />
                      )}
                      {i === 3 && (post.attachments?.length ?? 0) > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-xl font-semibold">
                            +{(post.attachments?.length ?? 0) - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, i) => (
                    <TagChip key={i} text={tag} />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-around py-3 border-y">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    liked && "text-primary"
                  )}
                  data-stop-nav
                >
                  <Heart className={cn("w-6 h-6", liked && "fill-current")} />
                  <span className="text-xs">{numberCompact(stats.likes)}</span>
                </button>
                <div className="flex flex-col items-center gap-1" data-stop-nav>
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-xs">
                    {numberCompact(stats.comments)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setStats((s) => ({ ...s, shares: s.shares + 1 }));
                    onShare?.(post);
                  }}
                  className="flex flex-col items-center gap-1"
                  data-stop-nav
                >
                  <Share2 className="w-6 h-6" />
                  <span className="text-xs">{numberCompact(stats.shares)}</span>
                </button>
                <button
                  onClick={handleSave}
                  className={cn(
                    "flex flex-col items-center gap-1",
                    saved && "text-primary"
                  )}
                  data-stop-nav
                >
                  <Bookmark
                    className={cn("w-6 h-6", saved && "fill-current")}
                  />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Comments</h3>
                {loadingComments ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar user={c.user} size={32} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold">{c.user.name}</span>
                            <span className="text-muted-foreground">
                              {formatRelativeTime(c.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No comments yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-background p-4">
            <div className="flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[40px] resize-none"
                rows={1}
              />
              <Button
                onClick={handleSubmitReply}
                disabled={!reply.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MobileMediaViewer
        items={post.attachments ?? []}
        initialIndex={mediaIndex}
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
      />
    </>
  );
}

/* ======================== Desktop Post Detail ======================== */

function DesktopPostDetail({
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

  React.useEffect(() => setMediaIndex(initialIndex), [initialIndex]);

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
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      else if (e.key === "ArrowLeft" && attachments.length > 1) {
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
    const optimistic: PostComment = {
      id: `local-${Date.now()}`,
      user: post.user,
      text,
      createdAt: Date.now(),
    };
    setComments((c) => [optimistic, ...(c ?? [])]);
    setStats((s) => ({ ...s, comments: s.comments + 1 }));
    try {
      const created = await onSubmitComment?.(post, text);
      if (created)
        setComments((c) =>
          (c ?? []).map((cm) => (cm.id === optimistic.id ? created : cm))
        );
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />

      <div
        className="relative w-[92vw] max-w-7xl h-[88vh] bg-card rounded-2xl overflow-hidden flex shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 flex items-center justify-center bg-black">
          {attachments.length > 0 ? (
            <>
              {attachments[mediaIndex].type === "image" ? (
                <img
                  src={attachments[mediaIndex].url}
                  alt={attachments[mediaIndex].alt ?? ""}
                  className="object-contain w-full h-full"
                />
              ) : (
                <video
                  src={attachments[mediaIndex].url}
                  poster={attachments[mediaIndex].posterUrl}
                  className="object-contain w-full h-full"
                  controls
                  autoPlay
                  playsInline
                  muted
                  loop
                />
              )}

              {attachments.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={() =>
                      setMediaIndex((i) =>
                        i === 0 ? attachments.length - 1 : i - 1
                      )
                    }
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={() =>
                      setMediaIndex((i) =>
                        i === attachments.length - 1 ? 0 : i + 1
                      )
                    }
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

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
              className="p-2 rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4 border-b">
              {post.text && (
                <p className="text-[15px] leading-relaxed">{post.text}</p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t, i) => (
                    <TagChip key={i} text={t} />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-2",
                    liked && "text-primary"
                  )}
                >
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  <span>{numberCompact(stats.likes)}</span>
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>{numberCompact(stats.comments)}</span>
                </div>
                <button
                  onClick={() => {
                    setStats((s) => ({ ...s, shares: s.shares + 1 }));
                    onShare?.(post);
                  }}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{numberCompact(stats.shares)}</span>
                </button>
                <button
                  onClick={handleSave}
                  className={cn("ml-auto", saved && "text-primary")}
                >
                  <Bookmark
                    className={cn("w-5 h-5", saved && "fill-current")}
                  />
                </button>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-semibold mb-4">Comments</h4>
              {loadingComments ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar user={c.user} size={32} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{c.user.name}</span>
                          <span className="text-muted-foreground">
                            {formatRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              )}
            </div>
          </div>

          <div className="p-6 border-t">
            <div className="flex gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[44px] resize-none"
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

/* ======================== Mobile Actions Menu ======================== */

function MobileActionsMenu({
  post,
  isAuthor,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onShare,
  onCopyLink,
  onNotInterested,
  onMute,
  onBlock,
  onReport,
}: {
  post: Post;
  isAuthor: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  onNotInterested?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Post Options</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 py-4">
          {isAuthor ? (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onEdit}
                data-stop-nav
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Post
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onShare}
                data-stop-nav
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Post
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive"
                onClick={onDelete}
                data-stop-nav
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onShare}
                data-stop-nav
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Post
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onCopyLink}
                data-stop-nav
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onNotInterested}
                data-stop-nav
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Not Interested
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={onMute}
                data-stop-nav
              >
                <VolumeX className="mr-2 h-4 w-4" />
                Mute @{post.user.username}
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive"
                onClick={onBlock}
                data-stop-nav
              >
                <UserX className="mr-2 h-4 w-4" />
                Block @{post.user.username}
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-destructive"
                onClick={onReport}
                data-stop-nav
              >
                <Flag className="mr-2 h-4 w-4" />
                Report Post
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ========================== Post Item Component ======================== */

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
  const isMobile = useIsMobile();
  const [liked, setLiked] = React.useState(Boolean(post.liked));
  const [saved, setSaved] = React.useState(Boolean(post.saved));
  const [stats, setStats] = React.useState(
    post.stats ?? { likes: 0, comments: 0, shares: 0 }
  );
  const [expanded, setExpanded] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailIndex, setDetailIndex] = React.useState(0);
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = React.useState(false);
  const [mediaIndex, setMediaIndex] = React.useState(0);

  const isAuthor = currentUserId === post.user.id;
  const postUrl = `/home/posts/${post.id}`;

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

  const handleShare = async () => {
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
        toast.success("Link copied");
      }
      onShare?.(post);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDelete = async () => {
    onMore?.({ ...post, meta: { ...post.meta, deleted: true } });
    try {
      const res = await deletePosts(post.id);
      if (!res?.ok) throw new Error(res?.error || "Failed");
      toast.success("Post deleted");
    } catch (e) {
      onMore?.({ ...post, meta: { ...post.meta, restore: true } });
      toast.error("Could not delete post");
    }
  };

  const openMediaViewer = (index: number) => {
    if (isMobile) {
      // For mobile: navigate to dedicated post page instead of in-feed viewer
      router.push(postUrl);
    } else {
      setDetailIndex(index);
      setDetailOpen(true);
    }
  };

  const handleContainerClickCapture = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on interactive elements
    const target = e.target as HTMLElement;
    const interactive = target.closest(
      'a, button, input, textarea, select, label, [role="button"], [data-stop-nav]'
    );
    if (interactive) return;

    // On mobile: navigate to the post page.
    // On larger screens: clicking outside media should also navigate to the post page.
    // Media elements themselves call onOpen(...) and stop propagation to open the dialog.
    router.push(postUrl);
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && isMobile) {
      e.preventDefault();
      e.stopPropagation();
      router.push(postUrl);
    }
  };

  const avatarSize = isMobile ? 36 : 40;

  return (
    <>
      <article
        className={cn(
          "w-full",
          dense ? "py-3" : isMobile ? "py-4" : "py-6",
          className,
          "cursor-pointer"
        )}
        onClickCapture={handleContainerClickCapture}
        onKeyDown={handleContainerKeyDown}
        tabIndex={0}
        aria-label={`Open post by ${post.user.name}`}
      >
        <div className={cn("flex gap-3", isMobile && "gap-2")}>
          <Avatar
            user={post.user}
            size={avatarSize}
            onClick={() => onUserClick?.(post.user)}
          />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1 text-sm flex-wrap min-w-0">
                {isMobile ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUserClick?.(post.user);
                    }}
                    className="font-semibold"
                    data-stop-nav
                  >
                    {post.user.name}
                  </button>
                ) : (
                  <HoverCard openDelay={150} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserClick?.(post.user);
                        }}
                        className="font-semibold hover:underline"
                        data-stop-nav
                      >
                        {post.user.name}
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex gap-3">
                        <Avatar user={post.user} size={42} />
                        <div className="flex-1">
                          <h4 className="font-semibold">{post.user.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            @{post.user.username}
                          </p>
                          <p className="text-sm mt-2">
                            {post.user.bio || "No bio yet."}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="mt-3 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUserClick?.(post.user);
                        }}
                        data-stop-nav
                      >
                        View Profile
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </HoverCardContent>
                  </HoverCard>
                )}
                {post.user.verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                )}
                <span className="text-muted-foreground text-xs">
                  @{post.user.username} · {formatRelativeTime(post.createdAt)}
                </span>
              </div>

              {isMobile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionsOpen(true);
                  }}
                  className="p-1.5 -mr-1.5"
                  data-stop-nav
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded hover:bg-muted"
                      data-stop-nav
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAuthor ? (
                      <>
                        <DropdownMenuItem onClick={() => onMore?.(post)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShare}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={handleDelete}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={handleShare}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyLink}>
                          Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onMore?.({
                              ...post,
                              meta: { ...post.meta, notInterested: true },
                            })
                          }
                        >
                          Not interested
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            onMore?.({
                              ...post,
                              meta: { ...post.meta, reported: true },
                            })
                          }
                        >
                          Report
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            {post.text && (
              <div
                className={cn(
                  "mt-2 whitespace-pre-wrap",
                  isMobile
                    ? "text-[14px] leading-relaxed"
                    : "text-[15px] leading-6"
                )}
              >
                {!expanded && post.text.length > 200
                  ? `${post.text.slice(0, 200)}…`
                  : post.text}
                {!expanded && post.text.length > 200 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(true);
                    }}
                    className="ml-1 text-primary font-medium"
                    data-stop-nav
                  >
                    more
                  </button>
                )}
              </div>
            )}

            {/* Media Grid */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3">
                <PostMediaGrid
                  items={post.attachments}
                  onOpen={openMediaViewer}
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag, i) => (
                  <TagChip
                    key={i}
                    text={tag}
                    onClick={() => onTagClick?.(tag)}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div
              className={cn(
                "mt-3 flex items-center justify-between",
                isMobile ? "text-xs" : "text-sm"
              )}
              data-stop-nav
            >
              <div
                className={cn(
                  "flex items-center",
                  isMobile ? "gap-4" : "gap-6"
                )}
              >
                <button
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-1.5",
                    liked && "text-primary"
                  )}
                  data-stop-nav
                >
                  <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                  <span>{numberCompact(stats.likes)}</span>
                </button>
                <button
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMobile) {
                      router.push(postUrl);
                    } else {
                      onComment?.(post);
                      setDetailOpen(true);
                    }
                  }}
                   className="flex items-center gap-1.5"
                   data-stop-nav
                 >
                  className="flex items-center gap-1.5"
                  data-stop-nav
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{numberCompact(stats.comments)}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5"
                  data-stop-nav
                >
                  <Share2 className="w-5 h-5" />
                  <span>{numberCompact(stats.shares)}</span>
                </button>
              </div>
              <button
                onClick={handleSave}
                className={cn(saved && "text-primary")}
                data-stop-nav
              >
                <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Detail Views */}
      {isMobile ? (
        <>
          {/* On mobile, we navigate to /home/posts/[id] for full page; keeping sheet here if you want to open comments inline */}
          <MobileActionsMenu
            post={post}
            isAuthor={isAuthor}
            open={actionsOpen}
            onOpenChange={setActionsOpen}
            onEdit={() => {
              setActionsOpen(false);
              onMore?.(post);
            }}
            onDelete={() => {
              setActionsOpen(false);
              handleDelete();
            }}
            onShare={() => {
              setActionsOpen(false);
              handleShare();
            }}
            onCopyLink={() => {
              setActionsOpen(false);
              handleCopyLink();
            }}
            onNotInterested={() => {
              setActionsOpen(false);
              onMore?.({
                ...post,
                meta: { ...post.meta, notInterested: true },
              });
              toast("We'll show fewer posts like this");
            }}
            onMute={() => {
              setActionsOpen(false);
              onMore?.({
                ...post,
                meta: { ...post.meta, muteUserId: post.user.id },
              });
              toast(`Muted @${post.user.username}`);
            }}
            onBlock={() => {
              setActionsOpen(false);
              onMore?.({
                ...post,
                meta: { ...post.meta, blockUserId: post.user.id },
              });
              toast(`Blocked @${post.user.username}`);
            }}
            onReport={() => {
              setActionsOpen(false);
              onMore?.({ ...post, meta: { ...post.meta, reported: true } });
              toast("Thanks for reporting");
            }}
          />
        </>
      ) : (
        <DesktopPostDetail
          post={{ ...post, stats }}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          initialIndex={detailIndex}
          fetchComments={fetchComments}
          onSubmitComment={onSubmitComment}
          onLike={onLike}
          onShare={onShare}
          onSave={onSave}
        />
      )}
    </>
  );
}


function PostMediaGrid({
  items = [],
  onOpen,
  isMobile,
}: {
  items: PostMedia[];
  onOpen: (index: number) => void;
  isMobile?: boolean;
}) {
  if (!items.length) return null;

  const count = items.length;
  const base = cn(
    "relative w-full overflow-hidden rounded-lg border bg-black",
    isMobile && "rounded-md"
  );

  if (count === 1) {
    const m = items[0];
    return (
      <div className={cn(base, "aspect-[4/3] sm:aspect-[16/10]")}>
        {m.type === "image" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(0);
            }}
            className="w-full h-full"
            data-stop-nav
          >
            <img
              src={m.url}
              alt={m.alt ?? ""}
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <VideoPlayer
            src={m.url}
            poster={m.posterUrl}
            className="w-full h-full object-cover"
            onNavigate={() => onOpen(0)}
          />
        )}
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((m, i) => (
          <div key={i} className={cn(base, "aspect-square sm:aspect-[4/3]")}>
            {m.type === "image" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(i);
                }}
                className="w-full h-full"
                data-stop-nav
              >
                <img
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <VideoPlayer
                src={m.url}
                poster={m.posterUrl}
                className="w-full h-full object-cover"
                onNavigate={() => onOpen(i)}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.slice(0, 4).map((m, i) => {
        const isLast = i === 3 && items.length > 4;
        const extra = items.length - 4;
        return (
          <div key={i} className={cn(base, "aspect-square")}>
            {m.type === "image" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(i);
                }}
                className="w-full h-full"
                data-stop-nav
              >
                <img
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <VideoPlayer
                src={m.url}
                poster={m.posterUrl}
                className="w-full h-full object-cover"
                onNavigate={() => onOpen(i)}
              />
            )}
            {isLast && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  +{extra}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
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
  const [viewerId, setViewerId] = React.useState<string | undefined>(
    currentUserId
  );
  const isMobile = useIsMobile();

  React.useEffect(() => {
    setViewerId(currentUserId);
  }, [currentUserId]);

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

  React.useEffect(() => {
    setItems(posts);
  }, [posts]);

  const handleMore = React.useCallback(
    (p: Post) => {
      const meta: any = p.meta || {};
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
              isMobile={isMobile}
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


function PostSkeleton({
  dense,
  showDivider = true,
  isMobile,
}: {
  dense?: boolean;
  showDivider?: boolean;
  isMobile?: boolean;
}) {
  return (
    <div className={cn(dense ? "py-3" : isMobile ? "py-4" : "py-6")}>
      <div className={cn("flex gap-3", isMobile && "gap-2")}>
        <div
          className={cn(
            "rounded-full bg-muted border animate-pulse shrink-0",
            isMobile ? "w-9 h-9" : "w-10 h-10"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-3/5 bg-muted rounded animate-pulse" />
          </div>
          <div className="mt-3 rounded-lg border bg-muted/50 h-48 animate-pulse" />
          <div className="mt-3 h-4 w-56 bg-muted rounded animate-pulse" />
        </div>
      </div>
      {showDivider && <div className="mt-4 border-b" />}
    </div>
  );
}
