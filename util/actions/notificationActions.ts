"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import type {
  AppNotification,
  NotificationsResult,
  NotificationActor,
  NotificationCategory,
} from "@/lib/notifications";

function formatRelativeTime(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const now = Date.now();
  const diffSeconds = Math.round((now - date.getTime()) / 1000);
  const absDiff = Math.abs(diffSeconds);

  if (absDiff < 5) return "just now";

  const units: { limit: number; divisor: number; suffix: string }[] = [
    { limit: 60, divisor: 1, suffix: "s" },
    { limit: 3600, divisor: 60, suffix: "m" },
    { limit: 86400, divisor: 3600, suffix: "h" },
    { limit: 604800, divisor: 86400, suffix: "d" },
    { limit: 2629800, divisor: 604800, suffix: "w" },
    { limit: 31557600, divisor: 2629800, suffix: "mo" },
    { limit: Number.POSITIVE_INFINITY, divisor: 31557600, suffix: "y" },
  ];

  for (const unit of units) {
    if (absDiff < unit.limit) {
      const value = Math.floor(absDiff / unit.divisor);
      return diffSeconds >= 0 ? `${value}${unit.suffix} ago` : `in ${value}${unit.suffix}`;
    }
  }

  return null;
}

function summarizeActors(actors: NotificationActor[]): string {
  if (actors.length === 0) return "Someone";

  const names = actors
    .map((actor) => actor.fullName || actor.username)
    .filter((name): name is string => !!name);

  if (names.length === 0) return actors.length === 1 ? "Someone" : `${actors.length} people`;
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  const [first, second] = names;
  const others = names.length - 2;
  return `${first}, ${second} and ${others} other${others > 1 ? "s" : ""}`;
}

function resolveCategory(type: string | null): NotificationCategory | "general" {
  switch (type) {
    case "like":
    case "mention":
    case "follow":
    case "comment":
    case "repost":
    case "system":
      return type;
    default:
      return "general";
  }
}

function resolveTargetType(type: string | null): string | null {
  switch (type) {
    case "like":
    case "comment":
    case "mention":
    case "repost":
      return "post";
    case "follow":
      return "profile";
    case "system":
      return "system";
    default:
      return null;
  }
}

function buildMessage(
  type: string | null,
  actorSummary: string,
  actorCount: number
): string {
  switch (type) {
    case "like":
      return `${actorSummary} liked your post.`;
    case "mention":
      return `${actorSummary} mentioned you.`;
    case "comment":
      return `${actorSummary} commented on your post.`;
    case "follow":
      return `${actorSummary} followed you.`;
    case "repost":
      return `${actorSummary} reposted you.`;
    case "system":
      return "You have a system update.";
    default:
      if (actorCount > 0) {
        return `${actorSummary} sent you a notification.`;
      }
      return "You have a new notification.";
  }
}

async function fetchActorProfiles(
  actorIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, NotificationActor>> {
  if (actorIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", actorIds);

  if (error) {
    console.error("Failed to fetch notification actors", error);
    return new Map();
  }

  const map = new Map<string, NotificationActor>();
  for (const row of data || []) {
    const id = String((row as any).id);
    map.set(id, {
      id,
      username: (row as any).username ?? null,
      fullName: (row as any).full_name ?? null,
      avatarUrl: (row as any).avatar_url ?? null,
    });
  }
  return map;
}

export const fetchNotifications = async (options?: {
  limit?: number;
}): Promise<NotificationsResult> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        error: authError?.message || "Not authenticated",
      };
    }

    const limit = options?.limit ?? 50;

    const { data, error } = await supabase
      .from("notifications")
      .select(
        `id, type, target_id, read, created_at, updated_at,
         notification_actors:notification_actors(notification_id, actor_id)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false, error: error.message };
    }

    const rows = data ?? [];

    const actorIds = Array.from(
      new Set(
        (rows || [])
          .flatMap((row: any) =>
            (row.notification_actors || []).map((actor: any) => actor.actor_id)
          )
          .filter((id): id is string => !!id)
      )
    );

    const actorMap = await fetchActorProfiles(actorIds, supabase);

    const notifications: AppNotification[] = (rows || []).map((row: any) => {
      const actors = ((row.notification_actors || []) as any[])
        .map((actor) => actorMap.get(String(actor.actor_id)))
        .filter((actor): actor is NotificationActor => !!actor);

      const actorSummary = summarizeActors(actors);
      const category = resolveCategory(row.type ?? null);

      return {
        id: String(row.id),
        message: buildMessage(
          row.type ?? null,
          actorSummary,
          actors.length
        ),
        read: Boolean(row.read),
        timestamp: formatRelativeTime(row.created_at),
        category,
        targetId: row.target_id ? String(row.target_id) : null,
        targetType: resolveTargetType(row.type ?? null),
        actors,
        meta: {
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      } satisfies AppNotification;
    });

    return { ok: true, notifications };
  } catch (error: any) {
    console.error("Failed to fetch notifications", error);
    return { ok: false, error: error?.message || "Failed to fetch notifications" };
  }
};

export async function markNotificationAsRead(notificationId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: authError?.message || "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/home/notifications");

    return { ok: true };
  } catch (error: any) {
    console.error("Failed to mark notification as read", error);
    return { ok: false, error: error?.message || "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsAsRead(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: authError?.message || "Not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/home/notifications");

    return { ok: true };
  } catch (error: any) {
    console.error("Failed to mark notifications as read", error);
    return { ok: false, error: error?.message || "Failed to mark notifications as read" };
  }
}
