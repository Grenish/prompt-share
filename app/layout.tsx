import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aicookbook.vercel.app";

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "AI Cookbook",
  description:
    "AI Cookbook is your go-to library for powerful AI prompts. Share your own, explore curated prompts, and unlock creativity with ChatGPT, Gemini, MidJourney, and more.",
  keywords: [
    "AI prompts",
    "prompt library",
    "AI Cookbook",
    "ChatGPT prompts",
    "Gemini prompts",
    "MidJourney prompts",
    "AI productivity",
    "prompt engineering",
    "AI tools",
    "prompt sharing",
    "AI community",
    "creative AI",
  ],
  authors: [{ name: "AI Cookbook Team" }],
  creator: "AI Cookbook",
  publisher: "AI Cookbook",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AI Cookbook - Share & Discover AI Prompts",
    description:
      "Browse, share, and discover curated AI prompts for ChatGPT, Gemini, MidJourney, and other AI tools. Unlock new ways to boost creativity and productivity.",
    siteName: "AI Cookbook",
    images: ["/opengraph-image.png"],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Cookbook - Share & Discover the Best AI Prompts",
    description:
      "AI Cookbook is a community-driven library of AI prompts for ChatGPT, Gemini, MidJourney, and more. Share your own prompts and discover new ideas.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Cookbook",
    description: "Share & Discover the Best AI Prompts",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/home/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Cookbook",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/og?type=default`,
      },
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Script
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
          data-hostname="aicookbook.work"
        />
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="f10bc64a-84b2-4ecb-8394-901e5972750a"
        />
      </body>
    </html>
  );
}
