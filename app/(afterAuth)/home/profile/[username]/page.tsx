import { createClient } from "@/util/supabase/server";
import Image from "next/image";
import ProfileEditTrigger from "@/components/profile/profile-edit-trigger";
import {
  PostFeed,
  type Post as FeedPost,
  type PostMedia,
} from "@/components/post-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutMeSection } from "@/components/profile/about-me";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/profile/follow-button";

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  background_image: string | null;
};

export default async function DashboardProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string };
}) {
  const supabase = await createClient();
  const { username } = await (params as Promise<{ username: string }>);

  const [{ data: viewerData }, { data: profile, error: profileErr }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select("id, username, full_name, bio, avatar_url, background_image")
        .eq("username", username)
        .maybeSingle<ProfileRow>(),
    ]);

  if (profileErr) throw new Error(profileErr.message);
  if (!profile) notFound();

  const viewerId = viewerData?.user?.id ?? null;
  const isSelf = viewerId && profile.id === viewerId;

  const targetId = profile.id;
  const targetUsername = profile.username;
  const targetDisplayName = profile.full_name || null;
  const targetAvatar = profile.avatar_url || null;
  const targetBackground = profile.background_image || null;
  const targetBio = profile.bio || null;

  const [followersRes, followingRes, postsCountRes, aboutRes, postsRes] =
    await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", targetId),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetId),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author", targetId),
      supabase
        .from("abouts")
        .select("content")
        .eq("user_id", targetId)
        .maybeSingle<{ content: string | null }>(),
      supabase
        .from("posts")
        .select(
          "id, created_at, text, media_urls, model_name, category, sub_category"
        )
        .eq("author", targetId)
        .order("created_at", { ascending: false }),
    ]);

  const followersCount = followersRes.count ?? 0;
  const followingCount = followingRes.count ?? 0;
  const postsTotal = postsCountRes.count ?? 0;
  const aboutContent = aboutRes.data?.content ?? null;

  const videoExts = new Set(["mp4", "webm", "mov", "mkv", "m4v", "avi"]);

  const toMediaItems = (urls?: string[] | null): PostMedia[] => {
    if (!urls?.length) return [];
    return urls.map((url) => {
      const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
      const isVideo = !!ext && videoExts.has(ext);
      return { type: isVideo ? "video" : "image", url };
    });
  };

  const posts: FeedPost[] =
    (postsRes.data || []).map((row) => ({
      id: String(row.id),
      user: {
        id: targetId,
        name: targetDisplayName || targetUsername || "Unknown User",
        username: targetUsername || undefined,
        avatarUrl: targetAvatar ?? undefined,
        verified: false,
      },
      createdAt: row.created_at,
      text: row.text ?? undefined,
      attachments: toMediaItems(row.media_urls as string[] | null),
      tags: (row as any).tags ?? undefined,
      meta: {
        model: (row as any).model_name ?? undefined,
        category: (row as any).category ?? undefined,
        subCategory: (row as any).sub_category ?? undefined,
      },
      stats: { likes: 0, comments: 0, shares: 0 },
      liked: false,
      saved: false,
    })) || [];

  const initialsFrom = (name?: string | null, handle?: string | null) => {
    const src = (name || handle || "").trim();
    if (!src) return "U";
    const parts = src.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) {
      const w = parts[0];
      return (w[0] + (w.match(/[A-Z]/)?.[0] || w[1] || "")).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {targetBackground && (
            <div className="absolute inset-0 h-[280px] sm:h-[300px] overflow-hidden">
              <Image
                src={targetBackground}
                alt="Background"
                fill
                className="object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
            </div>
          )}

          <div className="relative p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              <div className="relative flex-shrink-0">
                <Avatar className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] border border-border bg-background">
                  <AvatarImage
                    src={targetAvatar ?? undefined}
                    alt={`${
                      targetDisplayName || targetUsername || "User"
                    } avatar`}
                  />
                  <AvatarFallback className="bg-muted text-foreground text-lg sm:text-xl md:text-2xl font-medium">
                    {initialsFrom(targetDisplayName, targetUsername)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background" />
              </div>

              <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {targetDisplayName || targetUsername || "Unknown User"}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      @{targetUsername || "username"}
                    </p>
                  </div>
                  {isSelf ? (
                    <ProfileEditTrigger
                      initialBio={targetBio ?? ""}
                      initialBackgroundUrl={targetBackground ?? null}
                    />
                  ) : (
                    <FollowButton targetUserId={targetId} />
                  )}
                </div>

                <div className="flex justify-center sm:justify-start gap-6 md:gap-8">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {followersCount}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Followers
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {followingCount}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Following
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {postsTotal}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Posts
                    </p>
                  </div>
                </div>

                {targetBio && (
                  <p className="text-foreground/80 text-sm px-2 sm:px-0">
                    {targetBio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8 relative">
          <Tabs defaultValue="prompts" className="w-full">
            <TabsList className="w-full justify-start gap-2 overflow-x-auto">
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="saved">Saved Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="prompts" className="py-6 sm:py-8">
              {posts.length > 0 ? (
                <PostFeed posts={posts} className="max-w-2xl mx-auto" />
              ) : (
                <div className="py-12 sm:py-16 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    No posts yet
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="py-6 sm:py-8">
              <AboutMeSection
                profileInfo={{
                  bio: aboutContent ?? targetBio ?? undefined,
                  backgroundUrl: targetBackground ?? null,
                }}
                followCounts={{
                  followers: followersCount,
                  following: followingCount,
                }}
                postCount={postsTotal}
                canEdit={Boolean(isSelf)}
              />
            </TabsContent>

            <TabsContent value="saved" className="py-6 sm:py-8">
              <div className="mx-auto text-sm flex flex-col items-center justify-center text-muted-foreground pointer-events-none select-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="150"
                  height="150"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path
                    d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z"
                    opacity="0.2"
                  ></path>
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.08,64a8,8,0,1,1-13.84,8c-7.47-12.91-19.21-20-33.08-20s-25.61,7.1-33.08,20a8,8,0,1,1-13.84-8c10.29-17.79,27.39-28,46.92-28S164.63,154.2,174.92,172Z"></path>
                </svg>
                <span>
                  <h2>Saved prompts will appear here.</h2>
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
