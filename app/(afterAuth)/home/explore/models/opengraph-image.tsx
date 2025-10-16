import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Explore AI Models'
export const size = OG_IMAGE_CONFIG.size
export const contentType = OG_IMAGE_CONFIG.contentType

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          ...baseContainerStyle,
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
            AI Models
          </h1>

          <p
            style={{
              fontSize: 32,
              color: OG_COLORS.mutedText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Explore prompts for your favorite AI tools
          </p>

          {/* Model showcase */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            {['ChatGPT', 'Claude', 'Gemini', 'MidJourney', 'Copilot', 'Llama'].map((model, idx) => (
              <div
                key={model}
                style={{
                  padding: '12px 24px',
                  backgroundColor: idx % 2 === 0 ? OG_COLORS.primary : OG_COLORS.accent,
                  color: OG_COLORS.background,
                  borderRadius: '24px',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {model}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
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
