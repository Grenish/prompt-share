# Analytics Integration - Verification Checklist

Use this checklist to verify your analytics integration is working correctly.

## ✅ Pre-Implementation Checklist

### Setup
- [ ] GA4 account created at https://analytics.google.com/
- [ ] GA4 property and data stream configured
- [ ] GA4 Measurement ID obtained (format: G-XXXXXXXXXX)
- [ ] Microsoft Clarity account created at https://clarity.microsoft.com/
- [ ] Clarity project created
- [ ] Clarity Project ID obtained

### Environment Configuration
- [ ] Created/updated `.env.local` file
- [ ] Added `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
- [ ] Added `NEXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id`
- [ ] Restarted development server after adding env vars
- [ ] Verified env vars loaded (check console in dev mode)

### Build Verification
- [ ] Run `bun run build` - compiles successfully
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] All routes build successfully

## 🧪 Development Testing

### Initial Load Test
- [ ] Start dev server (`bun dev`)
- [ ] Open browser console
- [ ] Navigate to homepage
- [ ] See analytics initialization message:
  ```
  📊 Analytics Status: {
    GA4: "✅ Enabled",
    Clarity: "✅ Enabled"
  }
  ```
- [ ] See GA4 loaded message (after scroll or 3s)
- [ ] See Clarity loaded message

### Page View Tracking
- [ ] Navigate to different pages
- [ ] Check console for page view events in dev mode
- [ ] Events show correct page paths

### User Identification (Authenticated)
- [ ] Log in to the application
- [ ] Check console for user identification
- [ ] See `UserTracking: "✅ User: <user-id>"`
- [ ] User properties logged (username, email, signup date)

### Event Tracking (Manual Test)
Add temporary test button:
```tsx
<button onClick={() => {
  trackUserAction({
    type: "prompt_view",
    prompt_id: "test-123",
    category: "test"
  })
}}>
  Test Event
</button>
```
- [ ] Click button
- [ ] See event logged in console
- [ ] Event has correct structure

## 🌐 GA4 Dashboard Verification

### Realtime Reports
- [ ] Open GA4 Dashboard
- [ ] Navigate to Reports → Realtime
- [ ] Perform actions in app
- [ ] See events appear within 30 seconds:
  - [ ] page_view events
  - [ ] Custom events (if implemented)
  - [ ] User count updates

### DebugView (Best for Testing)
- [ ] Navigate to Configure → DebugView
- [ ] Filter by your device/browser
- [ ] Perform actions
- [ ] See detailed event stream:
  - [ ] Event names
  - [ ] Event parameters
  - [ ] User properties
  - [ ] Timestamps

### Event Verification
Test each event type you've implemented:
- [ ] page_view - Navigate pages
- [ ] sign_up - Create test account
- [ ] login - Log in
- [ ] logout - Log out
- [ ] prompt_create - Create a prompt
- [ ] prompt_view - View a prompt
- [ ] prompt_like - Like a prompt
- [ ] prompt_save - Save a prompt
- [ ] prompt_share - Share a prompt
- [ ] comment_create - Add a comment
- [ ] user_follow - Follow a user
- [ ] search - Perform a search
- [ ] explore_filter - Apply a filter
- [ ] error - Trigger an error (safely)

## 🎥 Clarity Dashboard Verification

### Session Recordings
- [ ] Open Clarity Dashboard
- [ ] Navigate to Recordings
- [ ] Find your recent session
- [ ] Play recording
- [ ] See your interactions recorded
- [ ] Custom events visible in timeline

### Heatmaps
- [ ] Navigate to Heatmaps section
- [ ] Select a page (home, explore, etc.)
- [ ] Choose heatmap type:
  - [ ] Click map - Shows where users click
  - [ ] Scroll map - Shows scroll depth
  - [ ] Area map - Shows engagement zones

### Dashboard Metrics
- [ ] Check Dashboard tab
- [ ] Verify metrics are recording:
  - [ ] Active sessions
  - [ ] Page views
  - [ ] Clarity score
  - [ ] Dead clicks
  - [ ] Rage clicks
  - [ ] Quick backs

### Filters (If User Identified)
- [ ] Apply filter: Logged in users
- [ ] Apply filter: Specific page
- [ ] Apply filter: Custom event
- [ ] Filters work correctly

## 🔍 Component Integration Verification

### Authentication Components
Test file: `app/(afterAuth)/(auth)/login/page.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `login` event on success
- [ ] Tracks `error` event on failure
- [ ] Events appear in GA4/Clarity

Test file: `app/(afterAuth)/(auth)/signup/page.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `sign_up` event on success
- [ ] Events appear in GA4/Clarity

### Content Components
Test file: `components/promptCard-show.tsx` or similar
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `prompt_like` on like
- [ ] Tracks `prompt_save` on save
- [ ] Tracks `prompt_share` on share
- [ ] Events appear in GA4/Clarity

Test file: `app/(afterAuth)/home/posts/[postId]/page.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `prompt_view` on load
- [ ] Uses `useTimeOnPage` hook
- [ ] Uses `useScrollDepthTracking` hook
- [ ] Events appear in GA4/Clarity

Test file: `app/(afterAuth)/home/create/page.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `prompt_create` on success
- [ ] Events appear in GA4/Clarity

### Social Components
Test file: `components/post/comment-box.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `comment_create` on submit
- [ ] Events appear in GA4/Clarity

Test file: `components/profile/follow-button.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `user_follow` on follow
- [ ] Tracks `user_unfollow` on unfollow
- [ ] Events appear in GA4/Clarity

### Discovery Components
Test file: Search component (wherever implemented)
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `search` event
- [ ] Includes search term
- [ ] Includes results count
- [ ] Events appear in GA4/Clarity

Test file: `app/(afterAuth)/home/explore/page.tsx`
- [ ] Component exists
- [ ] Imports `useAnalytics`
- [ ] Tracks `explore_filter` on filter change
- [ ] Events appear in GA4/Clarity

## 🚀 Production Readiness

### Privacy & Compliance
- [ ] Cookie consent implemented (if required for region)
- [ ] Privacy policy updated to mention analytics
- [ ] Data retention configured in GA4
- [ ] IP anonymization enabled (GA4 default)
- [ ] Clarity input masking verified

### Performance
- [ ] Analytics loads asynchronously
- [ ] No blocking of main thread
- [ ] Clarity lazy loads on scroll/timer
- [ ] Page load time acceptable
- [ ] No console errors in production build

### Error Handling
- [ ] Analytics gracefully handles missing env vars
- [ ] No errors if GA4/Clarity fails to load
- [ ] Fallbacks work in production
- [ ] Ad blocker scenarios handled

### Security
- [ ] Environment variables not in git
- [ ] Only public keys in client code
- [ ] No sensitive data in events
- [ ] User data properly anonymized

## 📊 Data Quality Verification

### Event Data Integrity
- [ ] All required fields present in events
- [ ] Event names are consistent
- [ ] Parameters have correct types
- [ ] Timestamps are accurate
- [ ] User IDs are consistent

### User Identification
- [ ] Authenticated users identified correctly
- [ ] User properties set properly
- [ ] Sessions linked to users
- [ ] Anonymous users tracked separately

### Data Accuracy
- [ ] Page views match navigation
- [ ] Event counts seem reasonable
- [ ] No duplicate events
- [ ] Timestamps are correct
- [ ] User properties accurate

## 🎯 Advanced Features Verification

### Time Tracking
- [ ] `useTimeOnPage` hook implemented
- [ ] Time values are reasonable (in seconds)
- [ ] Events sent on unmount
- [ ] Values appear in GA4

### Scroll Tracking
- [ ] `useScrollDepthTracking` hook implemented
- [ ] Tracks 25%, 50%, 75%, 100% milestones
- [ ] Each milestone fires only once
- [ ] Values appear in GA4

### Visibility Tracking
- [ ] `useVisibilityTracking` hook implemented
- [ ] Fires when element visible
- [ ] Threshold works correctly
- [ ] Fires only once per element

### Error Tracking
- [ ] Errors tracked automatically
- [ ] Error messages included
- [ ] Page context included
- [ ] Fatal vs non-fatal marked
- [ ] Appears in GA4 exceptions

## 🔄 Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
  - [ ] Analytics loads
  - [ ] Events track
  - [ ] No console errors
- [ ] Firefox
  - [ ] Analytics loads
  - [ ] Events track
  - [ ] No console errors
- [ ] Safari
  - [ ] Analytics loads
  - [ ] Events track
  - [ ] No console errors
- [ ] Mobile browsers
  - [ ] Analytics loads
  - [ ] Events track
  - [ ] No console errors

## 📱 Mobile Testing

- [ ] Test on actual mobile device
- [ ] Analytics loads on mobile
- [ ] Touch events tracked
- [ ] Mobile-specific gestures tracked
- [ ] Performance acceptable on mobile
- [ ] No mobile-specific errors

## 🎨 Edge Cases

### Network Conditions
- [ ] Test with slow connection
- [ ] Test with offline → online
- [ ] Events queued when offline (if applicable)
- [ ] No errors on network failure

### Ad Blockers
- [ ] Test with uBlock Origin
- [ ] Test with AdBlock Plus
- [ ] App still functions normally
- [ ] No console errors
- [ ] Graceful degradation

### User Scenarios
- [ ] Anonymous user (not logged in)
- [ ] Newly signed up user
- [ ] Returning user
- [ ] User who logs out
- [ ] User who switches accounts

## 📝 Documentation Verification

- [ ] README updated (if applicable)
- [ ] Team notified about analytics
- [ ] Documentation shared:
  - [ ] ANALYTICS_INTEGRATION.md
  - [ ] ANALYTICS_EXAMPLES.md
  - [ ] ANALYTICS_QUICK_REFERENCE.md
  - [ ] ANALYTICS_SUMMARY.md
  - [ ] ANALYTICS_ARCHITECTURE.md
- [ ] Setup instructions clear
- [ ] Examples easy to follow

## 🎯 Final Verification

### Development
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Console has no errors
- [ ] TypeScript compiles
- [ ] Lint passes
- [ ] Build succeeds

### Production
- [ ] Deploy to staging
- [ ] Test on staging environment
- [ ] Verify GA4 data collection
- [ ] Verify Clarity recordings
- [ ] Monitor for errors
- [ ] Deploy to production
- [ ] Verify production tracking
- [ ] Monitor for 24-48 hours

## ✨ Success Criteria

Your analytics integration is successful when:
- ✅ No build/runtime errors
- ✅ Events appear in GA4 Realtime within 30 seconds
- ✅ Session recordings appear in Clarity within minutes
- ✅ User identification works for authenticated users
- ✅ Page views tracked automatically
- ✅ Custom events tracked correctly
- ✅ No performance degradation
- ✅ Works across all browsers
- ✅ Handles edge cases gracefully
- ✅ Team can implement new tracking easily

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section in `ANALYTICS_INTEGRATION.md`
2. Verify environment variables
3. Check browser console for errors
4. Test in GA4 DebugView
5. Review Clarity session recordings
6. Check documentation for examples

## 🎉 Completion

Once all items are checked:
- [ ] Mark integration as complete
- [ ] Schedule analytics review meeting
- [ ] Plan for ongoing monitoring
- [ ] Set up alerts for anomalies
- [ ] Document any custom implementations

**Congratulations! Your analytics integration is complete! 🎊**
