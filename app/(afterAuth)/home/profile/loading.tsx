export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 h-[280px] sm:h-[300px] bg-muted animate-pulse" />
          <div className="relative p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
              <div className="h-[150px] w-[150px] rounded-full bg-muted animate-pulse border border-border" />
              <div className="flex-1 space-y-4 w-full">
                <div className="h-6 w-48 bg-muted/70 animate-pulse rounded" />
                <div className="h-4 w-40 bg-muted/50 animate-pulse rounded" />
                <div className="flex gap-8 mt-2">
                  <div className="h-4 w-12 bg-muted/40 animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted/40 animate-pulse rounded" />
                  <div className="h-4 w-12 bg-muted/40 animate-pulse rounded" />
                </div>
                <div className="h-4 w-full max-w-md bg-muted/40 animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-8">
          <div className="flex gap-3 mb-4">
            <div className="h-9 w-24 bg-muted/50 animate-pulse rounded" />
            <div className="h-9 w-24 bg-muted/30 animate-pulse rounded" />
            <div className="h-9 w-32 bg-muted/30 animate-pulse rounded" />
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="h-4 w-1/2 bg-muted/50 animate-pulse rounded mb-3" />
                <div className="h-3 w-full bg-muted/40 animate-pulse rounded mb-2" />
                <div className="h-3 w-5/6 bg-muted/40 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
