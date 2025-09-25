import { createClient } from "@/util/supabase/server";
import { redirect } from "next/navigation";
import { normalizeUser } from "@/lib/normalizeUser";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PostFeed, type Post as FeedPost } from "@/components/post-feed";

// Server component that renders the authenticated user's home feed.
// Minimal, read-only implementation: fetch recent posts + author profiles.
// NOTE: We intentionally avoid complex joins for tags / likes until schema confirmed.

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const user = normalizeUser(data.user);

  const viewerId = user?.id;
  const viewerDisplayName = user?.displayName;

  // Fetch list of users the viewer follows
  const { data: followingRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId)
    .limit(500);
  const followedIds = new Set<string>(
    (followingRows || [])
      .map((r: any) => String((r as any).following_id))
      .filter(Boolean)
  );

  // Fetch recent posts (single query ordered by time)
  const { data: postRows, error: postsError } = await supabase
    .from("posts")
    .select(
      "id, created_at, text, category, sub_category, model_name, media_urls, author"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  // Map authors to fetch profile info (username, full_name, avatar)
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
      profilesMap.set(String((p as any).id), {
        username: (p as any).username ?? null,
        full_name: (p as any).full_name ?? null,
        avatar_url: (p as any).avatar_url ?? null,
        bio: (p as any).bio ?? null,
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
      attachments: mediaUrls.map((url) => ({
        id: url,
        type: "image" as const,
        url,
      })),
      tags: [], // Tag enrichment skipped (minimal implementation)
      meta: {
        model: row.model_name || undefined,
        category: row.category || undefined,
        subCategory: row.sub_category || undefined,
      },
      stats: { likes: 0, comments: 0, shares: 0 },
      liked: false,
      saved: false,
    } satisfies FeedPost;
  });

  // Reorder so followed users' posts appear first while preserving
  // relative recency inside each bucket (since base posts are already
  // sorted by created_at desc) – stable partition.
  const followedPosts: FeedPost[] = [];
  const otherPosts: FeedPost[] = [];
  for (const p of basePosts) {
    if (followedIds.has(p.user.id)) followedPosts.push(p);
    else otherPosts.push(p);
  }
  const finalFeed = [...followedPosts, ...otherPosts];

  // ---------------- Enrich with counts (posts / followers / following) ----------------
  // Collect unique author IDs
  const authorIdSet = new Set<string>(finalFeed.map((p) => p.user.id).filter(Boolean));
  const authorIdList = Array.from(authorIdSet);

  if (authorIdList.length > 0) {
    // 1. Posts count per author: fetch authors then count occurrences client-side (Postgrest grouping is limited without RPC)
    const { data: postsAuthorRows } = await supabase
      .from("posts")
      .select("author")
      .in("author", authorIdList);
    const postsCountMap = new Map<string, number>();
    for (const r of postsAuthorRows || []) {
      const aid = String((r as any).author);
      postsCountMap.set(aid, (postsCountMap.get(aid) || 0) + 1);
    }

    // 2. Followers count (people who follow this author) & Following count (people this author follows)
    const { data: followersRows } = await supabase
      .from("follows")
      .select("following_id", { count: "exact" })
      .in("following_id", authorIdList);
    const followersMap = new Map<string, number>();
    for (const r of followersRows || []) {
      const key = String((r as any).following_id);
      followersMap.set(key, (followersMap.get(key) || 0) + 1);
    }

    const { data: followingRowsCounts } = await supabase
      .from("follows")
      .select("follower_id", { count: "exact" })
      .in("follower_id", authorIdList);
    const followingMap = new Map<string, number>();
    for (const r of followingRowsCounts || []) {
      const key = String((r as any).follower_id);
      followingMap.set(key, (followingMap.get(key) || 0) + 1);
    }

    // Attach counts to finalFeed
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
          <SidebarTrigger />
          <div className="text-lg font-semibold">Cookbook</div>
          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
            {user?.displayName}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
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
