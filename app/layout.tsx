import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClarityInit from "@/components/ClarityInit";

export const metadata: Metadata = {
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
  ],
  openGraph: {
    title: "AI Cookbook",
    description:
      "Browse, share, and discover curated AI prompts for ChatGPT, Gemini, MidJourney, and other AI tools. Unlock new ways to boost creativity and productivity.",
    url: "http://localhost:3000",
    siteName: "AI Cookbook",
    images: [
      {
        url: "https://yourdomain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Cookbook - Share & Discover AI Prompts",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Cookbook - Share & Discover the Best AI Prompts",
    description:
      "AI Cookbook is a community-driven library of AI prompts for ChatGPT, Gemini, MidJourney, and more. Share your own prompts and discover new ideas.",
    images: ["https://yourdomain.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ClarityInit />
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        </ThemeProvider>
      </body>
    </html>
  );
}
