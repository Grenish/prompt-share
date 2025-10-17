import { MetadataRoute } from "next";
import { createClient } from "@/util/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://aicookbook.vercel.app";
  const supabase = await createClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/home/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const postRoutes: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${siteUrl}/home/posts/${post.id}`,
    lastModified: new Date(post.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username")
    .not("username", "is", null)
    .limit(500);

  const profileRoutes: MetadataRoute.Sitemap = (profiles || []).map(
    (profile) => ({
      url: `${siteUrl}/home/profile/${profile.username}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  // Dynamic tags
  const { data: tags } = await supabase.from("tags").select("name").limit(200);

  const tagRoutes: MetadataRoute.Sitemap = (tags || []).map((tag) => ({
    url: `${siteUrl}/home/explore/tags/${encodeURIComponent(tag.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...profileRoutes, ...tagRoutes];
}

export const revalidate = 3600; // Revalidate every hour
