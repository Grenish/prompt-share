/**
 * Analytics Provider - Combines GA4 and Clarity initialization
 * Handles page view tracking and user identification
 */

"use client";

import { useEffect } from "react";
import GA4Provider from "./GA4Provider";
import ClarityInit from "./ClarityInit";
import { usePageViewTracking, useIdentifyUser } from "@/hooks/use-analytics";

interface AnalyticsProviderProps {
  userId?: string;
  userProperties?: {
    username?: string;
    email?: string;
    plan?: string;
    signupDate?: string;
  };
}

export default function AnalyticsProvider({
  userId,
  userProperties,
}: AnalyticsProviderProps) {
  // Automatically track page views
  usePageViewTracking();

  // Identify user for personalized tracking
  useIdentifyUser(userId, userProperties);

  // Log analytics status in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const gaEnabled = !!process.env.NEXT_PUBLIC_GA_ID;
      const clarityEnabled = !!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

      console.log("📊 Analytics Status:", {
        GA4: gaEnabled ? "✅ Enabled" : "❌ Disabled",
        Clarity: clarityEnabled ? "✅ Enabled" : "❌ Disabled",
        UserTracking: userId ? `✅ User: ${userId}` : "❌ Anonymous",
      });
    }
  }, [userId]);

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {gaId && <GA4Provider gaId={gaId} />}
      <ClarityInit />
    </>
  );
}
