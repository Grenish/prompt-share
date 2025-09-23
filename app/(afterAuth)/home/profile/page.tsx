import { createClient } from "@/util/supabase/server";
import { normalizeUser } from "@/lib/normalizeUser";
import Image from "next/image";
import {
  fetchFollows,
  updateUserInfo,
  fetchAboutMe,
  updateAboutMe,
} from "@/util/actions/profileActions";
import ProfileEditTrigger from "@/components/profile/profile-edit-trigger";
import {
  PostFeed,
  type Post as FeedPost,
  type PostMedia,
} from "@/components/post-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutMeSection } from "@/components/profile/about-me";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("User not authenticated");
  }
  const user = normalizeUser(data.user);

  const [profileInfo, followCounts, aboutMe] = await Promise.all([
    updateUserInfo(),
    fetchFollows(),
    fetchAboutMe(),
  ]);

  // Fetch user's posts
  const { data: postRows } = await supabase
    .from("posts")
    .select("*")
    .eq("author", user!.id)
    .order("created_at", { ascending: false });

  const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
  const videoExts = ["mp4", "webm", "mov", "mkv", "m4v", "avi"];

  const toMediaItems = (urls: string[] | null | undefined): PostMedia[] => {
    if (!urls || urls.length === 0) return [];
    return urls.map((url) => {
      const clean = url.split("?")[0].split("#")[0];
      const ext = (clean.split(".").pop() || "").toLowerCase();
      const isVideo = videoExts.includes(ext);
      return { type: isVideo ? "video" : "image", url } as PostMedia;
    });
  };

  const posts: FeedPost[] = (postRows || []).map((row: any) => ({
    id: String(row.id),
    user: {
      id: user!.id,
      name: user!.displayName || "Unknown User",
      username: profileInfo?.profile?.username || undefined,
      avatarUrl: user!.avatarUrl || undefined,
      verified: false,
    },
    createdAt: row.created_at ?? Date.now(),
    text: row.text ?? undefined,
    attachments: toMediaItems(row.media_urls),
    tags: row.tags ?? undefined, // if you store tags array
    meta: {
      model: row.model_name ?? undefined,
      category: row.category ?? undefined,
      subCategory: row.sub_category ?? undefined,
    },
    stats: { likes: 0, comments: 0, shares: 0 },
    liked: false,
    saved: false,
  }));

  const postCount = posts.length;

  function initialsFrom(name?: string | null, username?: string | null) {
    const source = (name || username || "").trim();
    if (!source) return "U";
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) {
      const w = parts[0];
      const first = w.charAt(0);
      const second = w.slice(1).match(/[A-Z]/)?.[0] || w.charAt(1) || "";
      return (first + second).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {profileInfo?.profile?.backgroundUrl && (
            <div className="absolute inset-0 h-[280px] sm:h-[300px] overflow-hidden">
              <Image
                src={profileInfo.profile.backgroundUrl}
                alt="Background"
                fill
                className="object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
            </div>
          )}

          {/* Content */}
          <div className="relative p-4 sm:p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              <div className="relative flex-shrink-0">
                <Avatar className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] border border-border bg-background">
                  <AvatarImage
                    src={user?.avatarUrl || undefined}
                    alt={`${
                      user?.displayName ||
                      profileInfo?.profile?.username ||
                      "User"
                    } avatar`}
                  />
                  <AvatarFallback className="bg-muted text-foreground text-lg sm:text-xl md:text-2xl font-medium">
                    {initialsFrom(
                      user?.displayName,
                      profileInfo?.profile?.username
                    )}
                  </AvatarFallback>
                </Avatar>

                <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background" />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {user?.displayName || "Unknown User"}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      @{profileInfo?.profile?.username || "username"}
                    </p>
                  </div>
                  <ProfileEditTrigger
                    initialBio={profileInfo?.profile?.bio ?? ""}
                    initialBackgroundUrl={
                      profileInfo?.profile?.backgroundUrl ?? null
                    }
                  />
                </div>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-6 md:gap-8">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {followCounts?.followers ?? 0}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Followers
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {followCounts?.following ?? 0}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Following
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {postCount}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Posts
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {profileInfo?.profile?.bio && (
                  <p className="text-foreground/80 text-sm px-2 sm:px-0">
                    {profileInfo.profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 md:px-8 relative">
          <Tabs defaultValue="prompts" className="w-full">
            <TabsList className="w-full justify-start gap-2 overflow-x-auto">
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="saved">Saved Prompts</TabsTrigger>
              <TabsTrigger value="liked-post">Liked</TabsTrigger>
            </TabsList>

            <TabsContent value="prompts" className="py-6 sm:py-8">
              {posts.length > 0 ? (
                <PostFeed
                  posts={posts}
                  className="max-w-2xl mx-auto"
                  // Optional: wire up async comments when you have an API
                  // fetchComments={async (post) => {
                  //   const { data } = await supabase.from("comments").select("*").eq("post_id", post.id).order("created_at", { ascending: false });
                  //   return (data || []).map(mapToPostComment);
                  // }}
                  // onSubmitComment={async (post, text) => {
                  //   const { data } = await supabase.from("comments").insert({ post_id: post.id, text }).select("*").single();
                  //   return mapToPostComment(data);
                  // }}
                />
              ) : (
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
                    <h2>You haven't posted anything yet.</h2>
                  </span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="py-6 sm:py-8">
              <AboutMeSection
                profileInfo={{
                  bio:
                    aboutMe?.content ?? profileInfo?.profile?.bio ?? undefined,
                  backgroundUrl: profileInfo?.profile?.backgroundUrl ?? null,
                }}
                followCounts={{
                  followers: followCounts?.followers ?? 0,
                  following: followCounts?.following ?? 0,
                }}
                postCount={postCount}
                canEdit={true}
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
            <TabsContent value="liked-post" className="py-6 sm:py-8">
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
                  <h2>Liked posts will only be visible to you.</h2>
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
