"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { getAdminClient } from "../supabase/admin";
import type {
  NotificationsResult,
  NotificationPayload,
  NotificationType,
} from "@/lib/notifications";
import {
  fetchNotificationsForUser,
  type FetchNotificationsOptions,
} from "@/util/data/notifications";

export async function fetchNotificationsAction(
  options?: FetchNotificationsOptions
): Promise<NotificationsResult> {
  return fetchNotificationsForUser(options);
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!notificationId || typeof notificationId !== "string") {
    return { ok: false, error: "Invalid notification identifier" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/home/notifications");

  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{
  ok: boolean;
  error?: string;
  updated?: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/home/notifications");

  return { ok: true, updated: (data || []).length };
}

export async function fetchUnreadNotificationsCount(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, count: count ?? 0 };
}

type EnqueueNotificationInput = {
  userId: string | null | undefined;
  actorId: string | null | undefined;
  type: NotificationType;
  payload?: NotificationPayload;
};

export async function enqueueNotification({
  userId,
  actorId,
  type,
  payload,
}: EnqueueNotificationInput): Promise<{ ok: boolean; error?: string }> {
  if (!userId || !actorId) {
    return { ok: false, error: "Missing notification recipient or actor" };
  }

  if (userId === actorId) {
    return { ok: false, error: "Skipping self notifications" };
  }

  let admin;
  try {
    admin = getAdminClient();
  } catch (error: any) {
    console.error("Admin client unavailable for notifications", error);
    return {
      ok: false,
      error: error?.message || "Notifications service unavailable",
    };
  }

  const sanitizedPayload: NotificationPayload | undefined = payload
    ? (Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      ) as NotificationPayload)
    : undefined;

  const { error } = await (admin as any)
    .from("notifications")
    .insert([
      {
        user_id: userId,
        actor_id: actorId,
        type,
        payload: sanitizedPayload ?? {},
      },
    ]);

  if (error) {
    console.error("Failed to enqueue notification", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
