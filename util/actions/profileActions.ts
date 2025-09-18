"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

export type UpdateProfileAvatarState = {
  ok: boolean;
  publicUrl?: string | null;
  error?: string | null;
};

export async function updateProfileAvatar(
  _prevState: UpdateProfileAvatarState,
  formData: FormData
): Promise<UpdateProfileAvatarState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    const remove = formData.get("remove");
    const file = formData.get("avatar") as File | null;

    // Handle remove avatar
    if (remove && (!file || (file as any).size === 0)) {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
      if (error) return { ok: false, error: error.message };
      // Revalidate layout so avatar updates everywhere
      revalidatePath("/", "layout");
      return { ok: true, publicUrl: null };
    }

    if (!file || (file as any).size === 0) {
      return { ok: false, error: "No file provided" };
    }

    // Derive extension and path
    const extFromName = file.name?.split(".").pop();
    const extFromType = file.type?.split("/")[1];
    const ext = (extFromName || extFromType || "webp").replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    // Store under top-level folder = user.id to align with common RLS policies
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "image/webp",
        upsert: true,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
    if (updateError) return { ok: false, error: updateError.message };

    // Revalidate layout so avatar updates everywhere
    revalidatePath("/", "layout");

    return { ok: true, publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export type UserInfoResult = {
  ok: boolean;
  profile?: {
    username: string | null;
    bio: string | null;
    backgroundUrl: string | null;
  };
  error?: string | null;
};

export async function updateUserInfo(
  _formData?: FormData
): Promise<UserInfoResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  //  get the data like bio, background image and username from the supabase table named "profiles"
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const username = (profileRow as any)?.username ?? null;
  const bio = (profileRow as any)?.bio ?? (profileRow as any)?.about ?? null;
  const backgroundUrl = (profileRow as any)?.background_image ?? null;

  return {
    ok: true,
    profile: { username, bio, backgroundUrl },
  };
}

export type FollowsResult = {
  ok: boolean;
  followers?: number;
  following?: number;
  error?: string | null;
};

export async function fetchFollows(): Promise<FollowsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  //  get the count of followers and following from the supabase table named "follows"
  // Assumes a schema with columns follower_id (the one who follows) and following_id (the one being followed)
  const [
    { count: followersCount, error: followersError },
    { count: followingCount, error: followingError },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", user.id),
  ]);

  if (followersError || followingError) {
    return {
      ok: false,
      error:
        followersError?.message ||
        followingError?.message ||
        "Failed to fetch follows",
    };
  }

  return {
    ok: true,
    followers: followersCount ?? 0,
    following: followingCount ?? 0,
  };
}

export type UpdateProfileSettingsState = {
  ok: boolean;
  error?: string | null;
  backgroundUrl?: string | null;
  bio?: string | null;
};

/**
 * Update profile bio and background image.
 * Accepts FormData keys:
 * - bio: string | null
 * - background: File (optional)
 * - removeBackground: "on" | undefined
 */
export async function updateProfileSettings(
  _prev: UpdateProfileSettingsState,
  formData: FormData
): Promise<UpdateProfileSettingsState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    const bioRaw = formData.get("bio");
    const bio = typeof bioRaw === "string" ? bioRaw.trim() : null;
    const removeBackground = formData.get("removeBackground");
    const bgFile = formData.get("background") as File | null;

    let newBackgroundUrl: string | null | undefined = undefined; // undefined = unchanged

    // Handle background removal if requested and no new file provided
    if (removeBackground && (!bgFile || (bgFile as any).size === 0)) {
      newBackgroundUrl = null;
    }

    // Handle background upload if a file is provided
    if (bgFile && (bgFile as any).size > 0) {
      const extFromName = bgFile.name?.split(".").pop();
      const extFromType = bgFile.type?.split("/")[1];
      const ext = (extFromName || extFromType || "webp").replace(
        /[^a-zA-Z0-9]/g,
        ""
      );
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, bgFile, {
          cacheControl: "3600",
          contentType: bgFile.type || "image/webp",
          upsert: true,
        });
      if (uploadError) return { ok: false, error: uploadError.message };

      const { data: publicData } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);
      newBackgroundUrl = publicData.publicUrl;
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};
    if (bio !== undefined) updatePayload.bio = bio || null;
    if (newBackgroundUrl !== undefined)
      updatePayload.background_image = newBackgroundUrl;

    if (Object.keys(updatePayload).length > 0) {
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updatePayload }, { onConflict: "id" });
      if (upsertError) return { ok: false, error: upsertError.message };
    }

    // Refresh the profile page
    revalidatePath("/dashboard/profile");

    return { ok: true, bio: bio ?? undefined, backgroundUrl: newBackgroundUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}
