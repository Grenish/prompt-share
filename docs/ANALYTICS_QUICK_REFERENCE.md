# Analytics Quick Reference

## 🚀 Quick Start

### 1. Add Environment Variables
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_project_id
```

### 2. Import the Hook
```tsx
import { useAnalytics } from "@/hooks/use-analytics";
```

### 3. Track Events
```tsx
const { trackUserAction } = useAnalytics();

trackUserAction({
  type: "prompt_like",
  prompt_id: "123",
});
```

---

## 📊 Available Events

| Event | When to Use | Required Fields |
|-------|-------------|----------------|
| `page_view` | Auto-tracked | `page_path`, `page_title` |
| `sign_up` | User registers | `method` |
| `login` | User logs in | `method` |
| `logout` | User logs out | none |
| `prompt_create` | New prompt created | `category`, `model` |
| `prompt_view` | Prompt opened/viewed | `prompt_id`, `category` |
| `prompt_like` | Prompt liked | `prompt_id` |
| `prompt_save` | Prompt saved | `prompt_id` |
| `prompt_share` | Prompt shared | `prompt_id`, `method` |
| `comment_create` | Comment posted | `prompt_id` |
| `user_follow` | User followed | `target_user_id` |
| `user_unfollow` | User unfollowed | `target_user_id` |
| `search` | Search performed | `search_term`, `results_count` |
| `profile_edit` | Profile updated | `section` |
| `explore_filter` | Filter applied | `filter_type`, `filter_value` |
| `navigation` | Important nav | `from`, `to` |
| `error` | Error occurred | `error_message`, `error_page` |

---

## 💡 Common Patterns

### Track Button Click
```tsx
<button onClick={() => trackUserAction({ 
  type: "prompt_like", 
  prompt_id: postId 
})}>
  Like
</button>
```

### Track After Async Operation
```tsx
const handleSave = async () => {
  const result = await savePost(postId);
  if (result.success) {
    trackUserAction({ type: "prompt_save", prompt_id: postId });
  }
};
```

### Track Form Submission
```tsx
const handleSubmit = async (data: FormData) => {
  try {
    await createPrompt(data);
    trackUserAction({ 
      type: "prompt_create",
      category: data.get("category") as string,
      model: data.get("model") as string,
    });
  } catch (error) {
    trackUserAction({
      type: "error",
      error_message: "Failed to create prompt",
      error_page: "/create",
    });
  }
};
```

---

## 🎯 Priority Events to Implement

### High Priority (Implement First)
- [ ] `sign_up` - User registration
- [ ] `login` - User login
- [ ] `prompt_create` - New prompt created
- [ ] `prompt_view` - Prompt viewed
- [ ] `prompt_like` - Prompt liked
- [ ] `prompt_save` - Prompt saved
- [ ] `search` - Search usage

### Medium Priority
- [ ] `comment_create` - Comments
- [ ] `user_follow` - Social interactions
- [ ] `prompt_share` - Sharing
- [ ] `profile_edit` - Profile updates
- [ ] `explore_filter` - Discovery

### Low Priority
- [ ] `navigation` - Complex flows only
- [ ] Custom events for A/B testing

---

## 🔍 Testing

### Check Console (Development)
```
📊 Analytics Status: {
  GA4: "✅ Enabled",
  Clarity: "✅ Enabled"
}
```

### Test Event
```tsx
// Add this temporarily to test
useEffect(() => {
  trackUserAction({ type: "prompt_view", prompt_id: "test-123", category: "test" });
}, []);
```

### Verify in GA4
1. Go to GA4 → Reports → Realtime
2. Perform action in app
3. See event appear within seconds

---

## 🐛 Common Issues

### Events not tracking?
- Check environment variables are set
- Verify you're using the hook in a Client Component (`"use client"`)
- Check browser console for errors
- Disable ad blockers for testing

### TypeScript errors?
- Ensure event type matches `UserEvent` union
- Check all required fields are provided
- Import types from `@/lib/analytics`

---

## 📚 Documentation

- Full Guide: `ANALYTICS_INTEGRATION.md`
- Examples: `ANALYTICS_EXAMPLES.tsx`
- Hook API: `hooks/use-analytics.ts`
- Core Functions: `lib/analytics.ts`

---

## 🎉 Need Help?

1. Check examples in `ANALYTICS_EXAMPLES.tsx`
2. Read full guide in `ANALYTICS_INTEGRATION.md`
3. Look at existing implementations in the codebase
4. Test in development with console.log debugging enabled
