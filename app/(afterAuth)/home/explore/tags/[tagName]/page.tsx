"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostFeed, type Post } from "@/components/post-feed";
import { createClient } from "@/util/supabase/client";

type DbPost = {
  id: string;
  text?: string | null;
  created_at: string;
  author: string;
  media_urls?: string[] | null;
};

export default function TagPage() {
  const params = useParams<{ tagName: string }>();
  const router = useRouter();
  const tagName = useMemo(
    () => decodeURIComponent(String(params?.tagName || "")),
    [params]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!tagName) return;
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        // Find tag id by name
        const { data: tagRow, error: tagErr } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .maybeSingle();
        if (tagErr) throw tagErr;
        if (!tagRow?.id) {
          if (alive) setPosts([]);
          return;
        }

        // Find posts linked to this tag
        const { data: links, error: linkErr } = await supabase
          .from("post_tags")
          .select("post_id")
          .eq("tag_id", tagRow.id);
        if (linkErr) throw linkErr;
        const postIds = Array.from(
          new Set((links || []).map((l: any) => l.post_id))
        ).filter(Boolean);
        if (postIds.length === 0) {
          if (alive) setPosts([]);
          return;
        }

        // Fetch posts details
        const { data: postRows, error: postsErr } = await supabase
          .from("posts")
          .select("id, text, created_at, author, media_urls")
          .in("id", postIds)
          .order("created_at", { ascending: false });
        if (postsErr) throw postsErr;

        // Fetch authors for these posts
        const authorIds = Array.from(
          new Set((postRows || []).map((p: any) => p.author))
        ).filter(Boolean);
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", authorIds);
        if (profErr) throw profErr;
        const profileMap = new Map<string, any>();
        (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

        const mapped: Post[] = (postRows || []).map((row: DbPost) => {
          const prof = profileMap.get(row.author);
          const name = prof?.display_name || prof?.username || "User";
          const attachments = (row.media_urls || []).map((u) => ({
            id: u,
            type: "image" as const,
            url: u,
          }));
          return {
            id: row.id,
            user: {
              id: row.author,
              name,
              username: prof?.username || undefined,
              avatarUrl: prof?.avatar_url || undefined,
            },
            createdAt: row.created_at,
            text: row.text || undefined,
            attachments,
            tags: [tagName],
            stats: { likes: 0, comments: 0, shares: 0 },
          } satisfies Post;
        });

        if (alive) setPosts(mapped);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load posts");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [tagName]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">#{tagName}</h1>
          <button
            className="text-sm text-muted-foreground"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        <PostFeed posts={posts} loading={loading} />
        {!loading && posts.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            No posts found for #{tagName}.
          </p>
        )}
      </main>
    </div>
  );
}
