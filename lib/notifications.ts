import type { ReactNode } from "react";

export type NotificationCategory =
  | "mention"
  | "like"
  | "follow"
  | "system"
  | "comment"
  | "repost"
  | "general";

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
  error?: string;
};
