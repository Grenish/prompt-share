"use client";

import * as React from "react";
import { DoorOpen, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { logout } from "@/util/actions/authActions";

type UserButtonProps = {
  userId?: string;
  name: string;
  email: string;
  imageSrc?: string | null;
  className?: string;
  settingsHref?: string;
};

export function UserButton({
  userId,
  name,
  email,
  imageSrc = null,
  className,
  settingsHref = "/settings",
}: UserButtonProps) {
  const trimmedName = name?.trim() || "";
  const initials = React.useMemo(() => {
    if (!trimmedName) return "U";
    return trimmedName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]!.toUpperCase())
      .join("");
  }, [trimmedName]);

  const [imgError, setImgError] = React.useState(false);
  const showImage = Boolean(imageSrc) && !imgError;

  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={trimmedName || "Account"}
          aria-label="Open account menu"
          className={cn(
            "gap-3 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 rounded-full",
            className
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-1 ring-sidebar-border">
            {showImage && (
              <AvatarImage
                src={imageSrc as string}
                alt={trimmedName || "User"}
                loading="lazy"
                onError={() => setImgError(true)}
              />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">
              {trimmedName || "User"}
            </span>
            <span
              className="truncate text-xs text-muted-foreground"
              title={email}
            >
              {email}
            </span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className={cn(
            "w-72 rounded-lg border border-sidebar-border bg-popover text-popover-foreground shadow-xl outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-3 rounded-md border border-sidebar-border bg-muted/50 p-2.5">
              <Avatar className="h-9 w-9 ring-1 ring-sidebar-border">
                {showImage && (
                  <AvatarImage
                    src={imageSrc as string}
                    alt={trimmedName || "User"}
                    loading="lazy"
                  />
                )}
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {trimmedName || "User"}
                </div>
                <div
                  className="truncate text-xs text-muted-foreground"
                  title={email}
                >
                  {email}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={cn(
              "p-0",
              "data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            )}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </button>
            </DialogTrigger>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              "p-0",
              "data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            )}
          >
            <form action={logout} className="flex w-full">
              <button
                type="submit"
                className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm"
              >
                <DoorOpen className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsDialog
        userId={userId || "self"}
        name={trimmedName}
        email={email}
        imageSrc={imageSrc}
      />
    </Dialog>
  );
}
