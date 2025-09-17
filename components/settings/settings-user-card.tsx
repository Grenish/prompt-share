"use client";

import { SectionHeader } from "./section-header";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { createClient } from "@/util/supabase/client";
import { useEffect, useState, useCallback } from "react";

type Profile = {
  username: string | null;
  bio: string | null;
  backgroundUrl: string | null;
};

export default function SettingsUserCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Fetch profile client-side
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        if (alive) {
          setError("Not authenticated");
          setLoading(false);
        }
        return;
      }
      const { data: row, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) {
        if (alive) {
          setError(profileError.message);
          setLoading(false);
        }
        return;
      }
      if (alive) {
        const p: Profile = {
          username: (row as any)?.username ?? null,
          bio: (row as any)?.bio ?? (row as any)?.about ?? null,
          backgroundUrl: (row as any)?.background_image ?? null,
        };
        setProfile(p);
        setUsername(p.username || "");
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  const handleBlur = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }
      const trimmed = username.trim();
      if (!trimmed) {
        setError("Username cannot be empty");
        return;
      }
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          username: trimmed,
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        setError(upsertError.message);
      } else {
        setProfile((p) => (p ? { ...p, username: trimmed } : p));
        setSaveMessage("Saved");
        setDirty(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save username");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 2500);
    }
  }, [dirty, saving, supabase, username]);

  return (
    <section>
      <SectionHeader
        title="Account"
        description="Basic account information and preferences."
      />
      <div className="mt-6 grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="your-handle"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setDirty(true);
              }}
              onBlur={handleBlur}
              disabled={loading || saving || (!!error && !dirty)}
            />
            {loading && (
              <p className="text-xs text-muted-foreground">Loading...</p>
            )}
            {error && !loading && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            {saveMessage && !loading && !error && (
              <p className="text-xs text-green-600">{saveMessage}</p>
            )}
            {dirty && !loading && !saving && !error && (
              <p className="text-xs text-muted-foreground">Blur to save</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
