import { ImageResponse } from 'next/og'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Privacy Policy'
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
            Privacy Policy
          </h1>

          <p
            style={{
              fontSize: 32,
              color: OG_COLORS.mutedText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Your privacy matters to us. Learn how we protect your data
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
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: OG_COLORS.primary,
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 20,
                color: OG_COLORS.text,
              }}
            >
              100% Secure & Transparent
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
