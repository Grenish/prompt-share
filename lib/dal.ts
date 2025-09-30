// lib/dal.ts - Data Access Layer with security best practices
'use server'

import { cache } from 'react'
import { createClient } from '@/util/supabase/server'
import { unauthorized } from 'next/navigation'

/**
 * Verify the user session (cached per request)
 * Throws unauthorized() if not authenticated
 */
export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    unauthorized()
  }
  
  return { user, userId: user.id, supabase }
})

/**
 * Get current user (returns null if not authenticated)
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Get user profile with caching
 */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Failed to fetch user profile:', error)
    return null
  }
  
  return data
})

/**
 * Get user posts with engagement counts
 */
export const getUserPosts = cache(async (userId: string, limit = 20) => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      post_likes(count),
      post_comments(count)
    `)
    .eq('author', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Failed to fetch user posts:', error)
    return []
  }
  
  return data
})

/**
 * Check if user can perform action on resource
 */
export async function canUserAccessResource(
  resourceType: 'post' | 'comment' | 'profile',
  resourceId: string
): Promise<boolean> {
  const { user, supabase } = await verifySession()
  
  switch (resourceType) {
    case 'post': {
      const { data } = await supabase
        .from('posts')
        .select('author')
        .eq('id', resourceId)
        .single()
      return data?.author === user.id
    }
    case 'comment': {
      const { data } = await supabase
        .from('post_comments')
        .select('user_id')
        .eq('id', resourceId)
        .single()
      return data?.user_id === user.id
    }
    case 'profile': {
      return resourceId === user.id
    }
    default:
      return false
  }
}
