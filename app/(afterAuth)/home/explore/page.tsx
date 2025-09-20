import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DashboardExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center">
          <div className="relative w-full max-w-lg border rounded-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full bg-transparent border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
              placeholder="Search..."
            />
          </div>
        </div>
      </header>
    </div>
  );
}
