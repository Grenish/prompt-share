# Analytics Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js Application                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    app/layout.tsx (Root)                     │   │
│  │                                                               │   │
│  │  1. Get user from Supabase                                   │   │
│  │  2. Normalize user data                                      │   │
│  │  3. Pass to AnalyticsProvider                                │   │
│  └────────────────────────┬────────────────────────────────────┘   │
│                            │                                          │
│                            ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          components/AnalyticsProvider.tsx                    │   │
│  │                                                               │   │
│  │  • Auto page view tracking (usePageViewTracking)             │   │
│  │  • User identification (useIdentifyUser)                     │   │
│  │  • Development logging                                       │   │
│  └─────────────────────┬─────────┬─────────────────────────────┘   │
│                        │         │                                   │
│         ┌──────────────┘         └──────────────┐                   │
│         ▼                                        ▼                   │
│  ┌─────────────────┐                  ┌─────────────────┐          │
│  │  GA4Provider    │                  │  ClarityInit    │          │
│  │                 │                  │                 │          │
│  │  • Initialize   │                  │  • Lazy load    │          │
│  │  • Debug mode   │                  │  • On scroll    │          │
│  │  • Event log    │                  │  • 3s fallback  │          │
│  └────────┬────────┘                  └────────┬────────┘          │
│           │                                     │                    │
│           └─────────────┬───────────────────────┘                    │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │         External Services                 │
        │                                           │
        │  ┌──────────────────┐  ┌──────────────┐ │
        │  │ Google Analytics │  │   Microsoft  │ │
        │  │       (GA4)      │  │   Clarity    │ │
        │  │                  │  │              │ │
        │  │  • Events        │  │  • Sessions  │ │
        │  │  • Conversions   │  │  • Heatmaps  │ │
        │  │  • Reports       │  │  • Replays   │ │
        │  └──────────────────┘  └──────────────┘ │
        └─────────────────────────────────────────┘
```

## 🔄 Event Tracking Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                     User Interaction                               │
│  (Button click, form submit, navigation, etc.)                    │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Client Component                                │
│                                                                    │
│  import { useAnalytics } from "@/hooks/use-analytics"            │
│  const { trackUserAction } = useAnalytics()                      │
│                                                                    │
│  trackUserAction({                                                │
│    type: "prompt_like",                                           │
│    prompt_id: "123"                                               │
│  })                                                                │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                hooks/use-analytics.ts                              │
│                                                                    │
│  • Validate event structure                                       │
│  • Check if analytics enabled                                     │
│  • Forward to core analytics                                      │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                 lib/analytics.ts                                   │
│                                                                    │
│  • trackUserEvent(event)                                          │
│  • Check analytics enabled                                        │
│  • Format event data                                              │
└───────────┬──────────────────────────────────┬────────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────────┐
│   window.gtag()     │          │   window.clarity()      │
│                     │          │                         │
│  Send to GA4        │          │  Send to Clarity        │
│  • Event name       │          │  • Custom event         │
│  • Parameters       │          │  • Session context      │
│  • User properties  │          │  • Page context         │
└─────────────────────┘          └─────────────────────────┘
```

## 📦 Component Usage Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                      Your Component                              │
│                                                                  │
│  "use client"                                                    │
│                                                                  │
│  import { useAnalytics } from "@/hooks/use-analytics"          │
│                                                                  │
│  export default function PromptCard({ post }) {                 │
│    const { trackUserAction } = useAnalytics()                  │
│                                                                  │
│    const handleLike = async () => {                             │
│      // Your business logic                                     │
│      await likePost(post.id)                                    │
│                                                                  │
│      // Track the event                                         │
│      trackUserAction({                                          │
│        type: "prompt_like",                                     │
│        prompt_id: post.id                                       │
│      })                                                          │
│    }                                                             │
│                                                                  │
│    return <button onClick={handleLike}>Like</button>           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Hook Options

```
┌──────────────────────────────────────────────────────────────────┐
│                     Available Hooks                               │
│                                                                   │
│  1. useAnalytics()                                               │
│     ├─ trackUserAction(event)    // Track any user event        │
│     └─ trackCustomEvent(event)   // Track custom GA4 event      │
│                                                                   │
│  2. usePageViewTracking()                                        │
│     └─ Auto-tracks page views on route changes                  │
│                                                                   │
│  3. useIdentifyUser(userId, properties)                          │
│     └─ Identifies user for session tracking                     │
│                                                                   │
│  4. useTimeOnPage(pageName)                                      │
│     └─ Tracks time spent on page                                │
│                                                                   │
│  5. useScrollDepthTracking(pageName)                             │
│     └─ Tracks scroll depth (25%, 50%, 75%, 100%)                │
│                                                                   │
│  6. useVisibilityTracking(ref, eventName, threshold)             │
│     └─ Tracks when element becomes visible                      │
└──────────────────────────────────────────────────────────────────┘
```

## 🎨 Event Types Hierarchy

```
UserEvent (Union Type)
│
├─ Authentication Events
│  ├─ sign_up    { method: string }
│  ├─ login      { method: string }
│  └─ logout     {}
│
├─ Content Events
│  ├─ prompt_create  { category: string, model: string }
│  ├─ prompt_view    { prompt_id: string, category: string }
│  ├─ prompt_like    { prompt_id: string }
│  ├─ prompt_save    { prompt_id: string }
│  └─ prompt_share   { prompt_id: string, method: string }
│
├─ Social Events
│  ├─ comment_create  { prompt_id: string }
│  ├─ user_follow     { target_user_id: string }
│  └─ user_unfollow   { target_user_id: string }
│
├─ Discovery Events
│  ├─ search         { search_term: string, results_count: number }
│  └─ explore_filter { filter_type: string, filter_value: string }
│
├─ User Actions
│  ├─ profile_edit { section: string }
│  └─ navigation   { from: string, to: string }
│
├─ System Events
│  ├─ page_view { page_path: string, page_title: string }
│  └─ error     { error_message: string, error_page: string }
```

## 🔐 Data Flow for User Identification

```
Server (app/layout.tsx)
│
├─ Get user from Supabase
│  └─ const { data: { user } } = await supabase.auth.getUser()
│
├─ Normalize user data
│  └─ const normalizedUser = normalizeUser(user)
│
└─ Pass to AnalyticsProvider
   └─ <AnalyticsProvider userId={...} userProperties={...} />
          │
          ▼
Client (AnalyticsProvider)
│
├─ useIdentifyUser(userId, properties)
│  │
│  └─ lib/analytics.ts → identifyUser()
│     │
│     ├─ window.clarity("identify", userId, username)
│     │  └─ Links Clarity sessions to user
│     │
│     └─ window.gtag("set", "user_properties", {...})
│        └─ Links GA4 events to user
```

## 📊 Data Collection Points

```
Application Flow
│
├─ Page Load
│  └─ usePageViewTracking() → Auto-track page view
│
├─ User Authentication
│  ├─ Sign Up → trackUserAction({ type: "sign_up" })
│  ├─ Login   → trackUserAction({ type: "login" })
│  └─ Logout  → trackUserAction({ type: "logout" })
│
├─ Content Interaction
│  ├─ View Prompt  → trackUserAction({ type: "prompt_view" })
│  ├─ Create       → trackUserAction({ type: "prompt_create" })
│  ├─ Like         → trackUserAction({ type: "prompt_like" })
│  ├─ Save         → trackUserAction({ type: "prompt_save" })
│  └─ Share        → trackUserAction({ type: "prompt_share" })
│
├─ Social Interaction
│  ├─ Comment → trackUserAction({ type: "comment_create" })
│  ├─ Follow  → trackUserAction({ type: "user_follow" })
│  └─ Unfollow → trackUserAction({ type: "user_unfollow" })
│
├─ Discovery
│  ├─ Search → trackUserAction({ type: "search" })
│  └─ Filter → trackUserAction({ type: "explore_filter" })
│
└─ Engagement Metrics
   ├─ Time on page → useTimeOnPage()
   ├─ Scroll depth → useScrollDepthTracking()
   └─ Element visibility → useVisibilityTracking()
```

## 🌐 Production vs Development

```
Development Mode
│
├─ Console Logging Enabled
│  ├─ Analytics initialization status
│  ├─ Every event logged
│  ├─ User identification logged
│  └─ Error details shown
│
├─ Debug Mode Active
│  └─ GA4 events visible in console
│
└─ Warnings for Missing Config
   └─ "GA4 Measurement ID not configured"

────────────────────────────────────

Production Mode
│
├─ Console Logging Disabled
│  └─ Clean console output
│
├─ Events Sent Silently
│  └─ No debug output
│
└─ Optimized Performance
   ├─ Lazy loading
   ├─ Event batching
   └─ Minimal overhead
```

## 🎯 Implementation Checklist Visualization

```
Setup Phase
│
├─ [✅] Core files created
│  ├─ lib/analytics.ts
│  ├─ hooks/use-analytics.ts
│  ├─ components/AnalyticsProvider.tsx
│  ├─ components/GA4Provider.tsx
│  └─ components/ClarityInit.tsx
│
├─ [✅] Root layout updated
│  └─ app/layout.tsx
│
└─ [✅] Documentation created
   ├─ ANALYTICS_INTEGRATION.md
   ├─ ANALYTICS_EXAMPLES.md
   ├─ ANALYTICS_QUICK_REFERENCE.md
   └─ ANALYTICS_SUMMARY.md

────────────────────────────────────

Configuration Phase (Your Team)
│
├─ [ ] Add GA4 ID to .env.local
├─ [ ] Add Clarity ID to .env.local
├─ [ ] Test in development
└─ [ ] Verify in dashboards

────────────────────────────────────

Implementation Phase (Your Team)
│
├─ [ ] Authentication tracking
│  ├─ Login
│  ├─ Signup
│  └─ Logout
│
├─ [ ] Content tracking
│  ├─ Prompt views
│  ├─ Prompt creation
│  ├─ Likes
│  ├─ Saves
│  └─ Shares
│
├─ [ ] Social tracking
│  ├─ Comments
│  ├─ Follows
│  └─ Unfollows
│
└─ [ ] Discovery tracking
   ├─ Search
   └─ Filters
```

This visual architecture should help your team understand how everything fits together! 🎨
