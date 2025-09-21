"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { AuthSchema, EmailSchema, PasswordSchema } from "@/lib/types";
import { z } from "zod";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Validate only email + password for login
  const LoginSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
  });

  const parseResult = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parseResult.success) {
    // Optionally, store errors in search params or a cookie/flash store
    return redirect("/error");
  }

  const data = parseResult.data;

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.log("Login error:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export type LoginState = {
  ok: boolean;
  error?: string | null;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient();

  const LoginSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
  });

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email and an 8+ char password." };
  }

  const { email, password } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.log("Login error:", error);
    return { ok: false, error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Validate email, password, and name
  const parseResult = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parseResult.success) {
    return redirect("/error");
  }

  const data = parseResult.data;

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.name,
      },
    },
  });

  if (error) {
    return redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}