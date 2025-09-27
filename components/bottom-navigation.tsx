"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Home,
  Search,
  Plus,
  User as UserIcon,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", href: "/home", icon: Home },
  { title: "Explore", href: "/home/explore", icon: Search },
  { title: "Leaderboard", href: "/home/leaderboard", icon: Award },
  { title: "Notifications", href: "/home/notifications", icon: Bell },
  { title: "Profile", href: "/home/profile", icon: UserIcon },
  { title: "Create", href: "/home/create", icon: Plus, special: true },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string, title: string) =>
    title === "Home" ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden",
        "border-t border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto w-full max-w-md">
        <ul className="flex items-center justify-between px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.title);

            const baseBtn = cn(
              "relative inline-flex items-center justify-center",
              "h-10 w-10 rounded-md transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              active && "text-primary bg-primary/10"
            );

            const ActiveDot = active ? (
              <span className="pointer-events-none absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
            ) : null;

            if (item.special) {
              return (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    aria-label={item.title}
                    className={cn(
                      baseBtn,
                      "border border-primary/20 text-primary hover:bg-primary/10",
                    )}
                  >
                    <item.icon className="h-[20px] w-[20px]" />
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  aria-label={item.title}
                  className={baseBtn}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-[20px] w-[20px]" />
                  <span className="sr-only">{item.title}</span>
                  {ActiveDot}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
