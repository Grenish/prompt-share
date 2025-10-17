"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { enqueueNotification } from "./notificationsActions";
import { toStoragePath } from "@/util/storage/helpers";
import { NOT_AUTHENTICATED_ERROR } from "@/util/auth/client-auth";

type ActionBaseResult = {
  ok: boolean;
  error?: string;
};

export type TogglePostLikeResult = ActionBaseResult & {
  liked?: boolean;
  likes?: number;
};

export type TogglePostSaveResult = ActionBaseResult & {
  saved?: boolean;
};

export type PostCommentPayload = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  };
};

export type CreatePostCommentResult = ActionBaseResult & {
  comment?: PostCommentPayload;
  commentsCount?: number;
};

export type GetPostCommentsResult = ActionBaseResult & {
  comments?: PostCommentPayload[];
};

export type PostEngagementSummary = {
  postId: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
};

export type GetPostEngagementResult = ActionBaseResult & {
  items?: PostEngagementSummary[];
};

export type PostActionInput = {
  text: string;
  files?: File[];
  category: string;
  subCategory: string;
  modelName: string;
  tags?: string[];
  categorySlug?: string;
  subCategorySlug?: string;
  modelProviderLabel?: string;
  modelProviderSlug?: string;
  modelKey?: string;
  modelLabel?: string;
  modelKind?: string;
};

export type PostActionResult = {
  ok: boolean;
  post?: any;
  error?: string;
};

const toSlug = (raw: string) =>
  raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
    const rawModelName = (input.modelName || "").trim();
    const tags = (input.tags || []).map((t) => t.trim()).filter(Boolean);
    const modelProviderLabel = (input.modelProviderLabel || "").trim();
    const modelProviderSlugInput = (input.modelProviderSlug || "").trim();
    const modelProviderSlug = modelProviderSlugInput
      ? toSlug(modelProviderSlugInput)
      : modelProviderLabel
      ? toSlug(modelProviderLabel)
      : "";
    const modelLabelInput = (input.modelLabel || "").trim();
    const modelLabel = modelLabelInput || rawModelName;
    const modelKeyInput = (input.modelKey || "").trim();
    const modelKey = modelKeyInput
      ? modelKeyInput
      : modelLabel
      ? toSlug(modelLabel)
      : "";
    const modelKind = (input.modelKind || "").trim();
    const categorySlugInput = (input.categorySlug || "").trim();
    const categorySlug = categorySlugInput
      ? toSlug(categorySlugInput)
      : category
      ? toSlug(category)
      : "";
    const subCategorySlugInput = (input.subCategorySlug || "").trim();
    const subCategorySlug = subCategorySlugInput
      ? toSlug(subCategorySlugInput)
      : subCategory
      ? toSlug(subCategory)
      : "";
    const modelName = rawModelName
      ? rawModelName
      : [modelProviderLabel, modelLabel].filter(Boolean).join(" > ").trim();

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
      model_label: toNullable(modelLabel),
      model_key: toNullable(modelKey),
      model_kind: toNullable(modelKind),
      model_provider: toNullable(modelProviderLabel),
      model_provider_slug: toNullable(modelProviderSlug),
      media_urls: mediaUrls,
      author: user.id, // RLS/DB default could also be auth.uid(), but we set explicitly
      category_slug: toNullable(categorySlug),
      sub_category_slug: toNullable(subCategorySlug),
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
  if (userError || !user) return { ok: false, error: "Not authenticated" };

  const bucket = "postsBucket";

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("media_urls")
    .eq("id", postId)
    .eq("author", user.id)
    .single();

  if (postError || !post)
    return { ok: false, error: postError?.message || "Post not found" };

  // toStoragePath imported from shared util/storage/helpers

  const mediaUrls: string[] = Array.isArray((post as any).media_urls)
    ? (post as any).media_urls
    : [];
  const objectNames = Array.from(
    new Set(
      mediaUrls
        .filter((u): u is string => typeof u === "string" && u.length > 0)
        .map((u) => toStoragePath(u, bucket))
        .filter((p): p is string => Boolean(p))
    )
  );

  if (objectNames.length > 0) {
    const chunkSize = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < objectNames.length; i += chunkSize) {
      chunks.push(objectNames.slice(i, i + chunkSize));
    }
    const results = await Promise.all(
      chunks.map((c) => supabase.storage.from(bucket).remove(c))
    );
    const removeError = results.find((r) => r.error)?.error;
    if (removeError)
      return {
        ok: false,
        error: `Failed to delete post media: ${removeError.message}`,
      };
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author", user.id);
  if (deleteError) return { ok: false, error: deleteError.message };

  revalidatePath("/", "layout");
  revalidatePath("/home/profile");

  return { ok: true };
}

function resolveProfileDisplay(
  profile:
    | {
        full_name?: string | null;
        username?: string | null;
        avatar_url?: string | null;
      }
    | null
    | undefined,
  fallback?: string | null
) {
  const name = profile?.full_name?.trim();
  const handle = profile?.username?.trim();
  const display = name || handle || fallback || "User";
  return {
    name: display,
    username: handle || undefined,
    avatarUrl: profile?.avatar_url || undefined,
  };
}

export async function togglePostLike(
  postId: string,
  like: boolean
): Promise<TogglePostLikeResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Return specific error code that client can detect and redirect to login
    return { ok: false, error: NOT_AUTHENTICATED_ERROR };
  }

  if (!postId) {
    return { ok: false, error: "Invalid post id" };
  }

  if (like) {
    const { error: likeError } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: user.id });

    if (likeError) {
      if (likeError.code !== "23505") {
        return { ok: false, error: likeError.message };
      }
    } else {
      const { data: postOwner, error: postOwnerError } = await supabase
        .from("posts")
        .select("author")
        .eq("id", postId)
        .maybeSingle();

      if (postOwnerError) {
        console.error(
          "Failed to resolve post owner for like notification",
          postOwnerError
        );
      }

      const postAuthorId = (postOwner as any)?.author as string | undefined;
      if (postAuthorId && postAuthorId !== user.id) {
        const { ok: notifyOk, error: notifyError } = await enqueueNotification({
          userId: postAuthorId,
          actorId: user.id,
          type: "like",
          payload: {
            targetType: "post",
            targetId: postId,
            targetUrl: `/home/posts/${postId}`,
          },
        });

        if (!notifyOk && notifyError) {
          console.error("Failed to send like notification", notifyError);
        }
      }
    }
  } else {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const { count } = await supabase
    .from("post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  return { ok: true, liked: like, likes: count ?? 0 };
}

export async function togglePostSave(
  postId: string,
  save: boolean
): Promise<TogglePostSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Return specific error code that client can detect and redirect to login
    return { ok: false, error: NOT_AUTHENTICATED_ERROR };
  }

  if (!postId) {
    return { ok: false, error: "Invalid post id" };
  }

  if (save) {
    const { error } = await supabase
      .from("post_saves")
      .insert({ post_id: postId, user_id: user.id });
    if (error && error.code !== "23505") {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: true, saved: save };
}

export async function createPostComment(
  postId: string,
  text: string
): Promise<CreatePostCommentResult> {
  const body = (text || "").trim();
  if (!postId) {
    return { ok: false, error: "Invalid post id" };
  }
  if (!body) {
    return { ok: false, error: "Comment cannot be empty" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Return specific error code that client can detect and redirect to login
    return { ok: false, error: NOT_AUTHENTICATED_ERROR };
  }

  const { data: inserted, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: user.id, content: body })
    .select("id, created_at, content")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message || "Failed to add comment" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const identity = resolveProfileDisplay(profile, user.email);

  const { data: postOwner, error: postOwnerError } = await supabase
    .from("posts")
    .select("author")
    .eq("id", postId)
    .maybeSingle();

  if (postOwnerError) {
    console.error(
      "Failed to resolve post owner for comment notification",
      postOwnerError
    );
  }

  const postAuthorId = (postOwner as any)?.author as string | undefined;
  if (postAuthorId && postAuthorId !== user.id) {
    const snippet = body.slice(0, 140);
    const { ok: notifyOk, error: notifyError } = await enqueueNotification({
      userId: postAuthorId,
      actorId: user.id,
      type: "mention",
      payload: {
        targetType: "comment",
        targetId: String(inserted.id),
        targetUrl: `/home/posts/${postId}`,
        snippet,
      },
    });

    if (!notifyOk && notifyError) {
      console.error("Failed to send comment notification", notifyError);
    }
  }

  const { count: commentsCount } = await supabase
    .from("post_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  return {
    ok: true,
    comment: {
      id: String(inserted.id),
      text: inserted.content ?? body,
      createdAt: inserted.created_at ?? new Date().toISOString(),
      user: {
        id: String(user.id),
        ...identity,
      },
    },
    commentsCount: commentsCount ?? 0,
  };
}

export async function getPostComments(
  postId: string
): Promise<GetPostCommentsResult> {
  if (!postId) {
    return { ok: false, error: "Invalid post id" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, content, created_at, user_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { ok: false, error: error?.message || "Failed to load comments" };
  }

  const userIds = Array.from(
    new Set(
      data
        .map((row) => row.user_id)
        .filter((id): id is string => typeof id === "string")
    )
  );

  const profilesMap = new Map<
    string,
    ReturnType<typeof resolveProfileDisplay>
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", userIds);

    for (const profile of profiles || []) {
      profilesMap.set(
        String(profile.id),
        resolveProfileDisplay(profile, undefined)
      );
    }
  }

  return {
    ok: true,
    comments: data.map((row) => {
      const identity = profilesMap.get(String(row.user_id)) || {
        name: "User",
        username: undefined,
        avatarUrl: undefined,
      };
      return {
        id: String(row.id),
        text: row.content ?? "",
        createdAt: row.created_at ?? new Date().toISOString(),
        user: {
          id: String(row.user_id || ""),
          ...identity,
        },
      } satisfies PostCommentPayload;
    }),
  };
}

export async function getPostEngagement(
  postIds: string[]
): Promise<GetPostEngagementResult> {
  const uniqueIds = Array.from(new Set(postIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { ok: true, items: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const { data: likeRows, error: likesError } = await supabase
    .from("post_likes")
    .select("post_id, user_id")
    .in("post_id", uniqueIds);

  if (likesError) {
    return { ok: false, error: likesError.message };
  }

  const { data: commentRows, error: commentsError } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", uniqueIds);

  if (commentsError) {
    return { ok: false, error: commentsError.message };
  }

  let saveRows: { post_id: string }[] = [];
  if (viewerId) {
    const { data: savesData, error: savesError } = await supabase
      .from("post_saves")
      .select("post_id")
      .eq("user_id", viewerId)
      .in("post_id", uniqueIds);

    if (savesError) {
      return { ok: false, error: savesError.message };
    }

    saveRows = (savesData || []).map((row) => ({ post_id: row.post_id }));
  }

  const map = new Map<string, PostEngagementSummary>();
  for (const id of uniqueIds) {
    map.set(id, {
      postId: id,
      likes: 0,
      comments: 0,
      liked: false,
      saved: false,
    });
  }

  for (const row of likeRows || []) {
    const key = String(row.post_id);
    const entry = map.get(key);
    if (!entry) continue;
    entry.likes += 1;
    if (viewerId && row.user_id === viewerId) {
      entry.liked = true;
    }
  }

  for (const row of commentRows || []) {
    const key = String(row.post_id);
    const entry = map.get(key);
    if (!entry) continue;
    entry.comments += 1;
  }

  if (viewerId) {
    for (const row of saveRows || []) {
      const key = String(row.post_id);
      const entry = map.get(key);
      if (entry) entry.saved = true;
    }
  }

  return { ok: true, items: Array.from(map.values()) };
}
