import { createClient } from "@/util/supabase/server";
import { normalizeUser } from "@/lib/normalizeUser";
import Image from "next/image";
import { fetchFollows, updateUserInfo } from "@/util/actions/profileActions";
import ProfileEditTrigger from "@/components/profile/profile-edit-trigger";
import {
  PostFeed,
  type Post as FeedPost,
  type PostMedia,
} from "@/components/post-feed";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("User not authenticated");
  }
  const user = normalizeUser(data.user);

  const [profileInfo, followCounts] = await Promise.all([
    updateUserInfo(),
    fetchFollows(),
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
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Image
                  src={user?.avatarUrl || ""}
                  alt="Profile Picture"
                  width={150}
                  height={150}
                  className="rounded-full border border-border bg-background w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px]"
                />
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background" />
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
                    initialBackgroundUrl={profileInfo?.profile?.backgroundUrl ?? null}
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
                <div className="py-12 sm:py-16 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    No posts yet
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="py-6 sm:py-8">
              <div className="max-w-2xl mx-auto space-y-4 text-sm">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-muted-foreground">
                    {profileInfo?.profile?.bio ||
                      "No bio added yet. Use the edit button to add your bio."}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Stats</h3>
                  <div className="text-muted-foreground">
                    Followers: {followCounts?.followers ?? 0}
                    <br />
                    Following: {followCounts?.following ?? 0}
                    <br />
                    Posts: {postCount}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="py-6 sm:py-8">
              <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
                Saved prompts will appear here.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}