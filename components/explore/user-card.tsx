import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, FileText } from "lucide-react";
import Image from "next/image";

interface UserCardProps {
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  followers: number;
  following: number;
  numPosts: number;
}

export default function UserCard({
  name,
  username,
  bio,
  avatarUrl,
  bannerUrl,
  followers,
  following,
  numPosts,
}: UserCardProps) {
  const format = (n: number) =>
    new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);

  return (
    <Card className="w-full max-w-md p-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md focus-within:shadow-md">
      {/* Banner */}
      <CardHeader className="relative p-0 mb-0">
        <div className="relative h-24 sm:h-32">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={`${name ? name + "'s" : "User"} banner`}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-32 bg-muted" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40" />
        </div>

        {/* Avatar */}
        <Avatar className="absolute -bottom-8 left-4 h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-background shadow-md">
          {avatarUrl && <AvatarImage src={avatarUrl || ""} alt={name} />}
          <AvatarFallback>{name ? name[0].toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
      </CardHeader>

      {/* Info */}
      <CardContent className="pt-3 sm:pt-5 px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg truncate">
                {name}
              </span>
            </div>
            <span className="text-muted-foreground text-sm truncate">
              @{username}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-base text-xs truncate">{bio}</span>
            </div>
          </div>

          <Button size="sm" className="rounded-full px-3 sm:px-4">
            Follow
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            <span className="font-medium text-foreground">
              {format(followers)}
            </span>
            <span className="hidden sm:inline">Followers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" aria-hidden />
            <span className="font-medium text-foreground">
              {format(following)}
            </span>
            <span className="hidden sm:inline">Following</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden />
            <span className="font-medium text-foreground">
              {format(numPosts)}
            </span>
            <span className="hidden sm:inline">Posts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
