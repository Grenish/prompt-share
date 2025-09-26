import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";

export default function NotificationPage() {
  return (
    <div className="">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold inline-flex items-center gap-2">
            <h2>Notifications</h2>
          </div>
          <div className="text-sm text-muted-foreground truncate max-w-[180px] inline-flex items-center">
            <Button className="p-2" variant="ghost" size="sm">
              Mark all as read
            </Button>
            <Button className="p-2" variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
