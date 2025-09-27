"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  NotificationCenter,
  type NotificationItem,
} from "@/components/notification/notification-center";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchNotifications,
} from "@/util/actions/notificationActions";

interface NotificationsPageClientProps {
  initialNotifications: NotificationItem[];
  initialError?: string | null;
}

export function NotificationsPageClient({
  initialNotifications,
  initialError,
}: NotificationsPageClientProps) {
  const limit = 60;
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const refreshNotifications = useCallback(() => {
    startTransition(async () => {
      const result = await fetchNotifications({ limit });
      if (!result.ok) {
        setError(result.error ?? "Failed to refresh notifications");
        toast.error(result.error ?? "Failed to refresh notifications");
        return;
      }
      setError(null);
      setNotifications(result.notifications ?? []);
    });
  }, [limit]);

  const handleMarkAll = useCallback(() => {
    startTransition(async () => {
      const res = await markAllNotificationsAsRead();
      if (!res.ok) {
        toast.error(res.error ?? "Failed to mark notifications as read");
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setError(null);
    });
  }, []);

  const handleNotificationClick = useCallback(
    (id: string) => {
      startTransition(async () => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        const res = await markNotificationAsRead(id);
        if (!res.ok) {
          toast.error(res.error ?? "Failed to update notification");
          const fallback = await fetchNotifications({ limit });
          if (fallback.ok) {
            setNotifications(fallback.notifications ?? []);
            setError(null);
          } else if (fallback.error) {
            setError(fallback.error);
          }
        }
      });
    },
    [limit]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold inline-flex items-center gap-2">
            <h2>Notifications</h2>
          </div>
          <div className="text-sm text-muted-foreground truncate max-w-[260px] inline-flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={refreshNotifications}
              disabled={isPending}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleMarkAll}
              disabled={isPending || notifications.every((n) => n.read)}
            >
              Mark all as read
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled
              aria-label="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}
        <NotificationCenter
          notifications={notifications}
          onClickNotification={handleNotificationClick}
          isLoading={isPending && notifications.length === 0}
        />
      </main>
    </div>
  );
}
