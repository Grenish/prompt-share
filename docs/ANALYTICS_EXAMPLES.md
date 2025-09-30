# Analytics Implementation Examples

Example implementations for adding analytics tracking to existing components. Copy and adapt these patterns to your actual components.

## Example 1: Track Login/Signup Actions

**File:** `app/(afterAuth)/(auth)/login/page.tsx` or `signup/page.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function LoginPage() {
  const { trackUserAction } = useAnalytics();

  const handleLogin = async (formData: FormData) => {
    try {
      // Your existing login logic
      await login(formData);
      
      // Track successful login
      trackUserAction({
        type: "login",
        method: "email",
      });
    } catch (error) {
      // Track error
      trackUserAction({
        type: "error",
        error_message: "Login failed",
        error_page: "/login",
      });
    }
  };

  return (
    <form action={handleLogin}>
      {/* form fields */}
    </form>
  );
}
```

## Example 2: Track Prompt Views

**File:** `app/(afterAuth)/home/posts/[postId]/page.tsx`

```tsx
import { useEffect } from "react";
import { useAnalytics, useTimeOnPage, useScrollDepthTracking } from "@/hooks/use-analytics";

export default function PostDetailPage({ params }: { params: { postId: string } }) {
  const { trackUserAction } = useAnalytics();
  
  // Automatically track time spent on this post
  useTimeOnPage(`post-${params.postId}`);
  
  // Track scroll depth (engagement metric)
  useScrollDepthTracking(`post-${params.postId}`);

  useEffect(() => {
    // Track when user views a prompt
    trackUserAction({
      type: "prompt_view",
      prompt_id: params.postId,
      category: "general", // You can get this from post data
    });
  }, [params.postId, trackUserAction]);

  return (
    <div>Post content</div>
  );
}
```

## Example 3: Track Like/Save/Share Actions

**File:** `components/promptCard-show.tsx` or similar

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function PromptCard({ post }: { post: any }) {
  const { trackUserAction } = useAnalytics();

  const handleLike = async () => {
    try {
      await likePost(post.id);
      trackUserAction({
        type: "prompt_like",
        prompt_id: post.id,
      });
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  const handleSave = async () => {
    try {
      await savePost(post.id);
      trackUserAction({
        type: "prompt_save",
        prompt_id: post.id,
      });
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleShare = async (method: string) => {
    trackUserAction({
      type: "prompt_share",
      prompt_id: post.id,
      method, // "twitter", "copy", "facebook", etc.
    });
  };

  return (
    <div>
      <button onClick={handleLike}>Like</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={() => handleShare("copy")}>Share</button>
    </div>
  );
}
```

## Example 4: Track Prompt Creation

**File:** `app/(afterAuth)/home/create/page.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function CreatePromptPage() {
  const { trackUserAction } = useAnalytics();

  const handleCreatePrompt = async (formData: FormData) => {
    try {
      const category = formData.get("category") as string;
      const model = formData.get("model") as string;
      
      await createPrompt(formData);
      
      // Track successful creation
      trackUserAction({
        type: "prompt_create",
        category,
        model,
      });
    } catch (error) {
      trackUserAction({
        type: "error",
        error_message: "Failed to create prompt",
        error_page: "/home/create",
      });
    }
  };

  return (
    <form action={handleCreatePrompt}>
      {/* form fields */}
    </form>
  );
}
```

## Example 5: Track Comments

**File:** `components/post/comment-box.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function CommentBox({ postId }: { postId: string }) {
  const { trackUserAction } = useAnalytics();

  const handleComment = async (text: string) => {
    try {
      await createComment(postId, text);
      
      trackUserAction({
        type: "comment_create",
        prompt_id: postId,
      });
    } catch (error) {
      console.error("Comment failed", error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const text = e.currentTarget.comment.value;
      handleComment(text);
    }}>
      <textarea name="comment" />
      <button type="submit">Comment</button>
    </form>
  );
}
```

## Example 6: Track Follow/Unfollow

**File:** `components/profile/follow-button.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function FollowButton({ userId }: { userId: string }) {
  const { trackUserAction } = useAnalytics();

  const handleFollow = async () => {
    try {
      await followUser(userId);
      
      trackUserAction({
        type: "user_follow",
        target_user_id: userId,
      });
    } catch (error) {
      console.error("Follow failed", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(userId);
      
      trackUserAction({
        type: "user_unfollow",
        target_user_id: userId,
      });
    } catch (error) {
      console.error("Unfollow failed", error);
    }
  };

  return (
    <button onClick={handleFollow}>Follow</button>
  );
}
```

## Example 7: Track Search

**File:** Wherever search is implemented

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function SearchComponent() {
  const { trackUserAction } = useAnalytics();

  const handleSearch = async (query: string) => {
    const results = await searchPrompts(query);
    
    trackUserAction({
      type: "search",
      search_term: query,
      results_count: results.length,
    });
  };

  return (
    <input
      type="search"
      onChange={(e) => handleSearch(e.target.value)}
    />
  );
}
```

## Example 8: Track Explore Filters

**File:** `app/(afterAuth)/home/explore/page.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function ExplorePage() {
  const { trackUserAction } = useAnalytics();

  const handleFilterChange = (filterType: string, filterValue: string) => {
    trackUserAction({
      type: "explore_filter",
      filter_type: filterType, // "category", "model", "tag", etc.
      filter_value: filterValue,
    });
  };

  return (
    <div>
      <select onChange={(e) => handleFilterChange("category", e.target.value)}>
        <option value="all">All Categories</option>
        <option value="productivity">Productivity</option>
      </select>
    </div>
  );
}
```

## Example 9: Track Profile Edits

**File:** `components/profile/profile-edit-dialog.tsx`

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";

export default function ProfileEditDialog() {
  const { trackUserAction } = useAnalytics();

  const handleSaveProfile = async (section: string) => {
    try {
      await updateProfile();
      
      trackUserAction({
        type: "profile_edit",
        section, // "bio", "avatar", "username", etc.
      });
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };

  return (
    <form onSubmit={() => handleSaveProfile("bio")}>
      {/* form fields */}
    </form>
  );
}
```

## Example 10: Track Errors Globally

**File:** `app/error.tsx` (Error Boundary)

```tsx
"use client";

import { useEffect } from "react";
import { trackError } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackError(error, true, {
      digest: error.digest,
      page: window.location.pathname,
    });
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Example 11: Server Action with Client-side Tracking

**File:** `util/actions/postsActions.ts`

```tsx
"use server";

export async function likePostAction(postId: string) {
  try {
    const result = await db.likePost(postId);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to like post" };
  }
}
```

Then in your client component:

```tsx
const handleLike = async () => {
  const result = await likePostAction(postId);
  
  if (result.success) {
    trackUserAction({
      type: "prompt_like",
      prompt_id: postId,
    });
  } else {
    trackUserAction({
      type: "error",
      error_message: result.error,
      error_page: window.location.pathname,
    });
  }
};
```

## Tips

1. **Always track in Client Components** - Use `"use client"` directive
2. **Track after success** - Only track events after operations succeed
3. **Track errors** - Don't forget error tracking for debugging
4. **Be consistent** - Use the same event names across the app
5. **Test in development** - Check console logs to verify events fire
