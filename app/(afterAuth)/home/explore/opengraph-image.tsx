import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Explore Prompts by Model'
export const size = OG_IMAGE_CONFIG.size
export const contentType = OG_IMAGE_CONFIG.contentType

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          ...baseContainerStyle,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              ...headerStyle,
              fontSize: 64,
              margin: 0,
            }}
          >
            Explore Models
          </h1>

          <p
            style={{
              fontSize: 32,
              color: OG_COLORS.mutedText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Discover curated prompts for ChatGPT, Gemini, Claude, MidJourney, and more
          </p>

          {/* Model badges */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: OG_COLORS.primary,
                color: OG_COLORS.background,
                borderRadius: '24px',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              ChatGPT
            </div>
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: OG_COLORS.primary,
                color: OG_COLORS.background,
                borderRadius: '24px',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Gemini
            </div>
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: OG_COLORS.primary,
                color: OG_COLORS.background,
                borderRadius: '24px',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Claude
            </div>
            <div
              style={{
                padding: '12px 24px',
                backgroundColor: OG_COLORS.primary,
                color: OG_COLORS.background,
                borderRadius: '24px',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              MidJourney
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: '30px',
            borderTop: `2px solid ${OG_COLORS.primary}`,
            fontSize: 16,
            color: OG_COLORS.mutedText,
          }}
        >
          AI Cookbook
        </div>
      </div>
    ),
    { ...size }
  )
}
