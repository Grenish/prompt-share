"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BellIcon,
  AtSignIcon,
  HeartIcon,
  UserPlusIcon,
  ClockIcon,
  MessageCircleIcon,
  Repeat2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AppNotification,
  NotificationCategory,
} from "@/lib/notifications";

export type NotificationItem = AppNotification;

export type NotificationFilterType =
  | "all"
  | Extract<NotificationCategory, "mention" | "like" | "follow" | "system">;

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onClickNotification?: (id: string) => void;
  showTimestamps?: boolean;
  className?: string;
  defaultFilter?: NotificationFilterType;
  isLoading?: boolean;
  skeletonCount?: number;
}

// Skeleton row
const NotificationSkeleton: React.FC = () => (
  <li className="relative p-4 sm:p-5 animate-pulse">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="h-10 w-10 rounded-xl bg-muted/70" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted/70 rounded w-3/4" />
        <div className="h-3 bg-muted/60 rounded w-1/2" />
      </div>
    </div>
  </li>
);

function iconStyles(category?: NotificationItem["category"], read?: boolean) {
  if (read) return "bg-muted text-muted-foreground ring-0";
  switch (category) {
    case "like":
      return "bg-rose-500/10 text-rose-500 ring-rose-500/20";
    case "mention":
      return "bg-violet-500/10 text-violet-500 ring-violet-500/20";
    case "comment":
      return "bg-amber-500/10 text-amber-500 ring-amber-500/20";
    case "follow":
      return "bg-blue-500/10 text-blue-500 ring-blue-500/20";
    case "repost":
      return "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20";
    case "system":
    case "general":
      return "bg-purple-500/10 text-purple-500 ring-purple-500/20";
    default:
      return "bg-primary/10 text-primary ring-primary/20";
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClickNotification,
  showTimestamps = true,
  className,
  defaultFilter = "all",
  isLoading = false,
  skeletonCount = 6,
}) => {
  const [activeTab, setActiveTab] =
    useState<NotificationFilterType>(defaultFilter);

  const filteredNotifications = notifications.filter((n) =>
    activeTab === "all" ? true : n.category === activeTab
  );

  const unreadByTab = {
    all: notifications.filter((n) => !n.read).length,
    mention: notifications.filter((n) => n.category === "mention" && !n.read)
      .length,
    like: notifications.filter((n) => n.category === "like" && !n.read).length,
    follow: notifications.filter((n) => n.category === "follow" && !n.read)
      .length,
    system: notifications.filter((n) => n.category === "system" && !n.read)
      .length,
  };

  const tabs: {
    key: NotificationFilterType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "all", label: "All", icon: <BellIcon className="h-3.5 w-3.5" /> },
    {
      key: "mention",
      label: "Mentions",
      icon: <AtSignIcon className="h-3.5 w-3.5" />,
    },
    {
      key: "like",
      label: "Likes",
      icon: <HeartIcon className="h-3.5 w-3.5" />,
    },
    {
      key: "follow",
      label: "Follows",
      icon: <UserPlusIcon className="h-3.5 w-3.5" />,
    },
    {
      key: "system",
      label: "System",
      icon: <ClockIcon className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <Card className={cn("bg-background border-none shadow-none", className)}>
      {/* Sticky tabs with subtle glass + active underline */}
      <div className="sticky top-16 z-20 bg-background/90 backdrop-blur-sm border-b px-3 sm:px-4 py-2.5">
        <div
          className="flex overflow-x-auto hide-scrollbar gap-1.5 pb-1"
          role="tablist"
          aria-label="Notification filters"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all flex-shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {unreadByTab[tab.key] > 0 && (
                <Badge
                  variant="outline"
                  className="ml-1 h-4 min-w-4 px-1.5 rounded-full text-[10px] border-primary/30"
                >
                  {unreadByTab[tab.key]}
                </Badge>
              )}
              {activeTab === tab.key && (
                <span className="pointer-events-none absolute left-2 right-2 -bottom-1 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-0">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </ul>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-64">
            <div className="relative mb-2">
              <BellIcon className="h-14 w-14 text-muted-foreground/60" />
              <span className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-2xl" />
            </div>
            <p className="text-sm font-medium text-foreground/80">
              No {activeTab !== "all" ? activeTab : ""} notifications
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Switch tabs or check back later.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                role="listitem"
                className={cn(
                  "relative p-4 sm:p-5 transition-all duration-200 cursor-pointer group",
                  "hover:bg-accent/40 hover:shadow-sm hover:-translate-y-0.5",
                  !notification.read && "bg-accent/10"
                )}
                onClick={() => onClickNotification?.(notification.id)}
              >
                {/* Gradient accent bar for unread */}
                {!notification.read && (
                  <span className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary/70 via-primary to-primary/70 rounded-r-md" />
                )}

                {/* Unread dot */}
                {!notification.read && (
                  <span className="absolute right-4 top-4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                )}

                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center ring-1 transition-transform group-hover:scale-105",
                      iconStyles(notification.category, notification.read)
                    )}
                  >
                    {notification.icon ? (
                      notification.icon
                    ) : notification.category === "mention" ? (
                      <AtSignIcon className="h-5 w-5" />
                    ) : notification.category === "like" ? (
                      <HeartIcon className="h-5 w-5" />
                    ) : notification.category === "comment" ? (
                      <MessageCircleIcon className="h-5 w-5" />
                    ) : notification.category === "follow" ? (
                      <UserPlusIcon className="h-5 w-5" />
                    ) : notification.category === "repost" ? (
                      <Repeat2Icon className="h-5 w-5" />
                    ) : notification.category === "system" ||
                      notification.category === "general" ? (
                      <ClockIcon className="h-5 w-5" />
                    ) : (
                      <BellIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p
                        className={cn(
                          "text-sm leading-relaxed break-words",
                          !notification.read
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {notification.message}
                      </p>
                    </div>

                    {showTimestamps && notification.timestamp && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <ClockIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="text-xs text-muted-foreground/80">
                          {notification.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
