"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, FileText } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  toggleFollow,
  type FollowActionState,
} from "@/util/actions/followActions";

interface UserCardProps {
  name: string;
  username: string;
  userId: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  followers: number;
  following: number;
  numPosts: number;
  href?: string;
}

export default function UserCard({
  name,
  username,
  userId,
  bio,
  avatarUrl,
  bannerUrl,
  followers,
  following,
  numPosts,
  href,
}: UserCardProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = React.useState<boolean | null>(null);
  const [followersCount, setFollowersCount] = React.useState<number>(followers);
  const [pending, setPending] = React.useState(false);
  const supabaseRef = React.useRef<ReturnType<
    typeof import("@/util/supabase/client").createClient
  > | null>(null);

  React.useEffect(() => {
    let active = true;
    const init = async () => {
      const { createClient } = await import("@/util/supabase/client");
      const supabase = createClient();
      supabaseRef.current = supabase;
      const { data } = await supabase.auth.getUser();
      const selfId = data?.user?.id;
      if (!selfId) {
        if (active) setIsFollowing(false);
        return;
      }
      const { count, error } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", selfId)
        .eq("following_id", userId);
      if (!active) return;
      if (error) {
        setIsFollowing(false);
      } else {
        setIsFollowing((count ?? 0) > 0);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [userId]);

  const [state, formAction, actionPending] = useActionState<
    FollowActionState,
    FormData
  >(toggleFollow, { ok: false, following: false });

  React.useEffect(() => {
    if (state && state.ok) {
      setIsFollowing(state.following);
      if (typeof state.followers === "number")
        setFollowersCount(state.followers);
      router.refresh();
    }
  }, [state, router]);
  const format = (n: number) =>
    new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);

  return (
    <Card
      className="w-full max-w-md p-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md focus-within:shadow-md"
      onClick={href ? () => router.push(href) : undefined}
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={
        href
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }
          : undefined
      }
      style={href ? { cursor: "pointer" } : undefined}
    >
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
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : (
            <AvatarFallback>
              {name ? name[0].toUpperCase() : "U"}
            </AvatarFallback>
          )}
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

          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <input type="hidden" name="targetUserId" value={userId} />
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-3 sm:px-4"
              disabled={actionPending || isFollowing === null}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          </form>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            <span className="font-medium text-foreground">
              {format(followersCount)}
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
