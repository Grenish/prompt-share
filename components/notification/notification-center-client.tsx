"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { NotificationCenter, type NotificationItem } from "./notification-center";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/util/actions/notificationsActions";
import { Button } from "@/components/ui/button";

interface NotificationCenterClientProps {
  initialNotifications: NotificationItem[];
  initialLoading?: boolean;
  errorMessage?: string | null;
}

function resolveTargetUrl(notification: NotificationItem): string | null {
  const metaUrl =
    typeof notification.meta?.targetUrl === "string"
      ? notification.meta.targetUrl
      : undefined;
  if (metaUrl) return metaUrl;

  if (notification.targetType === "post" && notification.targetId) {
    return `/home/posts/${notification.targetId}`;
  }

  if (notification.targetType === "profile" && notification.targetId) {
    return `/home/profile/${notification.targetId}`;
  }

  return null;
}

export function NotificationCenterClient({
  initialNotifications,
  initialLoading,
  errorMessage,
}: NotificationCenterClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [isMarking, startTransition] = useTransition();
  const [isMarkingAll, startMarkAll] = useTransition();

  const unreadCount = useMemo(
    () => items.reduce((sum, item) => (item.read ? sum : sum + 1), 0),
    [items]
  );

  async function handleMarkRead(id: string) {
    const current = items.find((n) => n.id === id);
    if (!current) return;

    if (current.read) {
      const target = resolveTargetUrl(current);
      if (target) router.push(target);
      return;
    }

    const previous = items;
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error ?? "Failed to mark notification as read.");
        return;
      }

      const target = resolveTargetUrl(current);
      if (target) router.push(target);
    });
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    const previous = items;
    setItems((list) => list.map((item) => ({ ...item, read: true })));

    startMarkAll(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error ?? "Failed to mark all notifications as read.");
      } else if ((result.updated ?? 0) === 0) {
        toast.info("You're all caught up.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're up to date"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={unreadCount === 0 || isMarkingAll}
          onClick={handleMarkAll}
        >
          {isMarkingAll ? "Marking…" : "Mark all as read"}
        </Button>
      </div>

      <NotificationCenter
        notifications={items}
        onClickNotification={handleMarkRead}
        isLoading={initialLoading}
      />
    </div>
  );
}
