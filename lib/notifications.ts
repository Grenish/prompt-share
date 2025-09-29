import type { ReactNode } from "react";

export type NotificationCategory =
  | "mention"
  | "like"
  | "follow"
  | "system"
  | "comment"
  | "repost"
  | "general";

export type NotificationType = Extract<
  NotificationCategory,
  "mention" | "like" | "follow" | "system"
>;

export type NotificationActor = {
  id: string;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  timestamp?: string | null;
  category?: NotificationCategory | string;
  icon?: ReactNode;
  targetType?: string | null;
  targetId?: string | null;
  actors?: NotificationActor[];
  meta?: Record<string, unknown>;
}

export type NotificationsResult = {
  ok: boolean;
  notifications?: AppNotification[];
  unreadCount?: number;
  error?: string;
};

export type NotificationPayload = {
  targetType?: string | null;
  targetId?: string | null;
  targetUrl?: string | null;
  snippet?: string | null;
  message?: string | null;
  meta?: Record<string, unknown>;
};

export type NotificationRow = {
  id: string | number;
  user_id: string;
  actor_id: string | null;
  type: NotificationType | string;
  payload: Record<string, unknown> | null;
  is_read: boolean | null;
  created_at: string | null;
  actor?: {
    id: string;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

const RELATIVE_THRESHOLDS = [
  { limit: 60_000, divisor: 1_000, unit: "second" as const },
  { limit: 3_600_000, divisor: 60_000, unit: "minute" as const },
  { limit: 86_400_000, divisor: 3_600_000, unit: "hour" as const },
  { limit: 604_800_000, divisor: 86_400_000, unit: "day" as const },
  { limit: 2_592_000_000, divisor: 604_800_000, unit: "week" as const },
  { limit: 31_536_000_000, divisor: 2_592_000_000, unit: "month" as const },
];

const rtf =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

function coerceString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return undefined;
}

function sanitizeMeta(payload: Record<string, unknown> | null | undefined) {
  if (!payload || typeof payload !== "object") return {};
  const meta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      meta[key] = value;
    }
  }
  return meta;
}

function resolveActorDisplay(
  actor: NotificationRow["actor"],
  fallbackEmail?: string | null
): NotificationActor | undefined {
  if (!actor) return undefined;
  const fullName = coerceString(actor.full_name);
  const username = coerceString(actor.username);
  const fallback = coerceString(fallbackEmail);
  const preferred = fullName || username || fallback || "Someone";
  return {
    id: actor.id,
    username: username ?? null,
    fullName: fullName ?? preferred,
    avatarUrl: coerceString(actor.avatar_url) ?? null,
  } satisfies NotificationActor;
}

export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined;
  }
  const diff = date.getTime() - Date.now();
  const absDiff = Math.abs(diff);

  for (const { limit, divisor, unit } of RELATIVE_THRESHOLDS) {
    if (absDiff < limit) {
      const rounded = Math.round(diff / divisor);
      return rtf?.format(rounded, unit) ?? date.toLocaleString();
    }
  }

  const years = Math.round(diff / 31_536_000_000);
  return rtf?.format(years, "year") ?? date.toLocaleString();
}

export function mapNotificationRowToAppNotification(
  row: NotificationRow,
  options?: { fallbackEmail?: string | null }
): AppNotification {
  const payload = sanitizeMeta(row.payload);
  const targetType =
    coerceString(payload.targetType) ||
    coerceString(payload.target_type) ||
    null;
  const targetId =
    coerceString(payload.targetId) ||
    coerceString(payload.target_id) ||
    null;
  const targetUrl =
    coerceString(payload.targetUrl) ||
    coerceString(payload.target_url) ||
    (targetType === "post" && targetId
      ? `/home/posts/${targetId}`
      : targetType === "profile" && targetId
      ? `/home/profile/${targetId}`
      : undefined);
  const snippet =
    coerceString(payload.snippet) || coerceString(payload.preview) || null;
  const actor = resolveActorDisplay(row.actor, options?.fallbackEmail ?? null);

  const actorName = actor?.fullName || actor?.username || "Someone";
  const category = (row.type as NotificationCategory) || "general";

  let message: string | undefined;
  switch (row.type) {
    case "like":
      message = `${actorName} liked your ${
        targetType === "comment" ? "comment" : "post"
      }.`;
      break;
    case "follow":
      message = `${actorName} started following you.`;
      break;
    case "mention":
      message = `${actorName} mentioned you${
        targetType === "comment" ? " in a comment" : " in a post"
      }.`;
      break;
    case "system":
      message =
        coerceString(payload.message) ||
        coerceString(payload.title) ||
        "You have a new notification.";
      break;
    default:
      message =
        coerceString(payload.message) ||
        "You have a new notification.";
      break;
  }

  if (snippet) {
    message = `${message} "${snippet}"`;
  }

  const meta: Record<string, unknown> = { ...payload };
  if (targetUrl) meta.targetUrl = targetUrl;
  if (snippet) meta.snippet = snippet;

  return {
    id: String(row.id),
    message,
    category,
    read: Boolean(row.is_read),
    timestamp: formatRelativeTime(row.created_at) ?? row.created_at,
    targetType,
    targetId,
    actors: actor ? [actor] : undefined,
    meta,
  } satisfies AppNotification;
}
