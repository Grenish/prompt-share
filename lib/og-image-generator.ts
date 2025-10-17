/**
 * Open Graph Image Generator Utility
 * Provides reusable components and styles for generating OG images across the application
 */

export const OG_IMAGE_CONFIG = {
  size: {
    width: 1200,
    height: 630,
  },
  contentType: 'image/png',
} as const

export const OG_COLORS = {
  background: '#fefcff',
  darkBackground: '#020617',
  primary: '#7c3aed', // violet
  text: '#000000',
  darkText: '#ffffff',
  accent: '#ec4899', // pink
  secondary: '#3b82f6', // blue
  mutedText: '#666666',
  darkMutedText: '#999999',
} as const

export const OG_FONTS = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontFamilyMono: 'monospace',
} as const

/**
 * Base styles for OG images
 * IMPORTANT: Satori requires explicit display property on all flex containers
 */
export const baseContainerStyle = {
  width: '100%',
  height: '100%',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  padding: '60px',
  background: OG_COLORS.background,
  fontFamily: OG_FONTS.fontFamily,
}

/**
 * Dark mode container style
 */
export const darkContainerStyle = {
  ...baseContainerStyle,
  background: OG_COLORS.darkBackground,
  color: OG_COLORS.darkText,
}

/**
 * Header style for titles
 */
export const headerStyle = {
  fontSize: 64,
  fontWeight: 'bold' as const,
  color: OG_COLORS.primary,
  marginBottom: '20px',
  lineHeight: 1.2,
}

/**
 * Subtitle style
 */
export const subtitleStyle = {
  fontSize: 32,
  color: OG_COLORS.mutedText,
  marginBottom: '40px',
  lineHeight: 1.4,
}

/**
 * Description style
 */
export const descriptionStyle = {
  fontSize: 24,
  color: OG_COLORS.mutedText,
  lineHeight: 1.5,
  maxWidth: '100%',
}

/**
 * Badge/tag style
 */
export const badgeStyle = {
  display: 'inline-flex',
  padding: '8px 16px',
  backgroundColor: OG_COLORS.primary,
  color: OG_COLORS.background,
  borderRadius: '24px',
  fontSize: 16,
  fontWeight: 600,
  marginRight: '12px',
  marginBottom: '12px',
}

/**
 * Footer style
 */
export const footerStyle = {
  marginTop: 'auto',
  paddingTop: '40px',
  borderTop: `2px solid ${OG_COLORS.primary}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 18,
  color: OG_COLORS.mutedText,
}

/**
 * Truncate text to a maximum length
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

/**
 * Limit lines of text
 */
export const limitLines = (text: string, maxLines: number = 3): string => {
  const lines = text.split('\n')
  return lines.slice(0, maxLines).join('\n')
}
