import { fetchNotifications } from "@/util/actions/notificationActions";
import { NotificationsPageClient } from "./notifications-page-client";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

export default async function NotificationPage() {
  const result = await fetchNotifications({ limit: 60 });

  return (
    <NotificationsPageClient
      initialNotifications={result.notifications ?? []}
      initialError={result.ok ? null : result.error ?? "Failed to load notifications"}
    />
  );
}
