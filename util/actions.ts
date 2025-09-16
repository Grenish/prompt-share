"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
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
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
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
    redirect("/error");
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

// Server Action: Upload/Update/Remove profile avatar
// Intended to be used with useFormState or as a form action (multipart/form-data)
export type UpdateProfileAvatarState = {
  ok: boolean;
  publicUrl?: string | null;
  error?: string | null;
};

export async function updateProfileAvatar(
  _prevState: UpdateProfileAvatarState,
  formData: FormData
): Promise<UpdateProfileAvatarState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    const remove = formData.get("remove");
    const file = formData.get("avatar") as File | null;

    // Handle remove avatar
    if (remove && (!file || (file as any).size === 0)) {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
      if (error) return { ok: false, error: error.message };
      // Revalidate layout so avatar updates everywhere
      revalidatePath("/", "layout");
      return { ok: true, publicUrl: null };
    }

    if (!file || (file as any).size === 0) {
      return { ok: false, error: "No file provided" };
    }

    // Derive extension and path
    const extFromName = file.name?.split(".").pop();
    const extFromType = file.type?.split("/")[1];
    const ext = (extFromName || extFromType || "webp").replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    // Store under top-level folder = user.id to align with common RLS policies
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || "image/webp",
        upsert: true,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: publicData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
    if (updateError) return { ok: false, error: updateError.message };

    // Revalidate layout so avatar updates everywhere
    revalidatePath("/", "layout");

    return { ok: true, publicUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}
