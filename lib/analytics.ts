/**
 * Analytics utilities for GA4 and Microsoft Clarity
 * Provides type-safe event tracking across the application
 */

// GA4 Event Types
export type GAEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// User behavior events
export type UserEvent =
  | { type: "page_view"; page_path: string; page_title: string }
  | { type: "sign_up"; method: string }
  | { type: "login"; method: string }
  | { type: "logout" }
  | { type: "prompt_create"; category: string; model: string }
  | { type: "prompt_view"; prompt_id: string; category: string }
  | { type: "prompt_like"; prompt_id: string }
  | { type: "prompt_save"; prompt_id: string }
  | { type: "prompt_share"; prompt_id: string; method: string }
  | { type: "comment_create"; prompt_id: string }
  | { type: "user_follow"; target_user_id: string }
  | { type: "user_unfollow"; target_user_id: string }
  | { type: "search"; search_term: string; results_count: number }
  | { type: "profile_edit"; section: string }
  | { type: "explore_filter"; filter_type: string; filter_value: string }
  | { type: "navigation"; from: string; to: string }
  | { type: "error"; error_message: string; error_page: string };

// Check if analytics is enabled
const isAnalyticsEnabled = (): boolean => {
  return (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "production" &&
    (!!process.env.NEXT_PUBLIC_GA_ID || !!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID)
  );
};

// GA4 Functions
type ClarityFunction = {
  (...args: unknown[]): void;
  q?: unknown[];
};

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    clarity?: ClarityFunction;
  }
}

/**
 * Send pageview to Google Analytics
 */
export const trackPageView = (url: string, title?: string): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: url,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

/**
 * Send custom event to Google Analytics
 */
export const trackEvent = (event: GAEvent): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag("event", event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

/**
 * Track user behavior events (GA4 + Clarity)
 */
export const trackUserEvent = (event: UserEvent): void => {
  if (!isAnalyticsEnabled()) return;

  // GA4 Tracking
  if (window.gtag) {
    switch (event.type) {
      case "page_view":
        trackPageView(event.page_path, event.page_title);
        break;
      case "sign_up":
        window.gtag("event", "sign_up", { method: event.method });
        break;
      case "login":
        window.gtag("event", "login", { method: event.method });
        break;
      case "logout":
        window.gtag("event", "logout", {});
        break;
      case "prompt_create":
        window.gtag("event", "prompt_create", {
          category: event.category,
          model: event.model,
        });
        break;
      case "prompt_view":
        window.gtag("event", "prompt_view", {
          prompt_id: event.prompt_id,
          category: event.category,
        });
        break;
      case "prompt_like":
        window.gtag("event", "prompt_like", { prompt_id: event.prompt_id });
        break;
      case "prompt_save":
        window.gtag("event", "prompt_save", { prompt_id: event.prompt_id });
        break;
      case "prompt_share":
        window.gtag("event", "share", {
          content_type: "prompt",
          item_id: event.prompt_id,
          method: event.method,
        });
        break;
      case "comment_create":
        window.gtag("event", "comment_create", { prompt_id: event.prompt_id });
        break;
      case "user_follow":
        window.gtag("event", "user_follow", { target_user_id: event.target_user_id });
        break;
      case "user_unfollow":
        window.gtag("event", "user_unfollow", { target_user_id: event.target_user_id });
        break;
      case "search":
        window.gtag("event", "search", {
          search_term: event.search_term,
          results_count: event.results_count,
        });
        break;
      case "profile_edit":
        window.gtag("event", "profile_edit", { section: event.section });
        break;
      case "explore_filter":
        window.gtag("event", "explore_filter", {
          filter_type: event.filter_type,
          filter_value: event.filter_value,
        });
        break;
      case "navigation":
        window.gtag("event", "navigation", {
          from: event.from,
          to: event.to,
        });
        break;
      case "error":
        window.gtag("event", "exception", {
          description: event.error_message,
          fatal: false,
          page: event.error_page,
        });
        break;
    }
  }

  // Clarity Custom Tags
  if (window.clarity) {
    window.clarity("event", event.type);
  }
};

/**
 * Identify user in Clarity (for session replay context)
 */
export const identifyUser = (
  userId: string,
  userProperties?: {
    username?: string;
    email?: string;
    plan?: string;
    signupDate?: string;
  }
): void => {
  if (!isAnalyticsEnabled()) return;

  // Clarity User Identification
  if (window.clarity) {
    window.clarity("identify", userId, userProperties?.username);
    
    if (userProperties) {
      // Set custom tags for better segmentation
      if (userProperties.plan) {
        window.clarity("set", "user_plan", userProperties.plan);
      }
      if (userProperties.signupDate) {
        window.clarity("set", "signup_date", userProperties.signupDate);
      }
    }
  }

  // GA4 User Properties
  if (window.gtag) {
    window.gtag("set", "user_properties", {
      user_id: userId,
      ...userProperties,
    });
  }
};

/**
 * Track conversion/goal completion
 */
export const trackConversion = (
  conversionName: string,
  value?: number,
  currency = "USD"
): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag("event", "conversion", {
    send_to: process.env.NEXT_PUBLIC_GA_ID,
    value: value || 0,
    currency,
    transaction_id: `${conversionName}_${Date.now()}`,
  });
};

/**
 * Track timing/performance metrics
 */
export const trackTiming = (
  name: string,
  value: number,
  category = "Performance"
): void => {
  if (!isAnalyticsEnabled() || !window.gtag) return;

  window.gtag("event", "timing_complete", {
    name,
    value: Math.round(value),
    event_category: category,
  });
};

/**
 * Track error/exception
 */
export const trackError = (
  error: Error | string,
  fatal = false,
  context?: Record<string, unknown>
): void => {
  if (!isAnalyticsEnabled()) return;

  const errorMessage = typeof error === "string" ? error : error.message;

  if (window.gtag) {
    window.gtag("event", "exception", {
      description: errorMessage,
      fatal,
      ...context,
    });
  }

  if (window.clarity) {
    window.clarity("event", "error", { message: errorMessage, ...context });
  }
};
