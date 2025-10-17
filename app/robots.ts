import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = "https://aicookbook.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/(auth)/",
          "/home/create",
          "/home/notifications",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
