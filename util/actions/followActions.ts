"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

export type FollowActionState = {
  ok: boolean;
  following: boolean;
  followers?: number;
  error?: string | null;
};

export async function getFollowStateFor(targetUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", targetUserId),
    user
      ? supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
      : Promise.resolve({ count: 0, error: null } as any),
  ]);

  return {
    followers: followersRes.count ?? 0,
    following: (followingRes.count ?? 0) > 0,
  } as { followers: number; following: boolean };
}

export async function toggleFollow(
  _prev: FollowActionState,
  formData: FormData
): Promise<FollowActionState> {
  const supabase = await createClient();
  const targetUserId = String(formData.get("targetUserId") || "");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, following: false, error: "Not authenticated" };
  }
  if (!targetUserId || targetUserId === user.id) {
    // ignore self follow
    const { followers } = await getFollowStateFor(targetUserId || user.id);
    return { ok: true, following: false, followers };
  }

  // Check existing
  const { data: existing, error: existingErr } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();
  if (existingErr) {
    return { ok: false, following: false, error: existingErr.message };
  }

  if (existing?.id) {
    // Unfollow
    const { error: delErr } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);
    if (delErr) return { ok: false, following: true, error: delErr.message };
  } else {
    // Follow
    const { error: insErr } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetUserId });
    if (insErr) return { ok: false, following: false, error: insErr.message };
  }

  const { followers, following } = await getFollowStateFor(targetUserId);

  // Revalidate pages that may show follow/follower counts
  try {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", targetUserId)
      .maybeSingle();
    const targetUsername = (targetProfile as any)?.username as string | undefined;
    revalidatePath("/home/explore");
    if (targetUsername) revalidatePath(`/home/profile/${targetUsername}`);
    revalidatePath("/home/profile"); // viewer's own counts
  } catch {}

  return { ok: true, following, followers };
}
