"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { AuthSchema, EmailSchema, PasswordSchema } from "@/lib/types";
import { LoginSchema, SignupSchema } from "@/lib/validation";
import { z } from "zod";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Validate using centralized schema
  const parseResult = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parseResult.success) {
    console.error("Login validation failed:", parseResult.error.flatten());
    return redirect("/error");
  }

  const data = parseResult.data;

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error("Login error:", error);
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
    console.error("Login error:", error);
    return { ok: false, error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Validate using centralized schema
  const parseResult = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parseResult.success) {
    console.error("Signup validation failed:", parseResult.error.flatten());
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
    console.error("Signup error:", error);
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