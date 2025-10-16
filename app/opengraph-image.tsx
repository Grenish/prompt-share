import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
  subtitleStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Share & Discover AI Prompts'
export const size = OG_IMAGE_CONFIG.size
export const contentType = OG_IMAGE_CONFIG.contentType

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          ...baseContainerStyle,
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
              fontSize: 72,
              margin: 0,
              textAlign: 'center',
            }}
          >
            AI Cookbook
          </h1>
          <p
            style={{
              ...subtitleStyle,
              margin: 0,
              fontSize: 36,
              color: OG_COLORS.mutedText,
            }}
          >
            Browse, Share & Discover Powerful AI Prompts
          </p>
          <div
            style={{
              marginTop: '40px',
              fontSize: 20,
              color: OG_COLORS.text,
              opacity: 0.8,
            }}
          >
            ChatGPT • Gemini • MidJourney • Claude
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
