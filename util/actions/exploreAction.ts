"use server";

import { createClient } from "../supabase/server";

export type ExploreTag = {
  name: string;
  photos: string[]; // absolute/public URLs
};

export type ExploreTagsResult = {
  ok: boolean;
  tags?: ExploreTag[];
  error?: string;
};

/**
 * Fetch top tags with sample photos aggregated from recent posts.
 * Tables assumed (based on existing code):
 * - posts(id, media_urls, created_at)
 * - tags(id, name)
 * - post_tags(post_id, tag_id)
 */
export async function fetchExploreTags(options?: {
  maxTags?: number; // how many tags to return
  recentPosts?: number; // how many recent posts to scan
  maxPhotosPerTag?: number; // cap returned photos per tag (used for UI tile)
}): Promise<ExploreTagsResult> {
  const maxTags = options?.maxTags ?? 9;
  const recentPosts = options?.recentPosts ?? 60;
  const maxPhotosPerTag = options?.maxPhotosPerTag ?? 8; // pass >4 to enable +X tile

  try {
    const supabase = await createClient();

    // 1) Grab recent posts with media
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

    // 2) Get tag links for these posts
    const { data: postTags, error: ptErr } = await supabase
      .from("post_tags")
      .select("post_id, tag_id")
      .in("post_id", postIds);
    if (ptErr) return { ok: false, error: ptErr.message };

    const tagIds = Array.from(
      new Set(
        (postTags || []).map((r: any) => String(r.tag_id)).filter(Boolean)
      )
    );
    if (tagIds.length === 0) return { ok: true, tags: [] };

    // 3) Resolve tag names
    const { data: tagsRows, error: tagsErr } = await supabase
      .from("tags")
      .select("id, name")
      .in("id", tagIds);
    if (tagsErr) return { ok: false, error: tagsErr.message };

    const tagIdToName = new Map<string, string>();
    for (const t of tagsRows || []) {
      tagIdToName.set(String((t as any).id), String((t as any).name));
    }

    // 4) Aggregate photos per tag name
    const tagToPhotos = new Map<string, string[]>();
    for (const link of postTags || []) {
      const postId = String((link as any).post_id);
      const tagId = String((link as any).tag_id);
      const tagName = tagIdToName.get(tagId);
      if (!tagName) continue;
      const urls = postMedia.get(postId) || [];
      if (urls.length === 0) continue;

      const arr = tagToPhotos.get(tagName) || [];
      // Deduplicate and cap length
      for (const u of urls) {
        if (!u) continue;
        if (arr.length >= maxPhotosPerTag) break;
        if (!arr.includes(u)) arr.push(u);
      }
      tagToPhotos.set(tagName, arr);
    }

    // 5) Rank tags by number of photos, then alphabetically
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

export async function fetchExploreModels() {
  const supabase = await createClient();

}

// Fetch posts by model category (gemini/chatgpt/grok/midjourney/other)
// - For specific models, we match model_name ILIKE pattern (case-insensitive):
//   * midjourney: "%midjourney%" to catch variants
//   * others: "{model}%"
// - For "other", we return posts whose model_name is set but does NOT start with known models
export type ModelCategory = "gemini" | "chatgpt" | "grok" | "midjourney" | "other";

export type ModelPost = {
  id: string;
  created_at: string | null;
  text: string | null;
  media_urls: string[];
  model_name: string | null;
  category: string | null;
  sub_category: string | null;
  author: string | null;
  author_profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchPostsByModelCategory(params: {
  model: ModelCategory;
  limit?: number;
  likeFilter?: string; // optional model_name contains filter, used by /models/[modelsName]?q=
}): Promise<{ ok: boolean; posts?: ModelPost[]; error?: string }> {
  try {
    const supabase = await createClient();
  const { model, limit = 50, likeFilter } = params;

    const KNOWN = ["chatgpt", "gemini", "grok", "midjourney"] as const;

    let q = supabase
      .from("posts")
      .select("id, created_at, text, media_urls, model_name, category, sub_category, author")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (model === "other") {
      // model_name present but not starting with any known model prefixes
      q = q
        .not("model_name", "is", null)
        .not("model_name", "eq", "")
        .not("model_name", "ilike", "chatgpt%")
        .not("model_name", "ilike", "gemini%")
        .not("model_name", "ilike", "grok%")
        .not("model_name", "ilike", "midjourney%");
      if (likeFilter && likeFilter.trim()) {
        const pattern = `%${likeFilter.trim()}%`;
        q = q.ilike("model_name", pattern);
      }
    } else if ((KNOWN as readonly string[]).includes(model)) {
      // Match variations using ILIKE
      const pattern = model === "midjourney" ? "%midjourney%" : `${model}%`;
      q = q.ilike("model_name", pattern);
    } else {
      return { ok: false, error: "Unknown model category" };
    }

    const { data: rows, error } = await q;
    if (error) return { ok: false, error: error.message };

    const posts = (rows || []).map((r) => ({
      id: String((r as any).id),
      created_at: (r as any).created_at ?? null,
      text: (r as any).text ?? null,
      media_urls: (Array.isArray((r as any).media_urls) ? (r as any).media_urls : []) as string[],
      model_name: (r as any).model_name ?? null,
      category: (r as any).category ?? null,
      sub_category: (r as any).sub_category ?? null,
      author: (r as any).author ?? null,
      author_profile: null,
    })) as ModelPost[];

    const authorIds = Array.from(
      new Set(posts.map((p) => p.author).filter(Boolean))
    ) as string[];

    if (authorIds.length > 0) {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", authorIds);
      if (pErr) {
        // Non-fatal; return posts without profile enrichment
        return { ok: true, posts };
      }
      const map = new Map<string, { id: string; username: string | null; full_name: string | null; avatar_url: string | null }>();
      for (const pr of profiles || []) {
        map.set(String((pr as any).id), {
          id: String((pr as any).id),
          username: (pr as any).username ?? null,
          full_name: (pr as any).full_name ?? null,
          avatar_url: (pr as any).avatar_url ?? null,
        });
      }
      for (const p of posts) {
        p.author_profile = p.author ? map.get(p.author) ?? null : null;
      }
    }

    return { ok: true, posts };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to fetch posts by model" };
  }
}

// Search tags by name and aggregate sample photos similarly to fetchExploreTags
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
    const supabase = await createClient();

    // 1) tags filtered by name
    const { data: tagRows, error: tErr } = await supabase
      .from("tags")
      .select("id, name")
      .ilike("name", `%${q}%`)
      .order("name", { ascending: true })
      .limit(maxTags);
    if (tErr) return { ok: false, error: tErr.message };
    const tagIds = (tagRows || []).map((t) => String((t as any).id));
    if (tagIds.length === 0) return { ok: true, tags: [] };

    // 2) recent post_tags for these tags
    const { data: postTags, error: ptErr } = await supabase
      .from("post_tags")
      .select("post_id, tag_id, created_at")
      .in("tag_id", tagIds)
      .order("created_at", { ascending: false })
      .limit(recentPosts);
    if (ptErr) return { ok: false, error: ptErr.message };

    const postIds = Array.from(new Set((postTags || []).map((r) => String((r as any).post_id))));
    if (postIds.length === 0) return { ok: true, tags: (tagRows || []).map((t) => ({ name: (t as any).name, photos: [] })) };

    // 3) posts media for those post ids
    const { data: posts, error: pErr } = await supabase
      .from("posts")
      .select("id, media_urls")
      .in("id", postIds);
    if (pErr) return { ok: false, error: pErr.message };
    const mediaByPost = new Map<string, string[]>();
    for (const row of posts || []) {
      const id = String((row as any).id);
      const urls = Array.isArray((row as any).media_urls) ? ((row as any).media_urls as string[]).filter(Boolean) : [];
      mediaByPost.set(id, urls);
    }

    const tagNameById = new Map<string, string>();
    for (const t of tagRows || []) tagNameById.set(String((t as any).id), String((t as any).name));

    // 4) Aggregate photos per tag
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
    const supabase = await createClient();
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
