import { ImageResponse } from 'next/og'
import { createClient } from '@/util/supabase/server'
import {
  OG_IMAGE_CONFIG,
  OG_COLORS,
  baseContainerStyle,
  headerStyle,
  truncateText,
  limitLines,
} from '@/lib/og-image-generator'

export const alt = 'AI Cookbook - Prompt'
export const size = OG_IMAGE_CONFIG.size
export const contentType = OG_IMAGE_CONFIG.contentType

type PostRow = {
  id: string
  created_at: string | null
  text: string | null
  media_urls: string[] | null
  model_name: string | null
  model_label: string | null
  model_key: string | null
  model_kind: string | null
  model_provider: string | null
  model_provider_slug: string | null
  category: string | null
  category_slug: string | null
  sub_category: string | null
  sub_category_slug: string | null
  author: string | null
}

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default async function Image({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const supabase = await createClient()

  try {
    // Fetch post data
    const { data: postRow } = await supabase
      .from('posts')
      .select(
        'id, created_at, text, media_urls, model_name, model_label, model_provider, category, sub_category, author'
      )
      .eq('id', postId)
      .single<PostRow>()

    if (!postRow || !postRow.text) {
      // Default fallback if post not found
      return new ImageResponse(
        (
          <div style={{ ...baseContainerStyle, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ ...headerStyle, fontSize: 48 }}>AI Cookbook</h1>
            <p style={{ fontSize: 24, color: OG_COLORS.mutedText }}>Prompt not found</p>
          </div>
        ),
        { ...size }
      )
    }

    // Fetch author profile if available
    let author: ProfileRow | null = null
    if (postRow.author) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', postRow.author)
        .maybeSingle<ProfileRow>()
      author = profile ?? null
    }

    // Prepare display text
    const postText = truncateText(limitLines(postRow.text || '', 4), 200)
    const authorName = author?.full_name || author?.username || 'Anonymous'
    const model = postRow.model_label || postRow.model_name || 'General'
    const category = postRow.category || 'Prompt'

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
          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Category & Model badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: OG_COLORS.primary,
                  color: OG_COLORS.background,
                  borderRadius: '20px',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {category}
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: OG_COLORS.accent,
                  color: OG_COLORS.background,
                  borderRadius: '20px',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {model}
              </div>
            </div>

            {/* Prompt text */}
            <p
              style={{
                fontSize: 32,
                color: OG_COLORS.text,
                lineHeight: 1.4,
                margin: 0,
                fontWeight: 600,
              }}
            >
              {postText}
            </p>
          </div>

          {/* Footer with author info */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '20px',
              borderTop: `2px solid ${OG_COLORS.primary}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: OG_COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: OG_COLORS.background,
                  fontSize: 18,
                  fontWeight: 'bold',
                }}
              >
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: OG_COLORS.text,
                  }}
                >
                  {truncateText(authorName, 30)}
                </p>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: OG_COLORS.mutedText,
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
    console.error('Error generating OG image for post:', error)
    return new ImageResponse(
      (
        <div style={{ ...baseContainerStyle, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ ...headerStyle, fontSize: 48 }}>AI Cookbook</h1>
          <p style={{ fontSize: 24, color: OG_COLORS.mutedText }}>Prompt</p>
        </div>
      ),
      { ...size }
    )
  }
}
