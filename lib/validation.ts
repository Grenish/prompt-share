// lib/validation.ts - Input validation schemas
import { z } from 'zod'

// Reusable field validators
export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(255)

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long')

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -')

// Authentication schemas
export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
})

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1, 'Name is required').max(100),
})

// Profile schemas
export const ProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  full_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url('Invalid URL').max(200).optional().or(z.literal('')),
})

// Post schemas
export const PostCreateSchema = z.object({
  text: z.string()
    .min(1, 'Post content is required')
    .max(5000, 'Post content too long'),
  category: z.string().min(1).max(50),
  subCategory: z.string().max(50).optional(),
  modelName: z.string().max(100),
  tags: z.array(z.string().max(30)).max(10).optional(),
  modelProviderLabel: z.string().max(50).optional(),
  modelProviderSlug: z.string().max(50).optional(),
  modelLabel: z.string().max(100).optional(),
  modelKey: z.string().max(100).optional(),
  modelKind: z.string().max(50).optional(),
  categorySlug: z.string().max(50).optional(),
  subCategorySlug: z.string().max(50).optional(),
})

// Comment schema
export const CommentCreateSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long'),
})

// Simplified comment schema for text-only validation
export const PostCommentSchema = z.object({
  text: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment too long'),
})

// File validation
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' }
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' }
  }
  
  return { valid: true }
}

// Sanitize user input to prevent XSS
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
