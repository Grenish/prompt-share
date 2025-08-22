"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Home,
  Compass,
  PenTool,
  Users,
  LogIn,
  Rocket,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export default function Navbar() {
  const isDesktop = useMediaQuery("(min-width: 778px)");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // scroll → compact nav
  const [progress, setProgress] = useState(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const maxScroll = 160;
  const damping = 0.12;

  useEffect(() => {
    if (!isDesktop) {
      setProgress(0);
      targetRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const onScroll = () => {
      const t = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      targetRef.current = t;
      if (rafRef.current == null) tick();
    };
    function tick() {
      rafRef.current = requestAnimationFrame(() => {
        setProgress((p) => {
          const next = p + (targetRef.current - p) * damping;
          if (Math.abs(next - targetRef.current) > 0.001) {
            tick();
          } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            return targetRef.current;
          }
          return next;
        });
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDesktop]);

  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // interpolation
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  const expandedMaxW = 896;
  const compactW = 380;
  const navWidth = Math.round(lerp(expandedMaxW, compactW));
  const padX = Math.round(lerp(24, 16));
  const padY = Math.round(lerp(12, 8));
  const gap = Math.round(lerp(24, 12));
  const labelOpacity = 1 - progress;
  const labelMaxW = Math.max(0, Math.round(lerp(100, 0)));
  const showIconsOnly = progress > 0.85 && isDesktop;

  const navItems = [
    { href: "#", label: "Home", icon: Home },
    { href: "#", label: "Explore", icon: Compass },
    { href: "#", label: "Create", icon: PenTool },
    { href: "#", label: "Community", icon: Users },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 md:top-6 flex items-center gap-2">
        {/* === Navbar pill === */}
        <nav
          style={{ width: isDesktop ? navWidth : undefined }}
          className={`${isDesktop ? "" : "w-[92vw] max-w-[640px]"} relative`}
        >
          <div
            className="relative rounded-full overflow-hidden transition-all duration-500"
            style={{
              padding: `${isDesktop ? padY : 10}px ${isDesktop ? padX : 14}px`,
              backdropFilter: "blur(20px) saturate(200%)",
              WebkitBackdropFilter: "blur(20px) saturate(200%)",
              background:
                "linear-gradient(140deg,rgba(255,255,255,0.25),rgba(255,255,255,0.1))",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.25)",
            }}
          >
            {/* Navbar border shimmer */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  padding: "1px",
                  background:
                    "linear-gradient(120deg,rgba(255,255,255,0.6),rgba(255,255,255,0.05),rgba(255,255,255,0.4))",
                  backgroundSize: "200% 200%",
                  animation: "flowBorder 8s linear infinite",
                }}
              />
            </div>

            <div
              className="relative flex items-center justify-between"
              style={{ gap: isDesktop ? gap : 12 }}
            >
              {/* Brand */}
              <Link href="/" className="flex items-center gap-2 select-none">
                <Rocket className="w-5 h-5 text-gray-900 dark:text-gray-100 shrink-0" />
                <span
                  className="text-base font-semibold text-gray-900 dark:text-gray-100 overflow-hidden whitespace-nowrap"
                  style={{
                    opacity: isDesktop ? labelOpacity : 1,
                    maxWidth: isDesktop ? labelMaxW : 200,
                  }}
                >
                  PromptSwap
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center" style={{ gap }}>
                {navItems.map(({ href, label, icon: Icon }) =>
                  showIconsOnly ? (
                    <Tooltip key={label}>
                      <TooltipTrigger asChild>
                        <Link
                          href={href}
                          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      style={{ gap: 6 }}
                    >
                      <Icon className="h-4 w-4" />
                      <span
                        className="text-sm overflow-hidden whitespace-nowrap"
                        style={{
                          opacity: labelOpacity,
                          maxWidth: labelMaxW,
                        }}
                      >
                        {label}
                      </span>
                    </Link>
                  )
                )}
              </div>

              {/* Right actions */}
              <div className="hidden md:flex items-center" style={{ gap: 12 }}>
                <Link
                  href="#"
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  style={{ gap: 6 }}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm">Login</span>
                </Link>

                <Link
                  href="#"
                  className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-black text-sm hover:opacity-90 transition px-4 py-2"
                >
                  {isDesktop && progress >= 0.5 ? "Start" : "Get Started"}
                </Link>
              </div>

              {/* Mobile CTA + hamburger */}
              <div className="md:hidden flex items-center gap-2">
                <Link
                  href="#"
                  className="rounded-full bg-gray-900 text-white text-sm hover:bg-gray-800 px-3 py-1.5"
                >
                  Start
                </Link>
                <button
                  aria-label="Toggle menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                  className="p-2 rounded-full text-gray-800 dark:text-gray-200"
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="md:hidden absolute left-0 right-0 mt-2 z-50">
              <div className="bg-white/95 dark:bg-black/80 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-4">
                <div className="flex flex-col">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center gap-3 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  ))}
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                  <Link
                    href="#"
                    className="flex items-center gap-3 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="text-sm">Login</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
            className="relative group w-11 h-11 rounded-full overflow-hidden select-none"
            style={{
              border: "1px solid transparent",
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 100%) padding-box, \
         linear-gradient(120deg, rgba(255,255,255,0.6), rgba(255,255,255,0.08), rgba(255,255,255,0.35)) border-box",
              backdropFilter: "blur(18px) saturate(180%)",
              WebkitBackdropFilter: "blur(18px) saturate(180%)",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.08), inset 0 1px 2px rgba(255,255,255,0.35)",
              transition:
                "transform 480ms cubic-bezier(0.22,1,0.36,1), box-shadow 480ms cubic-bezier(0.22,1,0.36,1), background 480ms ease",
            }}
            onMouseDown={(e) => e.currentTarget.classList.add("scale-95")}
            onMouseUp={(e) => e.currentTarget.classList.remove("scale-95")}
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: "1px",
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.55), rgba(255,255,255,0.06), rgba(255,255,255,0.35))",
                backgroundSize: "200% 200%",
                animation: "flowBorder 10s linear infinite",
                borderRadius: "9999px",
              }}
            />

            <span className="pointer-events-none absolute inset-0 rounded-full overflow-hidden">
              <span
                className="absolute w-[180%] h-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent"
                style={{
                  transform: "translateX(-100%) rotate(15deg)",
                  animation: "sheen 9s linear infinite",
                }}
              />
            </span>

            <span className="relative z-10 flex items-center justify-center w-full h-full">
              <span
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  theme === "dark"
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-75 -rotate-45"
                }`}
              >
                <Sun className="h-5 w-5 dark:text-slate-700 text-slate-200" />
              </span>

              <span
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  theme === "dark"
                    ? "opacity-0 scale-75 rotate-45"
                    : "opacity-100 scale-100 rotate-0"
                }`}
              >
                <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </span>
            </span>
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
