"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { SidebarMenuButton, useSidebar } from "./ui/sidebar";

export default function SidebarMenuButtonTrigger() {
  const { toggleSidebar, state } = useSidebar();

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
        <div className="relative w-full  overflow-hidden rounded-md ring-1 ring-sidebar-border">
          <div
            className={
              state === "collapsed"
                ? "size-10 mx-auto"
                : "size-24 mx-auto"
            }
          >
            <DotLottieReact
              key={state}
              src="/rainbow-remix.lottie"
              loop
              autoplay
              className="w-full h-full"
            />
          </div>
        </div>
      </button>
    </SidebarMenuButton>
  );
}
