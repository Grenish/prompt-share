import { createClient } from "../supabase/server";
import type {
  AppNotification,
  NotificationsResult,
  NotificationRow,
  NotificationType,
} from "@/lib/notifications";
import { mapNotificationRowToAppNotification } from "@/lib/notifications";

export type FetchNotificationsOptions = {
  limit?: number;
  unreadOnly?: boolean;
};

type RawNotificationRow = {
  id: unknown;
  user_id: unknown;
  actor_id: unknown;
  type: unknown;
  payload: unknown;
  is_read: unknown;
  created_at: unknown;
};

function normalizeNotificationRow(row: RawNotificationRow): NotificationRow {
  const payloadValue =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : null;

  return {
    id:
      typeof row.id === "number" || typeof row.id === "bigint"
        ? String(row.id)
        : String(row.id ?? ""),
    user_id: String(row.user_id ?? ""),
    actor_id:
      typeof row.actor_id === "string" || typeof row.actor_id === "number"
        ? String(row.actor_id)
        : null,
    type: (typeof row.type === "string" ? row.type : "system") as
      | NotificationType
      | string,
    payload: payloadValue,
    is_read: Boolean(row.is_read),
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    actor: null,
  };
}

export async function fetchNotificationsForUser(
  options?: FetchNotificationsOptions
): Promise<NotificationsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    let query = supabase
      .from("notifications")
      .select(
        "id, user_id, actor_id, type, payload, is_read, created_at",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (options?.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;
    if (error) {
      return { ok: false, error: error.message };
    }

    const rows = (data || []).map((row) =>
      normalizeNotificationRow(row as RawNotificationRow)
    );

    const actorIds = Array.from(
      new Set(
        rows
          .map((row) => row.actor_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    const actorMap = new Map<string, NotificationRow["actor"]>();

    if (actorIds.length > 0) {
      const { data: actorRows, error: actorError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", actorIds);

      if (!actorError) {
        for (const actor of actorRows ?? []) {
          const id = typeof (actor as any).id === "string" ? (actor as any).id : String((actor as any).id ?? "");
          if (!id) continue;
          actorMap.set(id, {
            id,
            username:
              typeof (actor as any).username === "string"
                ? (actor as any).username
                : null,
            full_name:
              typeof (actor as any).full_name === "string"
                ? (actor as any).full_name
                : null,
            avatar_url:
              typeof (actor as any).avatar_url === "string"
                ? (actor as any).avatar_url
                : null,
          });
        }
      }
    }

    const notifications: AppNotification[] = rows.map((row) =>
      mapNotificationRowToAppNotification(
        {
          ...row,
          actor: row.actor_id ? actorMap.get(row.actor_id) ?? null : null,
        },
        { fallbackEmail: user.email }
      )
    );

    const unreadCount = notifications.reduce(
      (acc, notification) => (notification.read ? acc : acc + 1),
      0
    );

    return {
      ok: true,
      notifications,
      unreadCount:
        options?.unreadOnly && typeof count === "number"
          ? count
          : unreadCount,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Failed to load notifications" };
  }
}
