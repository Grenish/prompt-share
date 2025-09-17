import { createClient } from "@/util/supabase/server";
import { normalizeUser } from "@/lib/normalizeUser";
import Image from "next/image";
import { fetchFollows, updateUserInfo } from "@/util/actions";
import ProfileEditTrigger from "@/components/profile/profile-edit-trigger";

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
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background"></div>
            </div>
          )}

          {/* Content */}
          <div className="relative p-4 sm:p-6 md:p-8">
            {/* Compact Header - Responsive Layout */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Image
                  src={user?.avatarUrl || ""}
                  alt="Profile Picture"
                  width={120}
                  height={120}
                  className="rounded-full border border-border bg-background w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px]"
                />
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left w-full">
                {/* Name and Actions */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {user?.displayName || "Unknown User"}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      @{profileInfo?.profile?.username || "username"}
                    </p>
                  </div>
                  {/* Edit Profile Dialog Trigger */}
                  <ProfileEditTrigger
                    initialBio={profileInfo?.profile?.bio ?? ""}
                    initialBackgroundUrl={profileInfo?.profile?.backgroundUrl ?? null}
                  />
                </div>

                {/* Stats - Responsive Grid */}
                <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 md:gap-8">
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
                      0
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

        {/* Content Tabs - Responsive */}
        <div className="px-4 sm:px-6 md:px-8 mt-10">
          <div className="border-t border-border">
            <div className="flex gap-4 sm:gap-6 md:gap-8 pt-3 sm:pt-4 overflow-x-auto">
              <button className="pb-2 sm:pb-3 border-b-2 border-foreground text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                Prompts
              </button>
              <button className="pb-2 sm:pb-3 border-b-2 border-transparent text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                About
              </button>
              <button className="pb-2 sm:pb-3 border-b-2 border-transparent text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                Saved Prompts
              </button>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="py-12 sm:py-16 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mx-auto mb-3 sm:mb-4"></div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              No posts yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
