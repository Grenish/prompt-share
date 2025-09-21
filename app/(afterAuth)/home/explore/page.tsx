"use client";

import { useEffect, useMemo, useState } from "react";
import UserCard from "@/components/explore/user-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { createClient } from "@/util/supabase/client";

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  background_image: string | null;
  created_at?: string | null;
  // Optional fields that may exist in the profiles table
  display_name?: string | null;
};

type UserResult = {
  id: string;
  username: string;
  displayName: string;
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

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        // Get current user to filter out self from results
        const { data: userData } = await supabase.auth.getUser();
        const selfId = userData?.user?.id || null;
        const like = `%${debouncedQuery.trim()}%`;
        let q = supabase
          .from("profiles")
          // Select all to tolerate presence/absence of optional columns like display_name
          .select("*");

        if (debouncedQuery.trim()) {
          q = q.or(`username.ilike.${like},bio.ilike.${like}`);
        }

        const { data: rows, error: qErr } = await q
          .order("created_at", { ascending: false })
          .limit(10);
        if (qErr) throw qErr;

        let profiles: ProfileRow[] = rows || [];
        // Filter out self
        if (selfId) profiles = profiles.filter((p) => p.id !== selfId);

        // For each profile, fetch counts in parallel (N <= 10)
        const enriched = await Promise.all(
          profiles.map(async (p) => {
            const [followersRes, followingRes, postsRes] = await Promise.all([
              createCountQuery("follows", "following_id", p.id),
              createCountQuery("follows", "follower_id", p.id),
              createCountQuery("posts", "author", p.id),
            ]);

            const displayName =
              (p as any)?.display_name ?? (p as any)?.full_name ?? p.username ?? "unknown";

            return {
              id: p.id,
              username: p.username ?? "unknown",
              displayName,
              bio: p.bio ?? undefined,
              bannerUrl: p.background_image ?? undefined,
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center">
          <div className="relative w-full max-w-lg border rounded-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 w-full bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
              placeholder="Search users by username or bio..."
            />
          </div>
        </div>
      </header>

      <div className="pt-5 px-4 max-w-6xl mx-auto">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {loading && results.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Searching…</div>
        ) : null}

        {!loading && results.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {debouncedQuery ? "No users found" : "Start typing to find people"}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((u) => (
            <UserCard
              key={u.id}
              name={u.displayName}
              username={u.username}
              userId={u.id}
              bio={u.bio}
              bannerUrl={u.bannerUrl}
              followers={u.followers}
              following={u.following}
              numPosts={u.numPosts}
              href={u.username ? `/home/profile/${u.username}` : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helpers
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
