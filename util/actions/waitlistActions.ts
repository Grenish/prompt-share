"use server";

import { z } from "zod";
import { createClient } from "../supabase/server";
import { EmailSchema, NameSchema } from "@/lib/types";

export async function joinWaitlist(formData: FormData) {
  const supabase = await createClient();

  const waitlistSchema = z.object({
    email: EmailSchema,
    fullName: NameSchema,
  });

  const parseResult = waitlistSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
  });

  if (!parseResult.success) {
    // Optionally, store errors in search params or a cookie/flash store
    return { ok: false, error: "Invalid input" };
  }

  const { email, fullName } = parseResult.data;

  const { data, error } = await supabase
    .from("waitlist")
    // Map form "fullName" to DB column "full_name"
    .insert([{ email, full_name: fullName }]);

  if (error) {
    // Handle unique violation (already joined)
    if ((error as any)?.code === "23505") {
      return { ok: false, error: "You're already on the waitlist." };
    }
    return { ok: false, error: "Failed to join waitlist" };
  }

  return { ok: true };
}
