import { ImageResponse } from "next/og";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const alt = "AI Cookbook - Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

function clamp(text: string | null | undefined, max: number) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, bio, avatar_url")
      .eq("username", username)
      .maybeSingle<ProfileRow>();

    if (profileError) console.error("OG profile fetch error:", profileError);

    if (!profile) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0B1220",
              color: "#F8FAFC",
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            Profile not found
          </div>
        ),
        size,
      );
    }

    const { count: postCount, error: countError } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author", profile.id);

    if (countError) console.error("OG post count error:", countError);

    const displayName = profile.full_name || profile.username || "User";
    const bio = clamp(profile.bio || "AI Prompt Creator", 160);
    const posts = postCount || 0;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: 64,
            backgroundColor: "#0B1220",
            color: "#E5E7EB",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#6366F1",
                color: "#0B1220",
                fontSize: 48,
                fontWeight: 800,
                marginRight: 24,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#F8FAFC",
                  marginBottom: 8,
                }}
              >
                {clamp(displayName, 40)}
              </div>
              <div style={{ fontSize: 20, color: "#94A3B8" }}>
                @{clamp(profile.username, 30)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#E5E7EB",
              lineHeight: 1.5,
              marginBottom: 32,
            }}
          >
            {bio}
          </div>

          <div
            style={{
              display: "flex",
              height: 2,
              backgroundColor: "#334155",
              width: "100%",
              marginBottom: 24,
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#A5B4FC",
                  marginBottom: 4,
                }}
              >
                {posts}
              </div>
              <div style={{ fontSize: 18, color: "#94A3B8" }}>Prompts</div>
            </div>

            <div style={{ fontSize: 20, color: "#94A3B8" }}>AI Cookbook</div>
          </div>
        </div>
      ),
      size,
    );
  } catch (err) {
    console.error("OG profile generation error:", err);
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B1220",
            color: "#F8FAFC",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          AI Cookbook
        </div>
      ),
      size,
    );
  }
}
