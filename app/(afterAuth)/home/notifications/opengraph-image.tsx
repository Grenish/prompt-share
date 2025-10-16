import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Notifications'
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
            Notifications
          </h1>

          <p
            style={{
              fontSize: 32,
              color: OG_COLORS.mutedText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Stay updated with community activity
          </p>

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: OG_COLORS.accent,
                animation: 'pulse 2s infinite',
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 20,
                color: OG_COLORS.text,
              }}
            >
              Real-time Updates
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
