/**
 * Google Analytics 4 Provider Component
 * Handles GA4 initialization and provides debugging in development
 */

"use client";

import { useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

interface GA4ProviderProps {
  gaId: string;
}

export default function GA4Provider({ gaId }: GA4ProviderProps) {
  useEffect(() => {
    if (!gaId) {
      console.warn("GA4 Measurement ID not configured");
      return;
    }

    // Enable debug mode in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 GA4 initialized in debug mode:", gaId);
      
      // Listen for GA4 events in development
      if (typeof window !== "undefined") {
        const originalGtag = window.gtag;
        window.gtag = function(...args: unknown[]) {
          console.log("📊 GA4 Event:", args);
          if (originalGtag) {
            originalGtag.apply(window, args as [string, string | Date, Record<string, unknown>?]);
          }
        };
      }
    }
  }, [gaId]);

  if (!gaId) return null;

  return <GoogleAnalytics gaId={gaId} />;
}
