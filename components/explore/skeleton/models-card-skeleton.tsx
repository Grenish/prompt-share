import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ModelCardSkeletonProps {
  className?: string;
}

export default function ModelCardSkeleton({
  className,
}: ModelCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-sm h-14 flex flex-col justify-center items-center overflow-hidden rounded-full border shadow-sm p-3 gap-0",
        "bg-muted/30", // subtle placeholder background
        className
      )}
    >
      <CardContent
        className={cn(
          "w-full flex items-center justify-center p-2 rounded-full",
          "backdrop-blur-sm"
        )}
      >
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-6 w-6 ml-3 rounded-full" />
      </CardContent>
    </Card>
  );
}
