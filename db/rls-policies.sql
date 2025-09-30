-- ============================================================================
-- Row Level Security (RLS) Policies for prompt-share
-- ============================================================================
-- This file contains recommended RLS policies to secure your Supabase database
-- Run these SQL commands in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. PROFILES TABLE POLICIES
-- ============================================================================

-- Public profiles are viewable by everyone (authenticated and anonymous)
CREATE POLICY "Public profiles viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can insert their own profile (triggered by auth.users insert)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Users can delete their own profile (soft delete recommended)
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- ============================================================================
-- 3. POSTS TABLE POLICIES
-- ============================================================================

-- Anyone (authenticated or anonymous) can view published posts
CREATE POLICY "Anyone can view published posts"
  ON posts FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author);

-- Users can only update their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author)
  WITH CHECK ((SELECT auth.uid()) = author);

-- Users can only delete their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author);

-- ============================================================================
-- 4. POST LIKES TABLE POLICIES
-- ============================================================================

-- Anyone can view likes (to show like counts)
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can only remove their own likes
CREATE POLICY "Users can remove own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 5. POST SAVES TABLE POLICIES
-- ============================================================================

-- Users can only view their own saved posts
CREATE POLICY "Users can view own saved posts"
  ON post_saves FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can save posts
CREATE POLICY "Users can save posts"
  ON post_saves FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can unsave their own posts
CREATE POLICY "Users can unsave own posts"
  ON post_saves FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 6. POST COMMENTS TABLE POLICIES
-- ============================================================================

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON post_comments FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 7. POST_TAGS & TAGS TABLE POLICIES
-- ============================================================================

-- Anyone can view tags
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can create new tags
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone can view post-tag relationships
CREATE POLICY "Anyone can view post tags"
  ON post_tags FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only post authors can add tags to their posts
CREATE POLICY "Post authors can add tags"
  ON post_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author = (SELECT auth.uid())
    )
  );

-- Only post authors can remove tags from their posts
CREATE POLICY "Post authors can remove tags"
  ON post_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_tags.post_id 
      AND posts.author = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 8. WAITLIST TABLE POLICIES
-- ============================================================================

-- Only admins/service role can view waitlist
-- No public read access to prevent email harvesting
CREATE POLICY "Service role can view waitlist"
  ON waitlist FOR SELECT
  TO service_role
  USING (true);

-- Anyone can join waitlist (insert only)
CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- 9. NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- System/authenticated users can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 10. FOLLOWS TABLE POLICIES
-- ============================================================================

-- Anyone can view follow relationships
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow others"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = follower_id);

-- Users can only unfollow themselves
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = follower_id);

-- ============================================================================
-- 11. STORAGE BUCKET POLICIES (avatars)
-- ============================================================================

-- Avatar images are publicly accessible
CREATE POLICY "Avatar images publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars to their own folder
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Users can update their own avatars
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ((storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK ((storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ((storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- ============================================================================
-- 12. STORAGE BUCKET POLICIES (postsBucket)
-- ============================================================================

-- Post images are publicly accessible
CREATE POLICY "Post images publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'postsBucket');

-- Authenticated users can upload post media to their own folder
CREATE POLICY "Users can upload post media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'postsBucket' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

-- Users can delete their own post media
CREATE POLICY "Users can delete own post media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ((storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- ============================================================================
-- 13. PERFORMANCE INDEXES
-- ============================================================================
-- Add these indexes to improve RLS query performance

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts USING btree (author);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_composite ON post_likes USING btree (post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON post_saves USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_composite ON post_saves USING btree (post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags USING btree (tag_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles USING btree (username);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows USING btree (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows USING btree (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_composite ON follows USING btree (follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications USING btree (user_id, is_read);

-- ============================================================================
-- 14. VERIFY RLS IS ENABLED
-- ============================================================================
-- Run this query to verify RLS is enabled on all tables

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 15. TEST RLS POLICIES (Optional)
-- ============================================================================
-- Test as authenticated user to verify policies work correctly

-- Set local role to test
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims TO '{"sub": "test-user-uuid", "role": "authenticated"}';

-- Test queries here
-- SELECT * FROM profiles;
-- SELECT * FROM posts;

-- Reset role
-- RESET ROLE;

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
