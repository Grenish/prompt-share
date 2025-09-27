import { createClient } from "@/util/supabase/server";
import { BackButton } from "@/components/back-button";
import { MobilePostView } from "@/components/post/mobile-post-view";
import type {
  MobilePost,
  MobilePostComment,
} from "@/components/post/mobile-post-view";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

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

  const { count: likesCount } = await supabase
    .from("post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  let liked = false;
  if (viewerId) {
    const { data: likedRow } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .maybeSingle();
    liked = Boolean(likedRow);
  }

  let saved = false;
  if (viewerId) {
    const { data: savedRow } = await supabase
      .from("post_saves")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", viewerId)
      .maybeSingle();
    saved = Boolean(savedRow);
  }

  const { data: commentRows } = await supabase
    .from("post_comments")
    .select("id, content, created_at, user_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  const commentUserIds = Array.from(
    new Set(
      (commentRows || [])
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const commentProfiles = new Map<string, ProfileRow>();
  if (commentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", commentUserIds);

    for (const profile of profiles || []) {
      commentProfiles.set(String(profile.id), profile as ProfileRow);
    }
  }

  const comments: MobilePostComment[] = (commentRows || []).map((row) => {
    const profile = row.user_id
      ? commentProfiles.get(String(row.user_id))
      : null;
    const displayName =
      profile?.full_name ||
      profile?.username ||
      (row.user_id && row.user_id === viewerId
        ? user?.user_metadata?.full_name || user?.user_metadata?.name || "You"
        : "User");

    return {
      id: String(row.id),
      text: row.content ?? "",
      createdAt: row.created_at ?? new Date().toISOString(),
      author: {
        id: String(row.user_id ?? ""),
        name: displayName,
        username: profile?.username ?? undefined,
        avatarUrl: profile?.avatar_url ?? undefined,
      },
    };
  });

  const commentCount = comments.length;

  const post: MobilePost = {
    id: String(postRow.id),
    createdAt: postRow.created_at,
    text: postRow.text ?? "",
    media,
    modelName: postRow.model_name ?? undefined,
    category: postRow.category ?? undefined,
    subCategory: postRow.sub_category ?? undefined,
    likesCount: likesCount ?? 0,
    commentCount,
    liked,
    saved,
    comments,
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
