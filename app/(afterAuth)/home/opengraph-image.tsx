import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
  subtitleStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Browse Prompts'
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
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <h1
            style={{
              ...headerStyle,
              fontSize: 68,
              margin: 0,
              textAlign: 'center',
            }}
          >
            Discover AI Prompts
          </h1>
          <p
            style={{
              ...subtitleStyle,
              margin: 0,
              fontSize: 32,
              color: OG_COLORS.mutedText,
            }}
          >
            Curated collection for creators & professionals
          </p>
          <div
            style={{
              marginTop: '40px',
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {['Popular', 'Trending', 'Saved'].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '10px 20px',
                  backgroundColor: OG_COLORS.primary,
                  color: OG_COLORS.background,
                  borderRadius: '20px',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
