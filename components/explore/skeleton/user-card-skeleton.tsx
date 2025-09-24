import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type UserCardSkeletonProps = {
  className?: string;
  showButton?: boolean;
};

export function UserCardSkeleton({
  className,
  showButton = true,
}: UserCardSkeletonProps) {
  return (
    <Card
      className={[
        "w-full max-w-sm p-0 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy="true"
      aria-live="polite"
    >
      {/* Banner */}
      <CardHeader className="relative p-0 mb-0">
        <div className="relative h-20 sm:h-24">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/30" />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-7 left-3">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-[3px] ring-background shadow-md overflow-hidden">
            <Skeleton className="h-full w-full rounded-full" />
          </div>
        </div>
      </CardHeader>

      {/* Info */}
      <CardContent className="pt-2 sm:pt-4 px-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-28 sm:w-32" />
            </div>
            <Skeleton className="mt-1 h-3 w-24 sm:w-28" />
            <Skeleton className="mt-2 h-3 w-40 sm:w-52" />
          </div>

          {showButton && (
            <div className="shrink-0">
              <Skeleton className="h-7 sm:h-8 w-[72px] sm:w-[88px] rounded-full" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16 hidden sm:inline" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16 hidden sm:inline" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16 hidden sm:inline" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
