import { ImageResponse } from 'next/og'
import { createClient } from '@/util/supabase/server'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
  truncateText,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - User Profile'
export const size = OG_IMAGE_CONFIG.size
export const contentType = OG_IMAGE_CONFIG.contentType

type ProfileRow = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  background_image: string | null
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  try {
    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url')
      .eq('username', username)
      .maybeSingle<ProfileRow>()

    if (!profile) {
      // Default fallback if profile not found
      return new ImageResponse(
        (
          <div style={{ ...baseContainerStyle, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ ...headerStyle, fontSize: 48 }}>AI Cookbook</h1>
            <p style={{ fontSize: 24, color: OG_COLORS.mutedText }}>Profile not found</p>
          </div>
        ),
        { ...size }
      )
    }

    // Fetch post count for this user
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author', profile.id)

    // Prepare display data
    const displayName = profile.full_name || profile.username || 'User'
    const bio = profile.bio ? truncateText(profile.bio, 150) : 'AI Prompt Creator'
    const posts = postCount || 0

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
          {/* Main profile content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'flex-start' }}>
            {/* Avatar and name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              {profile.avatar_url ? (
                // We can't use <img> directly from external URLs in all cases,
                // so we'll use a stylized avatar
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `4px solid ${OG_COLORS.primary}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: OG_COLORS.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: OG_COLORS.background,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* User info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h1
                  style={{
                    ...headerStyle,
                    fontSize: 56,
                    margin: 0,
                    color: OG_COLORS.text,
                  }}
                >
                  {truncateText(displayName, 40)}
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: 20,
                    color: OG_COLORS.mutedText,
                    fontWeight: 500,
                  }}
                >
                  @{truncateText(profile.username, 30)}
                </p>
              </div>
            </div>

            {/* Bio */}
            {bio && (
              <p
                style={{
                  fontSize: 24,
                  color: OG_COLORS.text,
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '100%',
                }}
              >
                {bio}
              </p>
            )}
          </div>

          {/* Footer with stats */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '30px',
              borderTop: `2px solid ${OG_COLORS.primary}`,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '40px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: OG_COLORS.primary,
                  }}
                >
                  {posts}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    color: OG_COLORS.mutedText,
                  }}
                >
                  Prompts
                </p>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 18,
                color: OG_COLORS.mutedText,
                fontWeight: 500,
              }}
            >
              AI Cookbook
            </p>
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
    console.error('Error generating OG image for profile:', error)
    return new ImageResponse(
      (
        <div style={{ ...baseContainerStyle, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ ...headerStyle, fontSize: 48 }}>AI Cookbook</h1>
          <p style={{ fontSize: 24, color: OG_COLORS.mutedText }}>Profile</p>
        </div>
      ),
      { ...size }
    )
  }
}
