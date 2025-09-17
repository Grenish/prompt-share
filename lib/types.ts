import { z } from "zod";

// Reusable primitives
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const NameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

// Auth payload schema
export const AuthSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
});

export type AuthInput = z.infer<typeof AuthSchema>;
