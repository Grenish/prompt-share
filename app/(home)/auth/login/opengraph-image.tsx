import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Sign In'
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
            gap: '30px',
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
            Welcome Back
          </h1>

          <p
            style={{
              fontSize: 32,
              color: OG_COLORS.mutedText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Sign in to access your AI prompt library
          </p>

          <div
            style={{
              marginTop: '20px',
              padding: '16px 32px',
              backgroundColor: OG_COLORS.primary,
              color: OG_COLORS.background,
              borderRadius: '8px',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Sign In
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
