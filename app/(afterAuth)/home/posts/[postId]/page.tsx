import { createClient } from "@/util/supabase/server";
import BackButton from "@/components/back-button";
import { MobilePostView } from "@/components/post/mobile-post-view";
import type { MobilePost } from "@/components/post/mobile-post-view";

type PageProps = {
  params: Promise<{ postId: string }>;
};

type PostRow = {
  id: string;
  created_at: string | null;
  text: string | null;
  media_urls: string[] | null;
  model_name: string | null;
  category: string | null;
  sub_category: string | null;
  author: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export default async function PostPage({ params }: PageProps) {
  const { postId } = await params;
  const supabase = await createClient();

  const { data: postRow, error: postErr } = await supabase
    .from("posts")
    .select(
      "id, created_at, text, media_urls, model_name, category, sub_category, author"
    )
    .eq("id", postId)
    .single<PostRow>();

  if (postErr || !postRow) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <BackButton className="px-3 py-2 rounded-md border">Back</BackButton>
          <h1 className="text-lg font-semibold">Post</h1>
        </div>
        <div className="mt-8 text-sm text-muted-foreground">
          Post not found.
        </div>
      </div>
    );
  }

  let author: ProfileRow | null = null;
  if (postRow.author) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", postRow.author)
      .maybeSingle<ProfileRow>();
    author = profile ?? null;
  }

  const media: string[] = Array.isArray(postRow.media_urls)
    ? postRow.media_urls.filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      )
    : [];

  const post: MobilePost = {
    id: String(postRow.id),
    createdAt: postRow.created_at,
    text: postRow.text ?? "",
    media,
    modelName: postRow.model_name ?? undefined,
    category: postRow.category ?? undefined,
    subCategory: postRow.sub_category ?? undefined,
    author: author
      ? {
          id: String(author.id),
          name: author.full_name || author.username || "User",
          username: author.username || undefined,
          avatarUrl: author.avatar_url || undefined,
        }
      : undefined,
  };

  return (
    <div className="w-full">
      <MobilePostView post={post} />
    </div>
  );
}
