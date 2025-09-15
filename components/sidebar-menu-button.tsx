"use client";

import Image from "next/image";
import { SidebarMenuButton, useSidebar } from "./ui/sidebar";

export default function SidebarMenuButtonTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <SidebarMenuButton
      asChild
      size="lg"
      tooltip="Cookbook"
      className="
                gap-3
                hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                group-data-[collapsible=icon]:justify-center
                group-data-[collapsible=icon]:px-0
              "
      onClick={toggleSidebar}
    >
      <button
        type="button"
        aria-label="Cookbook"
        className="flex items-center w-full"
      >
        <div className="relative size-8 w-full overflow-hidden rounded-md ring-1 ring-sidebar-border">
          <Image
            src="/img7.png"
            alt="Cookbook"
            className="size-full object-cover"
            layout="fill"
          />
        </div>
      </button>
    </SidebarMenuButton>
  );
}
