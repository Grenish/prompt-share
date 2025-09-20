export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center">
          <div className="relative w-full max-w-lg border rounded-md">
            <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md" />
          </div>
        </div>
      </header>

      <div className="pt-5 px-4 max-w-6xl mx-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="h-32 w-full bg-muted animate-pulse" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded-full bg-muted animate-pulse -mt-8 ring-4 ring-background" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted/70 animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted/50 animate-pulse rounded" />
                      <div className="h-3 w-40 bg-muted/50 animate-pulse rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-20 rounded-full bg-muted/60 animate-pulse" />
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <div className="h-3 w-16 bg-muted/40 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted/40 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted/40 animate-pulse rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
