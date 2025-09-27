"use client";

import { useEffect, useMemo, useState } from "react";
import UserCard from "@/components/explore/user-card";
import { Input } from "@/components/ui/input";
import { Banana, Hash, Loader2, Search, X } from "lucide-react";
import { createClient } from "@/util/supabase/client";
import HashTags from "@/components/explore/hashtags";
import ModelCard from "@/components/explore/models-card";
import { UserCardSkeleton } from "@/components/explore/skeleton/user-card-skeleton";
import {
  fetchExploreTags,
  type ExploreTag,
  searchExploreTagsByName,
  searchDistinctOtherModels,
} from "@/util/actions/exploreClient";
import HashTagsSkeleton from "@/components/explore/skeleton/hashtags-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  background_image: string | null;
  created_at?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
};

type UserResult = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | undefined;
  bio: string | undefined;
  bannerUrl: string | undefined;
  followers: number;
  following: number;
  numPosts: number;
};

export default function DashboardExplorePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UserResult[]>([]);
  const [tags, setTags] = useState<ExploreTag[] | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState<boolean>(false);
  const [tagSearch, setTagSearch] = useState<ExploreTag[]>([]);
  const [modelSearch, setModelSearch] = useState<string[]>([]);
  const [modelSearchError, setModelSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 350);
  const isSearching = useMemo(
    () => debouncedQuery.trim().length > 0,
    [debouncedQuery]
  );

  // Predefined model categories for search matching
  const PREDEFINED_MODELS = [
    { key: "chatgpt" as const, label: "ChatGPT" },
    { key: "gemini" as const, label: "Gemini" },
    { key: "grok" as const, label: "Grok" },
    { key: "midjourney" as const, label: "Midjourney" },
  ];

  const matchedModelCategories = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q)
      return [] as {
        key: "chatgpt" | "gemini" | "grok" | "midjourney";
        label: string;
      }[];
    return PREDEFINED_MODELS.filter(
      (m) => m.key.includes(q) || m.label.toLowerCase().includes(q)
    );
  }, [debouncedQuery]);

  // Derived counts for tabs
  const userCount = results.length;
  const tagCount = tagSearch.length;
  const modelCount = matchedModelCategories.length + modelSearch.length;

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const selfId = userData?.user?.id || null;
        const like = `%${debouncedQuery.trim()}%`;
        let q = supabase.from("profiles").select("*");

        if (debouncedQuery.trim()) {
          q = q.or(`username.ilike.${like},bio.ilike.${like}`);
        }

        const { data: rows, error: qErr } = await q
          .order("created_at", { ascending: false })
          .limit(12);
        if (qErr) throw qErr;

        let profiles: ProfileRow[] = rows || [];
        if (selfId) profiles = profiles.filter((p) => p.id !== selfId);

        const enriched = await Promise.all(
          profiles.map(async (p) => {
            const [followersRes, followingRes, postsRes] = await Promise.all([
              createCountQuery("follows", "following_id", p.id),
              createCountQuery("follows", "follower_id", p.id),
              createCountQuery("posts", "author", p.id),
            ]);

            const displayName =
              (p as any)?.full_name ??
              (p as any)?.display_name ??
              p.username ??
              "unknown";

            return {
              id: p.id,
              username: p.username ?? "unknown",
              displayName,
              bio: p.bio ?? undefined,
              bannerUrl: p.background_image ?? undefined,
              avatarUrl: p.avatar_url ?? undefined,
              followers: followersRes ?? 0,
              following: followingRes ?? 0,
              numPosts: postsRes ?? 0,
            } satisfies UserResult;
          })
        );

        if (!active) return;
        setResults(enriched);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Failed to search");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  // Multi-search: tags and models when query present
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setTagsError(null);
      setModelSearchError(null);
      try {
        if (!debouncedQuery.trim()) {
          if (alive) {
            setTagSearch([]);
            setModelSearch([]);
          }
          return;
        }
        const [tagsRes, modelsRes] = await Promise.all([
          searchExploreTagsByName({
            query: debouncedQuery,
            maxTags: 9,
            recentPosts: 60,
            maxPhotosPerTag: 4,
          }),
          searchDistinctOtherModels({ query: debouncedQuery, limit: 10 }),
        ]);
        if (!alive) return;
        if (tagsRes.ok) setTagSearch(tagsRes.tags || []);
        else setTagsError(tagsRes.error || "Failed to search tags");

        if (modelsRes.ok) setModelSearch(modelsRes.models || []);
        else setModelSearchError(modelsRes.error || "Failed to search models");
      } catch (e: any) {
        if (!alive) return;
        setTagsError(e?.message || "Failed to search tags");
        setModelSearchError(e?.message || "Failed to search models");
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  // Load tags when not searching (initially and whenever page mounts)
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setTagsLoading(true);
      setTagsError(null);
      try {
        const res = await fetchExploreTags({
          maxTags: 9,
          recentPosts: 60,
          maxPhotosPerTag: 8,
        });
        if (!alive) return;
        if (!res.ok) {
          setTagsError(res.error || "Failed to load tags");
          setTags([]);
        } else {
          setTags(res.tags || []);
        }
      } catch (e: any) {
        if (!alive) return;
        setTagsError(e?.message || "Failed to load tags");
        setTags([]);
      } finally {
        if (alive) setTagsLoading(false);
      }
    };
    if (!isSearching) run();
    return () => {
      alive = false;
    };
  }, [isSearching]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top search */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center">
          <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full pl-10 pr-16 bg-transparent border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="Search people, tags, models..."
              aria-label="Search"
            />
            {/* Right-side actions: loading + clear */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && loading ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              {query ? (
                <button
                  aria-label="Clear search"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          <main className="lg:col-span-8 space-y-8">
            {isSearching ? (
              <section>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Search results</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {debouncedQuery
                        ? `Showing matches for “${debouncedQuery}”`
                        : "Type to search"}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs">
                    <SummaryPill label="Users" count={userCount} />
                    <SummaryPill label="Tags" count={tagCount} />
                    <SummaryPill label="Models" count={modelCount} />
                  </div>
                </div>

                {error ? (
                  <p className="mt-3 text-sm text-destructive">{error}</p>
                ) : null}

                <Tabs defaultValue="all" className="mt-5">
                  <TabsList className="w-full justify-start gap-2 overflow-x-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="users">
                      Users
                      <CountBadge count={userCount} />
                    </TabsTrigger>
                    <TabsTrigger value="tags">
                      Tags
                      <CountBadge count={tagCount} />
                    </TabsTrigger>
                    <TabsTrigger value="models">
                      Models
                      <CountBadge count={modelCount} />
                    </TabsTrigger>
                  </TabsList>

                  {/* ALL: no subheadings, just cards + separators */}
                  <TabsContent value="all" className="mt-5">
                    {loading && results.length === 0 && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <UserCardSkeleton key={i} />
                        ))}
                      </div>
                    )}

                    {(() => {
                      const hasUsers = results.length > 0;
                      const hasTags = tagSearch.length > 0;
                      const hasModels =
                        matchedModelCategories.length + modelSearch.length > 0;

                      if (!hasUsers && !hasTags && !hasModels && !loading) {
                        return (
                          <EmptyState
                            message={`No results found for “${debouncedQuery}”.`}
                          />
                        );
                      }

                      return (
                        <>
                          {hasUsers && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {results.map((u) => (
                                <UserCard
                                  key={u.id}
                                  avatarUrl={u.avatarUrl}
                                  name={u.displayName}
                                  username={u.username}
                                  userId={u.id}
                                  bio={u.bio}
                                  bannerUrl={u.bannerUrl}
                                  followers={u.followers}
                                  following={u.following}
                                  numPosts={u.numPosts}
                                  href={
                                    u.username
                                      ? `/home/profile/${u.username}`
                                      : undefined
                                  }
                                />
                              ))}
                            </div>
                          )}

                          {hasUsers && (hasTags || hasModels) && (
                            <Separator className="my-6" />
                          )}

                          {hasTags && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {tagSearch.map((t, idx) => (
                                <HashTags
                                  key={`${t.name}-${idx}`}
                                  hashtag={t.name}
                                  photos={t.photos}
                                />
                              ))}
                            </div>
                          )}

                          {hasTags && hasModels && (
                            <Separator className="my-6" />
                          )}

                          {hasModels && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {matchedModelCategories.map((m) => (
                                <ModelCard
                                  key={m.key}
                                  model={m.key}
                                  modelName={m.label}
                                />
                              ))}
                              {modelSearch.map((name) => (
                                <ModelCard
                                  key={name}
                                  model={"other"}
                                  modelName={name}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="users" className="mt-5">
                    {loading && results.length === 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <UserCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : results.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((u) => (
                          <UserCard
                            key={u.id}
                            avatarUrl={u.avatarUrl}
                            name={u.displayName}
                            username={u.username}
                            userId={u.id}
                            bio={u.bio}
                            bannerUrl={u.bannerUrl}
                            followers={u.followers}
                            following={u.following}
                            numPosts={u.numPosts}
                            href={
                              u.username
                                ? `/home/profile/${u.username}`
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        message={`No users found${
                          debouncedQuery ? ` for “${debouncedQuery}”` : ""
                        }.`}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="tags" className="mt-5">
                    {tagsError && (
                      <p className="text-sm text-destructive">{tagsError}</p>
                    )}
                    {tagSearch.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tagSearch.map((t, idx) => (
                          <HashTags
                            key={`${t.name}-${idx}`}
                            hashtag={t.name}
                            photos={t.photos}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No tags found." />
                    )}
                  </TabsContent>

                  <TabsContent value="models" className="mt-5">
                    {modelSearchError && (
                      <p className="text-sm text-destructive">
                        {modelSearchError}
                      </p>
                    )}
                    {matchedModelCategories.length + modelSearch.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {matchedModelCategories.map((m) => (
                          <ModelCard
                            key={m.key}
                            model={m.key}
                            modelName={m.label}
                          />
                        ))}
                        {modelSearch.map((name) => (
                          <ModelCard
                            key={name}
                            model={"other"}
                            modelName={name}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="No models found." />
                    )}
                  </TabsContent>
                </Tabs>
              </section>
            ) : (
              <>
                <section className="rounded-xl border p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Explore by tags</h2>
                    <div className="hidden sm:flex items-center gap-2">
                      <QuickTags
                        tags={(tags || []).slice(0, 6)}
                        onPick={(name) => setQuery(name)}
                      />
                    </div>
                  </div>
                  {tagsLoading && (
                    <div className="mt-4">
                      <HashTagsSkeleton />
                    </div>
                  )}
                  {tagsError && (
                    <p className="text-sm text-destructive mt-2">{tagsError}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-5">
                    {(tags || []).slice(0, 2).map((t, idx) => (
                      <HashTags
                        key={`${t.name}-${idx}`}
                        hashtag={t.name}
                        photos={t.photos}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border p-4 md:p-5">
                  <h2 className="text-xl font-semibold">Explore by models</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
                    <ModelCard
                      model="gemini"
                      modelName="Gemini"
                      icon={<Banana className="ml-2 h-5 w-5 text-yellow-500" />}
                    />
                    <ModelCard model="chatgpt" modelName="ChatGPT" />
                    <ModelCard model="grok" modelName="Grok" />
                    <ModelCard model="midjourney" modelName="Midjourney" />
                    <ModelCard model="other" modelName="Others" />
                  </div>
                </section>
              </>
            )}
          </main>

          {!isSearching && (
            <aside className="lg:col-span-4 lg:sticky lg:top-16 h-fit space-y-6">
              {/* Trending tags compact */}
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Trending tags</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <QuickTags
                    tags={(tags || []).slice(0, 12)}
                    onPick={(name) => setQuery(name)}
                  />
                </div>
              </div>

              {/* Who to follow */}
              <div className="rounded-xl border p-4">
                <h2 className="text-xl font-semibold">Who to follow</h2>
                {error ? (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                ) : null}

                {loading && results.length === 0 ? (
                  <div className="mt-4 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <UserCardSkeleton key={i} />
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 space-y-4">
                  {results.slice(0, 6).map((u) => (
                    <UserCard
                      key={u.id}
                      avatarUrl={u.avatarUrl}
                      name={u.displayName}
                      username={u.username}
                      userId={u.id}
                      bio={u.bio}
                      bannerUrl={u.bannerUrl}
                      followers={u.followers}
                      following={u.following}
                      numPosts={u.numPosts}
                      href={
                        u.username ? `/home/profile/${u.username}` : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/* Helpers */
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced as T;
}

async function createCountQuery(
  table: "follows" | "posts",
  column: string,
  value: string
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  if (error) return 0;
  return count ?? 0;
}

/* Small UI helpers */
function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium leading-none">
      {count}
    </span>
  );
}

function SummaryPill({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
      <span className="text-[11px]">{label}</span>
      <span className="text-[11px] font-semibold text-foreground">{count}</span>
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function QuickTags({
  tags,
  onPick,
}: {
  tags: ExploreTag[];
  onPick: (name: string) => void;
}) {
  return (
    <>
      {tags.map((t, i) => (
        <button
          key={`${t.name}-${i}`}
          onClick={() => onPick(t.name)}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs hover:bg-muted/80"
          title={`Search ${t.name}`}
        >
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{t.name}</span>
        </button>
      ))}
    </>
  );
}
