"use server";

import { createClient } from "../supabase/server";

export type PostActionInput = {
  text: string;
  files?: File[];
  category: string;
  subCategory: string;
  modelName: string;
  tags?: string[];
};

export type PostActionResult = {
  ok: boolean;
  post?: any;
  error?: string;
};

/**
 * Uploads images to Supabase Storage (bucket: postsBucket) and creates a post.
 * - Storage path: {user.id}/{uuid_filename}
 * - Saves public URLs into posts.media_urls (text[] or varchar[])
 * - Sets posts.author to the authenticated user's id
 * - Inserts/upserts tags and links via post_tags (post_id, tag_id)
 */
export async function postAction(
  input: PostActionInput
): Promise<PostActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const bucket = "postsBucket";

  try {
    // Validate
    const text = (input.text || "").trim();
    if (!text && !(input.files && input.files.length)) {
      return { ok: false, error: "Post must include text or media" };
    }

    const category = (input.category || "").trim();
    const subCategory = (input.subCategory || "").trim();
    const modelName = (input.modelName || "").trim();
    const tags = (input.tags || []).map((t) => t.trim()).filter(Boolean);

    // 1) Upload files (if any)
    const mediaUrls: string[] = [];
    const files = input.files || [];

    for (const file of files) {
      // Derive extension
      const extFromName = file.name?.split(".").pop();
      const extFromType = file.type?.split("/")[1];
      const ext = (extFromName || extFromType || "bin").replace(
        /[^a-zA-Z0-9]/g,
        ""
      );
      const uuid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const fileName = `${uuid}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) {
        return {
          ok: false,
          error: `Upload failed for ${file.name}: ${uploadError.message}`,
        };
      }

      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      if (!publicData?.publicUrl) {
        return {
          ok: false,
          error: `Failed to get public URL for ${file.name}`,
        };
      }
      mediaUrls.push(publicData.publicUrl);
    }

    // 2) Insert post
    const insertPayload: Record<string, any> = {
      text,
      category,
      sub_category: subCategory,
      model_name: modelName,
      media_urls: mediaUrls,
      author: user.id, // RLS/DB default could also be auth.uid(), but we set explicitly
    };

    const { data: insertedPost, error: insertError } = await supabase
      .from("posts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError || !insertedPost) {
      return {
        ok: false,
        error: insertError?.message || "Failed to insert post",
      };
    }

    // 3) Tags handling (optional)
    if (tags.length > 0) {
      // Fetch existing tags by name
      const { data: existingTags, error: fetchTagsError } = await supabase
        .from("tags")
        .select("id, name")
        .in("name", tags);
      if (fetchTagsError) {
        return { ok: false, error: fetchTagsError.message };
      }

      const existingMap = new Map<string, string>();
      (existingTags || []).forEach((t: any) => existingMap.set(t.name, t.id));

      const missing = tags.filter((t) => !existingMap.has(t));

      // Insert missing tags
      if (missing.length > 0) {
        const { data: newlyInserted, error: insertTagsError } = await supabase
          .from("tags")
          .insert(missing.map((name) => ({ name })))
          .select("id, name");
        if (insertTagsError) {
          // Unique constraint might throw on race; attempt to re-fetch
          const constraintConflict =
            insertTagsError.message?.toLowerCase().includes("duplicate") ||
            insertTagsError.code === "23505";
          if (!constraintConflict) {
            return { ok: false, error: insertTagsError.message };
          }
        }

        // After potential race, fetch all to ensure we have IDs
        const { data: allTags, error: refetchError } = await supabase
          .from("tags")
          .select("id, name")
          .in("name", tags);
        if (refetchError) {
          return { ok: false, error: refetchError.message };
        }
        (allTags || []).forEach((t: any) => existingMap.set(t.name, t.id));
      }

      const tagIds = tags
        .map((t) => existingMap.get(t))
        .filter((id): id is string => Boolean(id));

      if (tagIds.length > 0) {
        const joinRows = tagIds.map((tagId) => ({
          post_id: (insertedPost as any).id,
          tag_id: tagId,
        }));

        const { error: linkError } = await supabase
          .from("post_tags")
          .insert(joinRows);
        if (linkError) {
          return { ok: false, error: linkError.message };
        }
      }
    }

    return { ok: true, post: insertedPost };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export async function deletePosts(postId: string): Promise<PostActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  // Check if the post exists and is owned by the user
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("author", user.id)
    .single();

  if (postError || !post) {
    return { ok: false, error: postError?.message || "Post not found" };
  }

  // Delete the post
  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  return { ok: true };
}
