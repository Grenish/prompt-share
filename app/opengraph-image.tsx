import { ImageResponse } from "next/og";
import { OG_IMAGE_CONFIG } from "@/lib/og-image-generator";

export const alt =
  "AI Cookbook - Share & Discover AI Prompts for ChatGPT, Gemini, Claude & MidJourney";
export const size = OG_IMAGE_CONFIG.size;
export const contentType = OG_IMAGE_CONFIG.contentType;

// Use your domain in production via NEXT_PUBLIC_SITE_URL
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function Image() {
  const thumbs = [
    "/img1.png",
    "/img2.png",
    "/img3.png",
    "/img4.png",
    "/img5.png",
  ].map((p) => `${BASE_URL}${p}`);

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
        {/* Header badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              backgroundColor: "#6366F1",
              marginRight: 8,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 16,
              color: "#9CA3AF",
            }}
          >
            AI PROMPT LIBRARY
          </div>
        </div>

        {/* Title + description */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 100,
              fontWeight: 800,
              color: "#F8FAFC",
              lineHeight: 1,
            }}
          >
            AI Cookbook
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 28,
              color: "#94A3B8",
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            Discover and share powerful AI prompts for ChatGPT, Gemini, Claude,
            and MidJourney.
          </div>

          {/* Inline thumbnails from public/ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            {thumbs.map((src, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: i < thumbs.length - 1 ? 12 : 0,
                }}
              >
                <img
                  src={src}
                  width={72}
                  height={72}
                  alt={`thumbnail-${i + 1}`}
                  style={{
                    display: "block",
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            marginTop: 28,
            marginBottom: 20,
            height: 1,
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Tools list */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {["ChatGPT", "Gemini", "Claude", "MidJourney"].map((tool, i) => (
              <div key={tool} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.25,
                      marginLeft: 12,
                      marginRight: 12,
                      fontSize: 18,
                    }}
                  >
                    •
                  </div>
                ) : null}
                <div style={{ fontSize: 18, color: "#A1A1AA" }}>{tool}</div>
              </div>
            ))}
          </div>

          {/* Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: 8,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 14,
              paddingRight: 14,
              backgroundColor: "rgba(99, 102, 241, 0.08)",
            }}
          >
            <div style={{ fontSize: 14, color: "#A5B4FC", fontWeight: 600 }}>
              Free & Open Source
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
