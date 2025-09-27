import {
  PostFeed,
  type Post as FeedPost,
  type PostMedia,
} from "@/components/post-feed";
import ModelCard from "@/components/explore/models-card";
import {
  fetchPostsByModelCategory,
  fetchDistinctOtherModels,
  type ModelCategory,
} from "@/util/actions/exploreAction";
import { createClient } from "@/util/supabase/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";

export default async function ExploreModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ modelsName: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { modelsName } = await params;
  const { q } = (await searchParams) ?? {};

  const normalized = String(modelsName || "").toLowerCase();
  const allowed: ModelCategory[] = [
    "chatgpt",
    "gemini",
    "grok",
    "midjourney",
    "other",
  ];
  if (!allowed.includes(normalized as ModelCategory)) notFound();

  const trimmedFilter = normalizeString(q);

  if (normalized === "other" && !trimmedFilter) {
    const otherModels = await fetchDistinctOtherModels({ limit: 180 });
    if (!otherModels.ok)
      throw new Error(otherModels.error || "Failed to load models");

    type OtherEntry = {
      label: string;
      provider?: string;
      key: string;
    };
    const entries: OtherEntry[] = [];
    (otherModels.models || []).forEach((model, idx) => {
      const label = normalizeString(model.label) || normalizeString(model.name);
      if (!label) return;
      const provider = normalizeString(model.provider);
      const uniqueKey =
        normalizeString(model.key)?.toLowerCase() ||
        `${label.toLowerCase()}-${provider ?? idx}`;
      const base: OtherEntry = {
        label,
        key: uniqueKey,
      };
      if (provider) base.provider = provider;
      entries.push(base);
    });

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Other AI models</h1>
            <BackButton className="text-sm text-muted-foreground" />
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          {entries.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <ModelCard
                  key={entry.key}
                  model="other"
                  modelName={entry.label}
                  icon={
                    entry.provider ? (
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        {entry.provider}
                      </span>
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No additional models discovered yet. Check back soon!
            </div>
          )}
        </div>
      </div>
    );
  }

  const res = await fetchPostsByModelCategory({
    model: normalized as ModelCategory,
    limit: 60,
    likeFilter: trimmedFilter,
  });
  if (!res.ok) throw new Error(res.error || "Failed to load posts");

  const supabase = await createClient();
  const { data: viewer } = await supabase.auth.getUser();
  const viewerId = viewer?.user?.id ?? undefined;

  const videoExts = new Set(["mp4", "webm", "mov", "mkv", "m4v", "avi"]);
  const toMediaItems = (urls?: string[] | null): PostMedia[] => {
    if (!urls?.length) return [];
    return urls.map((url) => {
      const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
      const isVideo = !!ext && videoExts.has(ext);
      return { type: isVideo ? "video" : "image", url } as PostMedia;
    });
  };

  const posts: FeedPost[] = (res.posts || []).map((row) => {
    const name =
      row.author_profile?.full_name ||
      row.author_profile?.username ||
      "Unknown";
    return {
      id: row.id,
      user: {
        id: row.author || "",
        name,
        username: row.author_profile?.username ?? undefined,
        avatarUrl: row.author_profile?.avatar_url ?? undefined,
        verified: false,
      },
      createdAt: row.created_at || new Date().toISOString(),
      text: row.text ?? undefined,
      attachments: toMediaItems(row.media_urls),
      meta: {
        model: normalizeString(row.model_name),
        modelLabel: normalizeString(row.model_label),
        modelKey: normalizeString(row.model_key),
        modelKind: normalizeString(row.model_kind),
        modelProvider: normalizeString(row.model_provider),
        modelProviderSlug: normalizeString(row.model_provider_slug),
        category: normalizeString(row.category),
        categorySlug: normalizeString(row.category_slug),
        subCategory: normalizeString(row.sub_category),
        subCategorySlug: normalizeString(row.sub_category_slug),
      },
      stats: { likes: 0, comments: 0, shares: 0 },
      liked: false,
      saved: false,
    } satisfies FeedPost;
  });

  const title =
    normalized === "other"
      ? trimmedFilter
        ? `Other models • ${trimmedFilter}`
        : "Other models"
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{title}</h1>
          <BackButton className="text-sm text-muted-foreground" />
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {posts.length > 0 ? (
          <PostFeed posts={posts} currentUserId={viewerId} />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No posts found.
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}