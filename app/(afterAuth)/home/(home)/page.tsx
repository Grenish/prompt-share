import { createClient } from "@/util/supabase/server";
import { redirect } from "next/navigation";
import { normalizeUser } from "@/lib/normalizeUser";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PostFeed, type Post as FeedPost } from "@/components/post-feed";
import { UserButton } from "@/components/userButton";

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const user = normalizeUser(data.user);
  const viewerId = user?.id;
  const viewerDisplayName = user?.displayName;

  const { data: followingRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .limit(500);

  const followedIds = new Set<string>(
    (followingRows || [])
      .map((r: any) => String(r.following_id))
      .filter(Boolean)
  );

  const { data: postRows, error: postsError } = await supabase
    .from("posts")
    .select(
      "id, created_at, text, category, category_slug, sub_category, sub_category_slug, model_name, model_label, model_key, model_kind, model_provider, model_provider_slug, media_urls, author"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const authorIds = Array.from(
    new Set(
      (postRows || [])
        .map((r: any) => r.author as string | undefined)
        .filter((v): v is string => Boolean(v))
    )
  );

  let profilesMap = new Map<
    string,
    {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
      bio: string | null;
    }
  >();

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio")
      .in("id", authorIds);

    for (const p of profiles || []) {
      profilesMap.set(String(p.id), {
        username: p.username ?? null,
        full_name: p.full_name ?? null,
        avatar_url: p.avatar_url ?? null,
        bio: p.bio ?? null,
      });
    }
  }

  const basePosts: FeedPost[] = (postRows || []).map((row: any) => {
    const pid = String(row.id);
    const profile = row.author
      ? profilesMap.get(String(row.author))
      : undefined;
    const name =
      profile?.full_name ||
      profile?.username ||
      (viewerId && row.author === viewerId && viewerDisplayName) ||
      "User";
    const mediaUrls: string[] = Array.isArray(row.media_urls)
      ? (row.media_urls as string[]).filter(Boolean)
      : [];

    return {
      id: pid,
      user: {
        id: String(row.author || ""),
        name,
        username: profile?.username || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        bio: profile?.bio || undefined,
      },
      createdAt: row.created_at || new Date().toISOString(),
      text: row.text || undefined,
      attachments: mediaUrls.map((url) => {
        const clean = String(url).split("?")[0].toLowerCase();
        const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/.test(clean);
        return {
          id: url,
          type: isVideo ? "video" : "image",
          url,
        };
      }),
      tags: [],
      meta: {
        model: normalizeString(row.model_name),
        modelLabel: normalizeString(row.model_label),
        modelKey: normalizeString(row.model_key),
        modelKind: normalizeString(row.model_kind),
        modelProvider: normalizeString(row.model_provider),
        modelProviderSlug: normalizeString(row.model_provider_slug),
        category: normalizeString(row.category),
        categorySlug: normalizeString(row.category_slug),
        subCategory: normalizeString(row.sub_category),
        subCategorySlug: normalizeString(row.sub_category_slug),
      },
      stats: { likes: 0, comments: 0, shares: 0 },
      liked: false,
      saved: false,
    } satisfies FeedPost;
  });

  const followedPosts: FeedPost[] = [];
  const otherPosts: FeedPost[] = [];

  for (const p of basePosts) {
    if (followedIds.has(p.user.id)) followedPosts.push(p);
    else otherPosts.push(p);
  }

  const finalFeed = [...followedPosts, ...otherPosts];

  const authorIdSet = new Set<string>(
    finalFeed.map((p) => p.user.id).filter(Boolean)
  );
  const authorIdList = Array.from(authorIdSet);

  const postIdList = finalFeed.map((p) => p.id).filter(Boolean);

  let viewerLikedSet = new Set<string>();
  let viewerSavedSet = new Set<string>();

  if (postIdList.length > 0) {
    const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id, user_id")
        .in("post_id", postIdList),
      supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIdList),
    ]);

    const likeCountMap = new Map<string, number>();
    for (const row of likeRows || []) {
      const key = String(row.post_id);
      likeCountMap.set(key, (likeCountMap.get(key) || 0) + 1);
      if (viewerId && row.user_id === viewerId) {
        viewerLikedSet.add(key);
      }
    }

    const commentCountMap = new Map<string, number>();
    for (const row of commentRows || []) {
      const key = String(row.post_id);
      commentCountMap.set(key, (commentCountMap.get(key) || 0) + 1);
    }

    if (viewerId) {
      const { data: savedRows } = await supabase
        .from("post_saves")
        .select("post_id")
        .eq("user_id", viewerId)
        .in("post_id", postIdList);
      for (const row of savedRows || []) {
        viewerSavedSet.add(String(row.post_id));
      }
    }

    for (const post of finalFeed) {
      const likes = likeCountMap.get(post.id) ?? 0;
      const comments = commentCountMap.get(post.id) ?? 0;
      post.stats = {
        likes,
        comments,
        shares: post.stats?.shares ?? 0,
      };
      post.liked = viewerLikedSet.has(post.id);
      post.saved = viewerSavedSet.has(post.id);
    }
  }

  if (authorIdList.length > 0) {
    const { data: postsAuthorRows } = await supabase
      .from("posts")
      .select("author")
      .in("author", authorIdList);

    const postsCountMap = new Map<string, number>();
    for (const r of postsAuthorRows || []) {
      const aid = String(r.author);
      postsCountMap.set(aid, (postsCountMap.get(aid) || 0) + 1);
    }

    const { data: followersRows } = await supabase
      .from("follows")
      .select("following_id", { count: "exact" })
      .in("following_id", authorIdList);

    const followersMap = new Map<string, number>();
    for (const r of followersRows || []) {
      const key = String(r.following_id);
      followersMap.set(key, (followersMap.get(key) || 0) + 1);
    }

    const { data: followingRowsCounts } = await supabase
      .from("follows")
      .select("follower_id", { count: "exact" })
      .in("follower_id", authorIdList);

    const followingMap = new Map<string, number>();
    for (const r of followingRowsCounts || []) {
      const key = String(r.follower_id);
      followingMap.set(key, (followingMap.get(key) || 0) + 1);
    }

    for (const p of finalFeed) {
      p.user.postsCount = postsCountMap.get(p.user.id) ?? 0;
      p.user.followersCount = followersMap.get(p.user.id) ?? 0;
      p.user.followingCount = followingMap.get(p.user.id) ?? 0;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold">Cookbook</div>
          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
            <UserButton
              userId={user?.id}
              name={user?.displayName || ""}
              email={user?.email || ""}
              imageSrc={user?.avatarUrl ?? null}
              size="icon"
              className="md:hidden"
            />
            <p className="hidden md:block">
              {(() => {
                const now = new Date();
                const time = now.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                });
                const date = now.toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "2-digit",
                });
                const day = now.toLocaleDateString(undefined, {
                  weekday: "short",
                });
                return `${time} - ${date} - ${day}`;
              })()}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {postsError ? (
          <div className="text-sm text-destructive">
            Failed to load feed: {postsError.message}
          </div>
        ) : finalFeed.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No posts yet. Be the first to create one!
          </div>
        ) : (
          <PostFeed posts={finalFeed} currentUserId={viewerId} />
        )}
      </main>
    </div>
  );
}
