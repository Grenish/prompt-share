"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { AuthSchema, EmailSchema, PasswordSchema } from "@/lib/types";
import { z } from "zod";

// Schemas (module scope)
const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

const SignupSchema = AuthSchema;

const ChangePasswordSchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: PasswordSchema,
  confirmPassword: PasswordSchema,
});

// Helpers
function redirectWithToast(
  path: string,
  toastKey: string,
  extras: Record<string, string | undefined> = {}
): never {
  const usp = new URLSearchParams({ toast: toastKey, ...extras });
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${usp.toString()}`);
}

type ActionState =
  | { ok: true; message?: string | null }
  | { ok: false; error: string | null };

async function doLogin(email: string, password: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Login error:", error);
    return { ok: false, error: "Invalid email or password." };
  }
  return { ok: true, message: null };
}

async function doSignup(
  email: string,
  password: string,
  name: string
): Promise<ActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
    },
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to create account." };
  }

  // If email confirmations are enabled in Supabase, session will be null.
  const requiresEmailConfirm = !data.session;
  return requiresEmailConfirm
    ? { ok: true, message: "verify_email" }
    : { ok: true, message: "signup_success" };
}

// Actions (for <form action={...}> usage)

export async function login(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithToast("/login", "error", {
      m: "Please enter a valid email and password.",
    });
  }

  const { email, password } = parsed.data;
  const res = await doLogin(email, password);
  if (!res.ok) {
    redirectWithToast("/login", "error", { m: res.error ?? undefined });
  }

  revalidatePath("/", "layout");
  redirectWithToast("/home", "login_success");
}

// If you’re using useFormState for login from a client component
export type LoginState = { ok: boolean; error?: string | null };
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please enter a valid email and an 8+ char password.",
    };
  }

  const { email, password } = parsed.data;
  const res = await doLogin(email, password);
  if (!res.ok) {
    return { ok: false, error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export type SignupState = { ok: boolean; error?: string | null };
export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fill in all fields correctly.",
    };
  }

  const { email, password, name } = parsed.data;
  const res = await doSignup(email, password, name);
  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/", "layout");
  
  // message will be either "verify_email" or "signup_success"
  const toastKey = res.message || "signup_success";
  redirectWithToast("/", toastKey);
}

export async function signup(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirectWithToast("/signup", "error", {
      m: "Please fill in all fields correctly.",
    });
  }

  const { email, password, name } = parsed.data;
  const res = await doSignup(email, password, name);
  if (!res.ok) {
    redirectWithToast("/signup", "error", { m: res.error ?? undefined });
  }

  // Revalidate and redirect to "/" with a toast flag.
  revalidatePath("/", "layout");

  // message will be either "verify_email" or "signup_success"
  const toastKey = res.message || "signup_success";
  redirectWithToast("/", toastKey);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirectWithToast("/login", "logout_success");
}

export type ChangePasswordState = {
  ok: boolean;
  message?: string | null;
  error?: string | null;
};

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please provide valid passwords (min 8 characters).",
    };
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords do not match." };
  }

  if (currentPassword === newPassword) {
    return {
      ok: false,
      error: "New password must be different from current password.",
    };
  }

  if (!user.email) {
    return { ok: false, error: "Unable to verify email." };
  }

  // Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return {
      ok: false,
      error: updateError.message || "Failed to update password.",
    };
  }

  return { ok: true, message: "Password updated successfully." };
}
