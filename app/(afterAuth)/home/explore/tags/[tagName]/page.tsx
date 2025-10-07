import { createClient } from "@/util/supabase/server";
import { PostFeed, type Post } from "@/components/post-feed";
import { BackButton } from "@/components/back-button";
import type { Metadata } from "next";

type DbPost = {
  id: string;
  text?: string | null;
  created_at: string;
  author: string;
  media_urls?: string[] | null;
};

type TagPageProps = {
  params: Promise<{ tagName: string }>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tagName } = await params;
  const decodedTag = decodeURIComponent(tagName);

  const title = `#${decodedTag} - AI Prompts`;
  const description = `Explore AI prompts tagged with #${decodedTag}. Discover curated prompts for ChatGPT, Gemini, MidJourney, and more on AI Cookbook.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aicookbook.vercel.app";
  const ogImageUrl = `/api/og?type=tag&title=${encodeURIComponent(`#${decodedTag}`)}&description=${encodeURIComponent("Explore AI Prompts")}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/home/explore/tags/${tagName}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `#${decodedTag} AI Prompts`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagName } = await params;
  const decodedTag = decodeURIComponent(tagName);
  const supabase = await createClient();

  let posts: Post[] = [];
  let error: string | null = null;

  try {
    // Find tag id by name
    const { data: tagRow, error: tagErr } = await supabase
      .from("tags")
      .select("id")
      .eq("name", decodedTag)
      .maybeSingle();

    if (tagErr) throw tagErr;

    if (tagRow?.id) {
      // Find posts linked to this tag
      const { data: links, error: linkErr } = await supabase
        .from("post_tags")
        .select("post_id")
        .eq("tag_id", tagRow.id);

      if (linkErr) throw linkErr;

      const postIds = Array.from(
        new Set((links || []).map((l: any) => l.post_id))
      ).filter(Boolean);

      if (postIds.length > 0) {
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

        posts = (postRows || []).map((row: DbPost) => {
          const prof = profileMap.get(row.author);
          const name = prof?.full_name || prof?.username || "User";
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
            tags: [decodedTag],
            stats: { likes: 0, comments: 0, shares: 0 },
          } satisfies Post;
        });
      }
    }
  } catch (e: any) {
    error = e?.message || "Failed to load posts";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">#{decodedTag}</h1>
          <BackButton className="text-sm text-muted-foreground">
            Back
          </BackButton>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        <PostFeed posts={posts} loading={false} />
        {posts.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            No posts found for #{decodedTag}.
          </p>
        )}
      </main>
    </div>
  );
}
