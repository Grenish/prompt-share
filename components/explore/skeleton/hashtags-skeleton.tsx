import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type HashTagsSkeletonProps = {
  className?: string;
};

export default function HashTagsSkeleton({ className }: HashTagsSkeletonProps) {
  return (
    <Card
      className={[
        "w-full max-w-sm h-[350px] flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm p-2 gap-0",
        className || "",
      ].join(" ")}
    >
      <CardHeader className="pt-1 px-0 mb-1">
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>

      <CardContent className="flex-1 px-2 pb-2">
        <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton
              key={idx}
              className="h-full w-full rounded-xl border border-border"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
