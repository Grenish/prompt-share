import { createClient } from "../supabase/client";

export type ExploreTag = {
  name: string;
  photos: string[]; // absolute/public URLs
};

export type ExploreTagsResult = {
  ok: boolean;
  tags?: ExploreTag[];
  error?: string;
};

// Browser-safe versions of explore helpers for Client Components
export async function fetchExploreTags(options?: {
  maxTags?: number;
  recentPosts?: number;
  maxPhotosPerTag?: number;
}): Promise<ExploreTagsResult> {
  const maxTags = options?.maxTags ?? 9;
  const recentPosts = options?.recentPosts ?? 60;
  const maxPhotosPerTag = options?.maxPhotosPerTag ?? 8;

  try {
    const supabase = createClient();

    const { data: posts, error: postsErr } = await supabase
      .from("posts")
      .select("id, media_urls")
      .order("created_at", { ascending: false })
      .limit(recentPosts);
    if (postsErr) return { ok: false, error: postsErr.message };

    const postMedia = new Map<string, string[]>();
    const postIds: string[] = [];
    for (const row of posts || []) {
      const id = String((row as any).id);
      const urls = Array.isArray((row as any).media_urls)
        ? ((row as any).media_urls as string[]).filter(Boolean)
        : [];
      if (id && urls.length > 0) {
        postMedia.set(id, urls);
        postIds.push(id);
      }
    }

    if (postIds.length === 0) return { ok: true, tags: [] };

    const { data: postTags, error: ptErr } = await supabase
      .from("post_tags")
      .select("post_id, tag_id")
      .in("post_id", postIds);
    if (ptErr) return { ok: false, error: ptErr.message };

    const tagIds = Array.from(
      new Set((postTags || []).map((r: any) => String(r.tag_id)).filter(Boolean))
    );
    if (tagIds.length === 0) return { ok: true, tags: [] };

    const { data: tagsRows, error: tagsErr } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);
    if (tagsErr) return { ok: false, error: tagsErr.message };

    const tagIdToName = new Map<string, string>();
    for (const t of tagsRows || []) {
      tagIdToName.set(String((t as any).id), String((t as any).name));
    }

    const tagToPhotos = new Map<string, string[]>();
    for (const link of postTags || []) {
      const postId = String((link as any).post_id);
      const tagId = String((link as any).tag_id);
      const tagName = tagIdToName.get(tagId);
      if (!tagName) continue;
      const urls = postMedia.get(postId) || [];
      if (urls.length === 0) continue;

      const arr = tagToPhotos.get(tagName) || [];
      for (const u of urls) {
        if (!u) continue;
        if (arr.length >= maxPhotosPerTag) break;
        if (!arr.includes(u)) arr.push(u);
      }
      tagToPhotos.set(tagName, arr);
    }

    const ranked = Array.from(tagToPhotos.entries())
      .filter(([, photos]) => photos.length > 0)
      .sort((a, b) => {
        const diff = b[1].length - a[1].length;
        if (diff !== 0) return diff;
        return a[0].localeCompare(b[0]);
      })
      .slice(0, maxTags)
      .map(([name, photos]) => ({ name, photos } satisfies ExploreTag));

    return { ok: true, tags: ranked };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to fetch tags" };
  }
}

export async function searchExploreTagsByName(options: {
  query: string;
  maxTags?: number;
  recentPosts?: number;
  maxPhotosPerTag?: number;
}): Promise<ExploreTagsResult> {
  const q = options.query?.trim();
  const maxTags = options?.maxTags ?? 12;
  const recentPosts = options?.recentPosts ?? 80;
  const maxPhotosPerTag = options?.maxPhotosPerTag ?? 6;

  if (!q) return { ok: true, tags: [] };
  try {
    const supabase = createClient();

    const { data: tagRows, error: tErr } = await supabase
      .from("tags")
      .select("id, name")
      .ilike("name", `%${q}%`)
      .order("name", { ascending: true })
      .limit(maxTags);
    if (tErr) return { ok: false, error: tErr.message };
    const tagIds = (tagRows || []).map((t) => String((t as any).id));
    if (tagIds.length === 0) return { ok: true, tags: [] };

    const { data: postTags, error: ptErr } = await supabase
      .from("post_tags")
      .select("post_id, tag_id, created_at")
      .in("tag_id", tagIds)
      .order("created_at", { ascending: false })
      .limit(recentPosts);
    if (ptErr) return { ok: false, error: ptErr.message };

    const postIds = Array.from(new Set((postTags || []).map((r) => String((r as any).post_id))));
    if (postIds.length === 0)
      return { ok: true, tags: (tagRows || []).map((t) => ({ name: (t as any).name, photos: [] })) };

    const { data: posts, error: pErr } = await supabase
      .from("posts")
      .select("id, media_urls")
      .in("id", postIds);
    if (pErr) return { ok: false, error: pErr.message };
    const mediaByPost = new Map<string, string[]>();
    for (const row of posts || []) {
      const id = String((row as any).id);
      const urls = Array.isArray((row as any).media_urls)
        ? ((row as any).media_urls as string[]).filter(Boolean)
        : [];
      mediaByPost.set(id, urls);
    }

    const tagNameById = new Map<string, string>();
    for (const t of tagRows || []) tagNameById.set(String((t as any).id), String((t as any).name));

    const photosByTag = new Map<string, string[]>();
    for (const r of postTags || []) {
      const tagId = String((r as any).tag_id);
      const postId = String((r as any).post_id);
      const tagName = tagNameById.get(tagId);
      if (!tagName) continue;
      const urls = mediaByPost.get(postId) || [];
      if (!urls.length) continue;
      const arr = photosByTag.get(tagName) || [];
      for (const u of urls) {
        if (!u) continue;
        if (arr.length >= maxPhotosPerTag) break;
        if (!arr.includes(u)) arr.push(u);
      }
      photosByTag.set(tagName, arr);
    }

    const results: ExploreTag[] = (tagRows || []).map((t) => {
      const name = String((t as any).name);
      return { name, photos: photosByTag.get(name) || [] };
    });

    return { ok: true, tags: results };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to search tags" };
  }
}

export async function searchDistinctOtherModels(options: {
  query: string;
  limit?: number;
}): Promise<{ ok: boolean; models?: string[]; error?: string }> {
  const q = options.query?.trim();
  const limit = options?.limit ?? 15;
  if (!q) return { ok: true, models: [] };
  try {
    const supabase = createClient();
    let query = supabase
      .from("posts")
      .select("model_name")
      .not("model_name", "is", null)
      .not("model_name", "eq", "")
      .ilike("model_name", `%${q}%`)
      .not("model_name", "ilike", "chatgpt%")
      .not("model_name", "ilike", "gemini%")
      .not("model_name", "ilike", "grok%")
      .not("model_name", "ilike", "midjourney%");

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    const models = Array.from(
      new Set((data || []).map((r) => String((r as any).model_name)).filter(Boolean))
    )
      .slice(0, limit)
      .sort((a, b) => a.localeCompare(b));
    return { ok: true, models };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to search models" };
  }
}
