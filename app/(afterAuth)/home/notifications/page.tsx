import { NotificationCenterClient } from "@/components/notification/notification-center-client";
import { fetchNotificationsForUser } from "@/util/data/notifications";

export default async function NotificationPage() {
  const { ok, notifications, error } = await fetchNotificationsForUser({
    limit: 50,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <NotificationCenterClient
        initialNotifications={notifications ?? []}
        initialLoading={!ok && !notifications}
        errorMessage={error}
      />
    </div>
  );
}
