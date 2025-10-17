import { ImageResponse } from "next/og";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const alt = "AI Cookbook - Prompt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PostRow = {
  id: string;
  created_at: string | null;
  text: string | null;
  media_urls: string[] | null;
  model_name: string | null;
  model_label: string | null;
  model_key: string | null;
  model_kind: string | null;
  model_provider: string | null;
  model_provider_slug: string | null;
  category: string | null;
  category_slug: string | null;
  sub_category: string | null;
  sub_category_slug: string | null;
  author: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

function clampLines(text: string, maxChars: number) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > maxChars ? `${t.slice(0, maxChars - 1)}…` : t;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );

    const { data: postRow, error: postError } = await supabase
      .from("posts")
      .select(
        "id, created_at, text, media_urls, model_name, model_label, model_provider, category, sub_category, author",
      )
      .eq("id", postId)
      .maybeSingle<PostRow>();

    if (postError) {
      console.error("Error fetching post for OG image:", postError);
    }

    const url = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Fallback if not found or missing text
    if (!postRow || !postRow.text) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0B1220",
              color: "#E5E7EB",
              padding: 64,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#F8FAFC",
                  marginBottom: 8,
                }}
              >
                AI Cookbook
              </div>
              <div style={{ fontSize: 24, color: "#94A3B8" }}>
                Prompt not found
              </div>
            </div>
          </div>
        ),
        size,
      );
    }

    // Fetch author (optional)
    let author: ProfileRow | null = null;
    if (postRow.author) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", postRow.author)
        .maybeSingle<ProfileRow>();

      if (profileError) {
        console.error("Error fetching profile for OG image:", profileError);
      }
      author = profile ?? null;
    }

    const authorName = author?.full_name || author?.username || "Anonymous";
    const model = postRow.model_label || postRow.model_name || "General";
    const category = postRow.category || "Prompt";

    const postText = clampLines(postRow.text, 220);

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
          {/* Header badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                backgroundColor: "#6366F1",
                color: "#0B1220",
                borderRadius: 9999,
                fontSize: 16,
                fontWeight: 700,
                marginRight: 8,
              }}
            >
              {category}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                backgroundColor: "#0EA5E9",
                color: "#0B1220",
                borderRadius: 9999,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {model}
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 40,
                lineHeight: 1.35,
                color: "#F1F5F9",
                fontWeight: 700,
              }}
            >
              {postText}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              marginTop: 24,
              marginBottom: 16,
              height: 2,
              backgroundColor: "#334155",
              width: "100%",
            }}
          />

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Author */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  backgroundColor: "#6366F1",
                  color: "#0B1220",
                  fontWeight: 800,
                  fontSize: 18,
                  marginRight: 10,
                }}
              >
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#E5E7EB",
                    marginBottom: 2,
                  }}
                >
                  {authorName}
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8" }}>
                  AI Cookbook
                </div>
              </div>
            </div>

            {/* Right brand text */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  fontSize: 16,
                  color: "#94A3B8",
                }}
              >
                {url}
              </div>
            </div>
          </div>
        </div>
      ),
      size,
    );
  } catch (error) {
    console.error("Error generating OG image for post:", error);
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B1220",
            color: "#E5E7EB",
            padding: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "#F8FAFC",
                marginBottom: 8,
              }}
            >
              AI Cookbook
            </div>
            <div style={{ fontSize: 24, color: "#94A3B8" }}>Prompt</div>
          </div>
        </div>
      ),
      size,
    );
  }
}
