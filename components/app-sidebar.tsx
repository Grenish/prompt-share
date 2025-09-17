import {
  Award,
  Bell,
  Home,
  PlusCircle,
  Search,
  User as UserIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserButton } from "@/components/userButton";
import { createClient } from "@/util/supabase/server";
import { normalizeUser } from "@/lib/normalizeUser";
import SidebarMenuButtonTrigger from "./sidebar-menu-button";
import Link from "next/link";

const basePath = "/dashboard";

const navItems = [
  { title: "Home", href: `${basePath}`, icon: Home },
  { title: "Profile", href: `${basePath}/profile`, icon: UserIcon },
  { title: "Explore", href: `${basePath}/explore`, icon: Search },
  { title: "Notifications", href: `${basePath}/notifications`, icon: Bell },
  { title: "Leaderboard", href: `${basePath}/leaderboard`, icon: Award },
  { title: "Create", href: `${basePath}/create`, icon: PlusCircle },
];

export async function AppSidebar() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("User not authenticated");
  }
  const user = normalizeUser(data.user);

  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm"
    >
      <SidebarRail />

      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButtonTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className="
                        hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                        transition-colors
                        group-data-[collapsible=icon]:justify-center
                      "
                    >
                      <Link href={item.href}>
                        <Icon className="size-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              userId={user?.id}
              name={user?.displayName || ""}
              email={user?.email || ""}
              imageSrc={user?.avatarUrl ?? null}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
