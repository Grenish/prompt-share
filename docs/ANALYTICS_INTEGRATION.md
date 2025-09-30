# Analytics Integration - GA4 & Microsoft Clarity

Complete guide for Google Analytics 4 and Microsoft Clarity integration in the AI Cookbook application.

## 📊 Overview

This implementation provides:
- **Google Analytics 4 (GA4)**: Comprehensive event tracking, user behavior, conversions
- **Microsoft Clarity**: Session recordings, heatmaps, user journey analysis
- **Type-safe tracking**: Full TypeScript support with predefined event types
- **React hooks**: Easy-to-use hooks for component-level tracking
- **Automatic tracking**: Page views, scroll depth, time on page
- **User identification**: Link sessions to authenticated users

## 🚀 Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_project_id
```

### 2. Get Your IDs

**Google Analytics 4:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or use existing
3. Navigate to Admin → Data Streams → Web
4. Copy the Measurement ID (format: G-XXXXXXXXXX)

**Microsoft Clarity:**
1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Create a new project
3. Copy the Project ID from Settings

## 📁 File Structure

```
lib/
  analytics.ts          # Core analytics functions
hooks/
  use-analytics.ts      # React hooks for tracking
components/
  AnalyticsProvider.tsx # Main provider component
  GA4Provider.tsx       # GA4 initialization
  ClarityInit.tsx       # Clarity initialization
```

## 🎯 Usage Examples

### Automatic Tracking (Already Integrated)

Page views and user identification happen automatically via `AnalyticsProvider` in root layout.

### Track User Actions

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function MyComponent() {
  const { trackUserAction } = useAnalytics();

  const handleLike = (postId: string) => {
    trackUserAction({
      type: "prompt_like",
      prompt_id: postId,
    });
  };

  return <button onClick={() => handleLike("123")}>Like</button>;
}
```

### Track Custom Events

```tsx
import { useAnalytics } from "@/hooks/use-analytics";

export default function SearchComponent() {
  const { trackCustomEvent } = useAnalytics();

  const handleSearch = (query: string, results: number) => {
    trackCustomEvent({
      action: "search_performed",
      category: "Search",
      label: query,
      value: results,
    });
  };
}
```

### Track Time on Page

```tsx
import { useTimeOnPage } from "@/hooks/use-analytics";

export default function ArticlePage() {
  useTimeOnPage("article-page");

  return <div>Content...</div>;
}
```

### Track Scroll Depth

```tsx
import { useScrollDepthTracking } from "@/hooks/use-analytics";

export default function LongContentPage() {
  useScrollDepthTracking("long-content-page");

  return <div>Long content...</div>;
}
```

### Track Element Visibility

```tsx
import { useRef } from "react";
import { useVisibilityTracking } from "@/hooks/use-analytics";

export default function CTAComponent() {
  const ctaRef = useRef<HTMLDivElement>(null);
  useVisibilityTracking(ctaRef, "cta-section-visible");

  return <div ref={ctaRef}>Call to Action</div>;
}
```

## 📋 Predefined Events

### User Events

All these events are tracked automatically when you use the corresponding actions:

- `sign_up` - User registration
- `login` - User authentication
- `logout` - User sign out
- `prompt_create` - New prompt created
- `prompt_view` - Prompt viewed
- `prompt_like` - Prompt liked
- `prompt_save` - Prompt saved
- `prompt_share` - Prompt shared
- `comment_create` - Comment added
- `user_follow` - User followed
- `user_unfollow` - User unfollowed
- `search` - Search performed
- `profile_edit` - Profile updated
- `explore_filter` - Explore page filtered
- `navigation` - Navigation between pages
- `error` - Error occurred

### Implementation in Server Actions

```tsx
// util/actions/postsActions.ts
"use server";

import { trackUserEvent } from "@/lib/analytics";

export async function likePost(postId: string) {
  // Your database logic here
  
  // Track the event
  trackUserEvent({
    type: "prompt_like",
    prompt_id: postId,
  });
}
```

### Implementation in Client Components

```tsx
// components/LikeButton.tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function LikeButton({ postId }: { postId: string }) {
  const { trackUserAction } = useAnalytics();

  const handleLike = async () => {
    await likePost(postId);
    
    trackUserAction({
      type: "prompt_like",
      prompt_id: postId,
    });
  };

  return <button onClick={handleLike}>Like</button>;
}
```

## 🎨 Recommended Tracking Points

### Authentication Flow
```tsx
// After successful login
trackUserEvent({ type: "login", method: "email" });

// After successful signup
trackUserEvent({ type: "sign_up", method: "email" });

// After logout
trackUserEvent({ type: "logout" });
```

### Content Interaction
```tsx
// When user views a prompt
trackUserEvent({
  type: "prompt_view",
  prompt_id: "123",
  category: "productivity",
});

// When user creates a prompt
trackUserEvent({
  type: "prompt_create",
  category: "productivity",
  model: "chatgpt",
});

// When user shares a prompt
trackUserEvent({
  type: "prompt_share",
  prompt_id: "123",
  method: "twitter",
});
```

### Social Interactions
```tsx
// When user follows someone
trackUserEvent({
  type: "user_follow",
  target_user_id: "user-123",
});

// When user comments
trackUserEvent({
  type: "comment_create",
  prompt_id: "post-123",
});
```

### Search & Discovery
```tsx
// When user searches
trackUserEvent({
  type: "search",
  search_term: "productivity prompts",
  results_count: 42,
});

// When user applies filters
trackUserEvent({
  type: "explore_filter",
  filter_type: "category",
  filter_value: "productivity",
});
```

## 🔍 Debugging

### Development Mode

In development, analytics events are logged to console:

```
📊 Analytics Status: {
  GA4: "✅ Enabled",
  Clarity: "✅ Enabled",
  UserTracking: "✅ User: 123"
}

📊 GA4 Event: ["event", "prompt_view", { prompt_id: "123" }]
```

### Check Console

Open browser console to see:
- Analytics initialization status
- Events being tracked (dev mode only)
- Any errors in tracking

### Verify in Dashboards

**Google Analytics:**
1. Go to GA4 Dashboard
2. Navigate to Reports → Realtime
3. Perform actions in your app
4. See events appear in realtime

**Microsoft Clarity:**
1. Go to Clarity Dashboard
2. Navigate to Recordings
3. Find your session
4. Watch session replay with events

## 🎯 GA4 Custom Reports

### Recommended Events to Monitor

1. **User Engagement**
   - Page views per session
   - Time on page
   - Scroll depth

2. **Content Performance**
   - Most viewed prompts
   - Most liked prompts
   - Most shared prompts

3. **Conversion Tracking**
   - Sign up completion
   - Prompt creation rate
   - User engagement rate

4. **User Journey**
   - Navigation patterns
   - Drop-off points
   - Feature adoption

## 🔐 Privacy & Compliance

### GDPR Compliance

1. **Consent Management**: Implement cookie consent banner (recommended: use a library like `react-cookie-consent`)
2. **IP Anonymization**: GA4 does this by default
3. **Data Retention**: Configure in GA4 settings (Admin → Data Settings)

### Microsoft Clarity

1. **Session Masking**: Clarity automatically masks sensitive input fields
2. **Disable on Certain Pages**: Conditionally load Clarity based on user consent

### Example Consent Implementation

```tsx
// components/CookieConsent.tsx
"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("analytics-consent");
    if (stored) setConsent(stored === "true");
  }, []);

  const handleAccept = () => {
    localStorage.setItem("analytics-consent", "true");
    setConsent(true);
    window.location.reload(); // Reload to initialize analytics
  };

  const handleDecline = () => {
    localStorage.setItem("analytics-consent", "false");
    setConsent(false);
  };

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="container flex items-center justify-between">
        <p>We use cookies to improve your experience.</p>
        <div className="flex gap-2">
          <button onClick={handleDecline}>Decline</button>
          <button onClick={handleAccept}>Accept</button>
        </div>
      </div>
    </div>
  );
}
```

## 🚦 Performance Optimization

### Current Optimizations

1. **Lazy Loading**: Clarity loads on first scroll (or after 3s)
2. **Production Only**: Analytics only active in production
3. **Event Batching**: GA4 batches events automatically
4. **Minimal Bundle**: Uses Next.js third-party integration

### Monitoring Performance

```tsx
import { trackTiming } from "@/lib/analytics";

// Track custom performance metrics
const startTime = performance.now();
await someExpensiveOperation();
const duration = performance.now() - startTime;

trackTiming("expensive_operation", duration, "Performance");
```

## 📊 Dashboard Setup

### GA4 Recommended Setup

1. **Custom Events**
   - Configure all custom events as conversions
   - Set up event parameters for better segmentation

2. **Audiences**
   - Active users (visited in last 7 days)
   - Engaged users (3+ sessions)
   - Prompt creators (created_prompt event)

3. **Funnels**
   - Sign up funnel
   - Prompt creation funnel
   - Engagement funnel

### Clarity Recommended Setup

1. **Session Filters**
   - Filter by user type (authenticated vs anonymous)
   - Filter by page
   - Filter by custom tags

2. **Heatmaps**
   - Enable on key pages (home, explore, profile)
   - Track click patterns
   - Identify UI issues

## 🐛 Troubleshooting

### Analytics Not Loading

1. Check environment variables are set
2. Verify IDs are correct (no typos)
3. Check browser console for errors
4. Disable ad blockers (they block analytics)

### Events Not Tracking

1. Verify analytics is initialized (check console)
2. Ensure `trackUserEvent` is called client-side
3. Check GA4 DebugView for event details
4. Wait 24-48 hours for reports (realtime works immediately)

### TypeScript Errors

1. Ensure all event types match the `UserEvent` union type
2. Check that analytics functions are imported correctly
3. Verify `Window` interface extensions are loaded

## 📚 Additional Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Microsoft Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- [Next.js Analytics Integration](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

## ✅ Checklist

- [ ] Add GA4 ID to environment variables
- [ ] Add Clarity Project ID to environment variables
- [ ] Test in development (check console logs)
- [ ] Verify events in GA4 DebugView
- [ ] Check session recordings in Clarity
- [ ] Implement cookie consent (if required)
- [ ] Set up custom reports in GA4
- [ ] Configure conversion events
- [ ] Test with real users
- [ ] Monitor for errors

## 🎉 You're All Set!

Your analytics integration is now complete. All user behavior will be tracked automatically, and you have full control over custom event tracking throughout your application.
