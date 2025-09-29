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
  X,
  ArrowRight,
  Edit,
  Trash2,
  Flag,
  UserX,
  VolumeX,
  Link2,
  EyeOff,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentsList } from "@/components/post/comments-list";
import {
  deletePosts,
  togglePostLike,
  togglePostSave,
  createPostComment,
  getPostComments,
  getPostEngagement,
  type PostCommentPayload,
} from "@/util/actions/postsActions";
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
import { useRouter } from 'nextjs-toploader/app';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CommentBox } from "@/components/post/comment-box";

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
    modelLabel?: string;
    modelKey?: string;
    modelKind?: string;
    modelProvider?: string;
    modelProviderSlug?: string;
    category?: string;
    categorySlug?: string;
    subCategory?: string;
    subCategorySlug?: string;
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

type PostStats = NonNullable<Post["stats"]>;

type MetaChipData = {
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

function deriveMetaChips(meta?: Post["meta"]): MetaChipData[] {
  if (!meta) return [];
  const chips: MetaChipData[] = [];
  const seen = new Set<string>();
  const add = (key: string, prefix: string, raw?: string | null) => {
    const value = formatMetaValue(raw);
    if (!value) return;
    const dedupeKey = `${prefix}|${value}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    chips.push({ key, prefix, value });
  };

  add("provider", "Provider", meta.modelProvider ?? meta.modelProviderSlug);
  add("model", "Model", meta.modelLabel ?? meta.model ?? meta.modelKey);
  add("kind", "Type", meta.modelKind);
  add("category", "Category", meta.category ?? meta.categorySlug);
  add(
    "subCategory",
    "Subcategory",
    meta.subCategory ?? meta.subCategorySlug
  );

  return chips;
}

function MetaChip({ prefix, value }: { prefix: string; value: string }) {
  return (
    <span
      className="inline-flex max-w-[180px] items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
      title={`${prefix}: ${value}`}
    >
      <span className="font-medium text-foreground">{prefix}</span>
      <span className="truncate">{value}</span>
    </span>
  );
}

export type PostItemProps = {
  post: Post;
  dense?: boolean;
  className?: string;
  currentUserId?: string;

  onLike?: (
    post: Post,
    nextLiked: boolean
  ) => void | { likes?: number } | Promise<void | { likes?: number }>;
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

/* ======================== Video Player ======================== */

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

function VideoPlayer({
  src,
  poster,
  className,
  autoPlayInView = true,
  muted = true,
  showTapOverlay = true,
  onNavigate,
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

    if (!hasInteracted && onNavigate) {
      onNavigate();
      return;
    }

    setHasInteracted(true);
    v.muted = muted;

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
        muted
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
  onLike?: (
    post: Post,
    nextLiked: boolean
  ) => void | { likes?: number } | Promise<void | { likes?: number }>;
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
  const [isReplySubmitting, setIsReplySubmitting] = React.useState(false);
  const attachments = post.attachments ?? [];
  const metaChips = React.useMemo(() => deriveMetaChips(post.meta), [post.meta]);

  const commentItems = React.useMemo(
    () =>
      (comments ?? []).map((comment) => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        author: {
          id: comment.user.id,
          name: comment.user.name,
          username: comment.user.username,
          avatarUrl: comment.user.avatarUrl,
        },
      })),
    [comments]
  );

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
    setStats((s) => ({ ...s, likes: Math.max(0, s.likes + (next ? 1 : -1)) }));
    try {
      const result = await onLike?.(post, next);
      if (
        result &&
        typeof result === "object" &&
        "likes" in result &&
        typeof result.likes === "number"
      ) {
        setStats((s) => ({
          ...s,
          likes: Math.max(0, result.likes ?? s.likes),
        }));
      }
    } catch {
      setLiked(!next);
      setStats((s) => ({ ...s, likes: Math.max(0, s.likes + (next ? -1 : 1)) }));
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

  const handleSubmitReply = async (incoming?: string) => {
    const source = incoming ?? reply;
    const text = source.trim();
    if (!text) return;
    setReply("");
    setIsReplySubmitting(true);
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
    } catch {
      setReply(source);
    } finally {
      setIsReplySubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
      <div
        className="relative w-[92vw] max-w-7xl h-[88vh] bg-card rounded-2xl overflow-hidden flex shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 flex items-center justify-center bg-transparent">
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
                  className="object-cover w-full h-full"
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

        <div className="w-[420px] flex flex-col border-l">
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
              {metaChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {metaChips.map((chip) => (
                    <MetaChip
                      key={chip.key}
                      prefix={chip.prefix}
                      value={chip.value}
                    />
                  ))}
                </div>
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
              <CommentsList
                comments={commentItems}
                loading={loadingComments}
                loadingLabel={
                  <p className="text-sm text-muted-foreground">Loading...</p>
                }
                emptyLabel={
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                }
                relativeTimeFormatter={formatRelativeTime}
                avatarSize={32}
              />
            </div>
          </div>

          <div className="p-6 border-t">
            <CommentBox
              value={reply}
              onChange={setReply}
              onSubmit={handleSubmitReply}
              isSubmitting={isReplySubmitting}
              placeholder="Write a reply..."
            />
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

export const PostItem = React.memo(function PostItem({
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
  const metaChips = React.useMemo(() => deriveMetaChips(post.meta), [post.meta]);

  const isAuthor = currentUserId === post.user.id;
  const postUrl = `/home/posts/${post.id}`;

  const navigateToProfile = (e?: React.SyntheticEvent) => {
    e?.stopPropagation?.();
    const uname = post.user.username?.trim();
    if (uname) {
      router.push(`/home/profile/${encodeURIComponent(uname)}`);
    } else {
      toast.error("Username not available");
    }
    onUserClick?.(post.user);
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setStats((s) => ({ ...s, likes: Math.max(0, s.likes + (next ? 1 : -1)) }));
    try {
      const result = await onLike?.(post, next);
      if (
        result &&
        typeof result === "object" &&
        "likes" in result &&
        typeof result.likes === "number"
      ) {
        setStats((s) => ({
          ...s,
          likes: Math.max(0, result.likes ?? s.likes),
        }));
      }
    } catch {
      setLiked(!next);
      setStats((s) => ({ ...s, likes: Math.max(0, s.likes + (next ? -1 : 1)) }));
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
      const absUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${postUrl}`
          : postUrl;
      if (navigator?.share) {
        await navigator.share({
          title: `${post.user.name}`,
          text: post.text?.slice(0, 140),
          url: absUrl,
        });
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(absUrl);
        toast.success("Link copied");
      }
      onShare?.(post);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      const absUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}${postUrl}`
          : postUrl;
      await navigator.clipboard.writeText(absUrl);
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
      router.push(postUrl);
    } else {
      setDetailIndex(index);
      setDetailOpen(true);
    }
  };

  const handleContainerClickCapture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const interactive = target.closest(
      'a, button, input, textarea, select, label, [role="button"], [data-stop-nav]'
    );
    if (interactive) return;
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
            onClick={() => {
              if (isMobile) navigateToProfile();
              else onUserClick?.(post.user);
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1 text-sm flex-wrap min-w-0">
                {isMobile ? (
                  <button
                    onClick={navigateToProfile}
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
                        onClick={navigateToProfile}
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
                          className="text-destructive"
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
                          className="text-destructive"
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

            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-3">
                <PostMediaGrid
                  items={post.attachments}
                  onOpen={openMediaViewer}
                  isMobile={isMobile}
                />
              </div>
            )}

            {metaChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {metaChips.map((chip) => (
                  <MetaChip
                    key={chip.key}
                    prefix={chip.prefix}
                    value={chip.value}
                  />
                ))}
              </div>
            )}

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

      {!isMobile && (
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
  );
});

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
  onLike: externalOnLike,
  onComment,
  onShare,
  onSave: externalOnSave,
  onMore,
  onTagClick,
  onUserClick,
  fetchComments: externalFetchComments,
  onSubmitComment: externalSubmitComment,
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

  React.useEffect(() => {
    let cancelled = false;
    const loadEngagement = async () => {
      const ids = posts.map((p) => p.id).filter(Boolean);
      if (ids.length === 0) return;
      const res = await getPostEngagement(ids);
      if (cancelled) return;
      if (!res.ok) {
        if (res.error) toast.error(res.error);
        return;
      }
      const map = new Map(res.items?.map((item) => [item.postId, item]));
      if (map.size === 0) return;
      setItems((prev) =>
        prev.map((post) => {
          const summary = map.get(post.id);
          if (!summary) return post;
          const baseStats = post.stats ?? { likes: 0, comments: 0, shares: 0 };
          return {
            ...post,
            stats: {
              ...baseStats,
              likes: summary.likes,
              comments: summary.comments,
            },
            liked: summary.liked,
            saved: summary.saved,
          };
        })
      );
    };

    loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [posts, viewerId]);

  const mapPayloadToComment = React.useCallback(
    (payload: PostCommentPayload): PostComment => ({
      id: payload.id,
      text: payload.text,
      createdAt: payload.createdAt,
      user: {
        id: payload.user.id,
        name: payload.user.name,
        username: payload.user.username,
        avatarUrl: payload.user.avatarUrl,
      },
    }),
    []
  );

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

  const handleLikeToggle = React.useCallback(
    async (post: Post, nextLiked: boolean) => {
      const res = await togglePostLike(post.id, nextLiked);
      if (!res.ok) {
        toast.error(res.error ?? "Couldn't update like");
        throw new Error(res.error ?? "Failed to update like");
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const prevStats: PostStats = item.stats ?? {
            likes: 0,
            comments: 0,
            shares: 0,
          };
          return {
            ...item,
            liked: res.liked ?? nextLiked,
            stats: {
              ...prevStats,
              likes: res.likes ?? prevStats.likes,
            },
          };
        })
      );

      const fallbackLikes = res.likes ?? post.stats?.likes ?? 0;

      const externalResult = await externalOnLike?.(post, nextLiked);
      if (
        externalResult &&
        typeof externalResult === "object" &&
        "likes" in externalResult &&
        typeof externalResult.likes === "number"
      ) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== post.id) return item;
            const prevStats: PostStats = item.stats ?? {
              likes: 0,
              comments: 0,
              shares: 0,
            };
            return {
              ...item,
              stats: {
                ...prevStats,
                likes: externalResult.likes ?? prevStats.likes,
              },
            };
          })
        );
        return { likes: externalResult.likes };
      }

      return { likes: fallbackLikes };
    },
    [externalOnLike, setItems]
  );

  const handleSaveToggle = React.useCallback(
    async (post: Post, nextSaved: boolean) => {
      const res = await togglePostSave(post.id, nextSaved);
      if (!res.ok) {
        toast.error(res.error ?? "Couldn't update save");
        throw new Error(res.error ?? "Failed to update save");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, saved: res.saved ?? nextSaved } : item
        )
      );

      await externalOnSave?.(post, nextSaved);
    },
    [externalOnSave]
  );

  const handleFetchComments = React.useCallback(
    async (post: Post) => {
      const res = await getPostComments(post.id);
      if (!res.ok || !res.comments) {
        if (res.error) toast.error(res.error);
        const external = await externalFetchComments?.(post);
        if (external) return external;
        throw new Error(res.error ?? "Failed to load comments");
      }
      const mapped = res.comments.map(mapPayloadToComment);
      const external = await externalFetchComments?.(post);
      return external ?? mapped;
    },
    [externalFetchComments, mapPayloadToComment]
  );

  const handleSubmitComment = React.useCallback(
    async (post: Post, text: string) => {
      const res = await createPostComment(post.id, text);
      if (!res.ok || !res.comment) {
        toast.error(res.error ?? "Couldn't post comment");
        throw new Error(res.error ?? "Failed to post comment");
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const prevStats: PostStats = item.stats ?? {
            likes: 0,
            comments: 0,
            shares: 0,
          };
          return {
            ...item,
            stats: {
              ...prevStats,
              comments: res.commentsCount ?? prevStats.comments + 1,
            },
          };
        })
      );

      const mapped = mapPayloadToComment(res.comment);
      const external = await externalSubmitComment?.(post, text);
      return external ?? mapped;
    },
    [externalSubmitComment, mapPayloadToComment]
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
                onLike={handleLikeToggle}
                onComment={onComment}
                onShare={onShare}
                onSave={handleSaveToggle}
                onMore={handleMore}
                onTagClick={onTagClick}
                onUserClick={onUserClick}
                fetchComments={handleFetchComments}
                onSubmitComment={handleSubmitComment}
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
