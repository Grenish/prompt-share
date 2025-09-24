import {
  PostFeed,
  type Post as FeedPost,
  type PostMedia,
} from "@/components/post-feed";
import {
  fetchPostsByModelCategory,
  type ModelCategory,
} from "@/util/actions/exploreAction";
import { createClient } from "@/util/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/back-button";

export default async function ExploreModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ modelsName: string }> | { modelsName: string };
  searchParams?: Promise<{ q?: string }> | { q?: string };
}) {
  const { modelsName } = await (params as Promise<{ modelsName: string }>);
  const { q } = (await (searchParams as Promise<{ q?: string }>)) || {};

  const normalized = String(modelsName || "").toLowerCase();
  const allowed: ModelCategory[] = [
    "chatgpt",
    "gemini",
    "grok",
    "midjourney",
    "other",
  ];
  if (!allowed.includes(normalized as ModelCategory)) notFound();

  const res = await fetchPostsByModelCategory({
    model: normalized as ModelCategory,
    limit: 60,
    likeFilter: q,
  });
  if (!res.ok) throw new Error(res.error || "Failed to load posts");

  const supabase = await createClient();
  const { data: viewer } = await supabase.auth.getUser();
  const viewerId = viewer?.user?.id ?? undefined;

  const videoExts = new Set(["mp4", "webm", "mov", "mkv", "m4v", "avi"]);
  const toMediaItems = (urls?: string[] | null): PostMedia[] => {
    if (!urls?.length) return [];
    return urls.map((url) => {
      const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
      const isVideo = !!ext && videoExts.has(ext);
      return { type: isVideo ? "video" : "image", url } as PostMedia;
    });
  };

  const posts: FeedPost[] = (res.posts || []).map((row) => {
    const name =
      row.author_profile?.full_name ||
      row.author_profile?.username ||
      "Unknown";
    return {
      id: row.id,
      user: {
        id: row.author || "",
        name,
        username: row.author_profile?.username ?? undefined,
        avatarUrl: row.author_profile?.avatar_url ?? undefined,
        verified: false,
      },
      createdAt: row.created_at || new Date().toISOString(),
      text: row.text ?? undefined,
      attachments: toMediaItems(row.media_urls),
      meta: {
        model: row.model_name ?? undefined,
        category: row.category ?? undefined,
        subCategory: row.sub_category ?? undefined,
      },
      stats: { likes: 0, comments: 0, shares: 0 },
      liked: false,
      saved: false,
    } satisfies FeedPost;
  });

  const title =
    normalized === "other"
      ? q?.trim()
        ? `Other models • ${q.trim()}`
        : "Other models"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{title}</h1>
          <BackButton className="text-sm text-muted-foreground" />
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {posts.length > 0 ? (
          <PostFeed posts={posts} currentUserId={viewerId} />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No posts found.
          </div>
        )}
      </div>
    </div>
  );
}
