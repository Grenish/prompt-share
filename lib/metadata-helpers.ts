import type { Metadata } from "next";

/**
 * Generate metadata with consistent Open Graph configuration
 * Use this helper to ensure consistent metadata across all pages
 */
export function generatePageMetadata(
  title: string,
  description: string,
  ogImage?: string,
  additionalMeta?: Partial<Metadata>
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    ...additionalMeta,
  };
}

/**
 * Generate metadata for article/post pages
 */
export function generatePostMetadata(
  title: string,
  description: string,
  ogImage?: string,
  author?: string,
  publishedTime?: string
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImage ? [ogImage] : undefined,
      ...(author && { authors: [author] }),
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/**
 * Generate metadata for profile pages
 */
export function generateProfileMetadata(
  username: string,
  fullName: string | null,
  bio: string | null,
  ogImage?: string
): Metadata {
  const title = `${fullName || username} - AI Cookbook`;
  const description = bio || `${username}'s AI prompt collection on AI Cookbook`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: ogImage ? [ogImage] : undefined,
      ...(fullName && { 
        profile: {
          username: username,
        }
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}
