/**
 * React hooks for analytics tracking
 * Provides easy-to-use hooks for tracking user behavior
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackPageView,
  trackUserEvent,
  identifyUser,
  trackEvent,
  type UserEvent,
  type GAEvent,
} from "@/lib/analytics";

/**
 * Hook to track page views automatically on route changes
 */
export function usePageViewTracking() {
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      trackPageView(pathname);
      previousPathname.current = pathname;
    }
  }, [pathname]);
}

/**
 * Hook to identify user for analytics
 */
export function useIdentifyUser(
  userId?: string,
  userProperties?: {
    username?: string;
    email?: string;
    plan?: string;
    signupDate?: string;
  }
) {
  const hasIdentified = useRef(false);

  useEffect(() => {
    if (userId && !hasIdentified.current) {
      identifyUser(userId, userProperties);
      hasIdentified.current = true;
    }
  }, [userId, userProperties]);
}

/**
 * Hook to get analytics tracking functions
 */
export function useAnalytics() {
  const trackUserAction = useCallback((event: UserEvent) => {
    trackUserEvent(event);
  }, []);

  const trackCustomEvent = useCallback((event: GAEvent) => {
    trackEvent(event);
  }, []);

  return {
    trackUserAction,
    trackCustomEvent,
  };
}

/**
 * Hook to track component visibility (for engagement metrics)
 */
export function useVisibilityTracking(
  elementRef: React.RefObject<HTMLElement>,
  eventName: string,
  threshold = 0.5
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!elementRef.current || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            trackEvent({
              action: "element_visible",
              category: "Engagement",
              label: eventName,
            });
            hasTracked.current = true;
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, eventName, threshold]);
}

/**
 * Hook to track time spent on page
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTime.current;
      if (timeSpent > 1000) {
        // Only track if spent more than 1 second
        trackEvent({
          action: "time_on_page",
          category: "Engagement",
          label: pageName,
          value: Math.round(timeSpent / 1000), // Convert to seconds
        });
      }
    };
  }, [pageName]);
}

/**
 * Hook to track scroll depth
 */
export function useScrollDepthTracking(pageName: string) {
  const maxScroll = useRef(0);
  const hasTracked25 = useRef(false);
  const hasTracked50 = useRef(false);
  const hasTracked75 = useRef(false);
  const hasTracked100 = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercentage = (scrollTop + windowHeight) / documentHeight;

      maxScroll.current = Math.max(maxScroll.current, scrollPercentage);

      if (scrollPercentage >= 0.25 && !hasTracked25.current) {
        trackEvent({
          action: "scroll_depth",
          category: "Engagement",
          label: `${pageName}_25`,
          value: 25,
        });
        hasTracked25.current = true;
      }
      if (scrollPercentage >= 0.5 && !hasTracked50.current) {
        trackEvent({
          action: "scroll_depth",
          category: "Engagement",
          label: `${pageName}_50`,
          value: 50,
        });
        hasTracked50.current = true;
      }
      if (scrollPercentage >= 0.75 && !hasTracked75.current) {
        trackEvent({
          action: "scroll_depth",
          category: "Engagement",
          label: `${pageName}_75`,
          value: 75,
        });
        hasTracked75.current = true;
      }
      if (scrollPercentage >= 0.95 && !hasTracked100.current) {
        trackEvent({
          action: "scroll_depth",
          category: "Engagement",
          label: `${pageName}_100`,
          value: 100,
        });
        hasTracked100.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageName]);
}
