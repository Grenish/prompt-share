"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from 'nextjs-toploader/app';
import { toggleFollow, getFollowStateFor, type FollowActionState } from "@/util/actions/followActions";
import { isNotAuthenticatedError, navigateToLogin } from "@/util/auth/client-auth";

export function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [initialized, setInitialized] = useState(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [followers, setFollowers] = useState<number>(0);
  const router = useRouter();

  const [state, formAction, pending] = useActionState<FollowActionState, FormData>(
    toggleFollow,
    { ok: false, following: false } as FollowActionState
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { followers, following } = await getFollowStateFor(targetUserId);
      if (!active) return;
      setFollowers(followers);
      setFollowing(following);
      setInitialized(true);
    })();
    return () => {
      active = false;
    };
  }, [targetUserId]);

  useEffect(() => {
    if (state) {
      // Check if user is not authenticated
      if (isNotAuthenticatedError(state.error)) {
        navigateToLogin();
        return;
      }
      
      if (state.ok) {
        if (typeof state.followers === "number") setFollowers(state.followers);
        setFollowing(state.following);
        // Refresh current route to update any server components showing counts
        router.refresh();
      }
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <Button type="submit" disabled={pending || !initialized} size="sm">
        {following ? "Unfollow" : "Follow"}
      </Button>
    </form>
  );
}
