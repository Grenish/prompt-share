"use client";

import { useState } from "react";
import {
  NotificationCenter,
  NotificationItem,
} from "@/components/notification/notification-center";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      message: "Alice liked your post.",
      category: "like",
      read: false,
      timestamp: "2m ago",
    },
    {
      id: "2",
      message: "Bob and 3 others liked your post.",
      category: "like",
      read: false,
      timestamp: "10m ago",
    },
    {
      id: "3",
      message: "Jane mentioned you in a comment.",
      category: "mention",
      read: true,
      timestamp: "1h ago",
    },
    {
      id: "4",
      message: "Jane and 5 others followed you.",
      category: "follow",
      read: true,
      timestamp: "1h ago",
    },
    {
      id: "5",
      message: "System maintenance scheduled for tonight.",
      category: "system",
      read: true,
      timestamp: "1h ago",
    },
  ]);

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold inline-flex items-center gap-2">
            <h2>Notifications</h2>
          </div>
          <div className="text-sm text-muted-foreground truncate max-w-[180px] inline-flex items-center gap-2">
            <Button
              className="p-2"
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
            <Button className="p-2" variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto ">
        <NotificationCenter
          notifications={notifications}
          onClickNotification={handleNotificationClick}
        />
      </main>
    </div>
  );
}
