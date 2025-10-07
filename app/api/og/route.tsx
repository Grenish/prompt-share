// app/api/og/route.tsx
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Preload Inter fonts (cached at the edge)
const inter400 = fetch(
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff",
).then((r) => r.arrayBuffer());

const inter500 = fetch(
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-500-normal.woff",
).then((r) => r.arrayBuffer());

const inter700 = fetch(
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff",
).then((r) => r.arrayBuffer());

type OGType = "default" | "post" | "profile" | "tag";

const THEMES: Record<
  OGType,
  { accent: string; accentSoft: string; badge: string }
> = {
  default: {
    accent: "#ec4899",
    accentSoft: "rgba(236, 72, 153, 0.16)",
    badge: "🍳 Discover",
  },
  post: {
    accent: "#8b5cf6",
    accentSoft: "rgba(139, 92, 246, 0.14)",
    badge: "📝 Post",
  },
  profile: {
    accent: "#06b6d4",
    accentSoft: "rgba(6, 182, 212, 0.14)",
    badge: "👤 Profile",
  },
  tag: {
    accent: "#f59e0b",
    accentSoft: "rgba(245, 158, 11, 0.14)",
    badge: "🏷️ Tag",
  },
};

const clamp = (str: string, max: number) =>
  str.length > max ? str.slice(0, max - 1) + "…" : str;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "AI Cookbook";
    const description =
      searchParams.get("description") || "Share & Discover the Best AI Prompts";
    const rawType = (searchParams.get("type") || "default") as OGType;
    const type: OGType = ["default", "post", "profile", "tag"].includes(rawType)
      ? rawType
      : "default";
    const username = searchParams.get("username") || "";
    const avatar = searchParams.get("avatar") || "";

    const theme = THEMES[type];
    const [font400, font500, font700] = await Promise.all([
      inter400,
      inter500,
      inter700,
    ]);

    const safeTitle =
      type === "post" || type === "tag" ? clamp(title, 110) : clamp(title, 80);
    const safeDesc = clamp(description, 160);

    const base = {
      width: 1200,
      height: 630,
      bg: "#0b0b0d",
      text: "#e5e7eb",
      sub: "#9ca3af",
      border: "rgba(255,255,255,0.08)",
      cardBg:
        "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
    };

    const backgroundStyle = {
      height: "100%",
      width: "100%",
      display: "flex",
      fontFamily:
        "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial",
      backgroundColor: base.bg,
      backgroundImage: `
        radial-gradient(60% 90% at 0% 0%, ${theme.accentSoft}, transparent 60%),
        radial-gradient(70% 100% at 100% 100%, rgba(124,58,237,0.10), transparent 60%),
        radial-gradient(1px 1px at 25px 25px, rgba(255,255,255,0.05), transparent 0),
        radial-gradient(1px 1px at 75px 75px, rgba(255,255,255,0.04), transparent 0)
      `,
      backgroundSize: "100% 100%, 100% 100%, 100px 100px, 100px 100px",
      color: base.text,
      position: "relative" as const,
      letterSpacing: "-0.01em",
    };

    const Brand = (
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: theme.accent,
            marginRight: 10,
          }}
        />
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            backgroundImage: "linear-gradient(90deg, #fafafa, #d4d4d8)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          AI Cookbook
        </div>
      </div>
    );

    const Badge = (
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          display: "flex",
          alignItems: "center",
          padding: "10px 20px",
          borderRadius: 999,
          border: `1px solid ${base.border}`,
          backgroundColor: theme.accentSoft,
          color: "#cbd5e1",
          fontWeight: 500,
          fontSize: 20,
        }}
      >
        {theme.badge}
      </div>
    );

    const Card = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 1020,
      minHeight: 380,
      margin: "auto",
      borderRadius: 24,
      border: `1px solid ${base.border}`,
      background: base.cardBg,
      padding: "48px 56px",
    };

    // Layouts per type
    let Content;

    if (type === "profile") {
      Content = (
        <div style={Card}>
          {/* Left: avatar */}
          <div
            style={{ display: "flex", alignItems: "center", marginRight: 36 }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 999,
                border: `5px solid ${theme.accent}`,
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  width={146}
                  height={146}
                  style={{
                    width: 146,
                    height: 146,
                    borderRadius: 999,
                    objectFit: "cover",
                    border: `1px solid ${base.border}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 146,
                    height: 146,
                    borderRadius: 999,
                    background: "linear-gradient(180deg, #16161a, #121216)",
                    border: `1px solid ${base.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a1a1aa",
                    fontSize: 48,
                  }}
                >
                  👤
                </div>
              )}
            </div>
          </div>

          {/* Right: text */}
          <div
            style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  color: theme.accent,
                  fontWeight: 700,
                  marginRight: 12,
                }}
              >
                {username ? `@${clamp(username, 24)}` : "@user"}
              </div>
              <div
                style={{
                  height: 14,
                  width: 14,
                  borderRadius: 999,
                  backgroundColor: theme.accent,
                  opacity: 0.75,
                }}
              />
            </div>

            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.15,
                color: base.text,
                marginBottom: 14,
                maxWidth: 700,
              }}
            >
              {safeTitle}
            </div>

            <div
              style={{
                fontSize: 26,
                color: base.sub,
                lineHeight: 1.4,
                maxWidth: 700,
              }}
            >
              {safeDesc}
            </div>
          </div>
        </div>
      );
    } else if (type === "post") {
      Content = (
        <div
          style={{ ...Card, flexDirection: "column", alignItems: "flex-start" }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              color: base.text,
              marginBottom: 16,
              textAlign: "left",
              maxWidth: 900,
            }}
          >
            {safeTitle}
          </div>

          <div
            style={{
              fontSize: 28,
              color: base.sub,
              lineHeight: 1.45,
              maxWidth: 900,
              marginBottom: 24,
            }}
          >
            {safeDesc}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "8px 16px",
              border: `1px solid ${base.border}`,
              backgroundColor: theme.accentSoft,
              color: "#cbd5e1",
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            {THEMES.post.badge}
          </div>
        </div>
      );
    } else if (type === "tag") {
      Content = (
        <div style={{ ...Card, flexDirection: "column", alignItems: "center" }}>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <div
              style={{
                borderRadius: 999,
                padding: "8px 16px",
                border: `1px solid ${base.border}`,
                backgroundColor: theme.accentSoft,
                color: theme.accent,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {THEMES.tag.badge}
            </div>
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              color: base.text,
              textAlign: "center",
              marginBottom: 14,
              maxWidth: 900,
            }}
          >
            #{safeTitle.replace(/^#*/, "")}
          </div>

          <div
            style={{
              fontSize: 26,
              color: base.sub,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 820,
            }}
          >
            {safeDesc}
          </div>
        </div>
      );
    } else {
      // default
      Content = (
        <div style={{ ...Card, flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              textAlign: "center",
              marginBottom: 14,
              backgroundImage: `linear-gradient(90deg, #ffffff, ${theme.accent})`,
              backgroundClip: "text",
              color: "transparent",
              maxWidth: 900,
            }}
          >
            {safeTitle}
          </div>

          <div
            style={{
              fontSize: 28,
              color: base.sub,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 840,
            }}
          >
            {safeDesc}
          </div>
        </div>
      );
    }

    return new ImageResponse(
      (
        <div style={backgroundStyle}>
          {Brand}
          {Content}
          {Badge}
        </div>
      ),
      {
        width: base.width,
        height: base.height,
        fonts: [
          { name: "Inter", data: font400, weight: 400, style: "normal" },
          { name: "Inter", data: font500, weight: 500, style: "normal" },
          { name: "Inter", data: font700, weight: 700, style: "normal" },
        ],
      },
    );
  } catch (e: unknown) {
    console.error("Error generating OG image:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
