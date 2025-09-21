"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Home,
  Compass,
  PenTool,
  Users,
  LogIn,
  Menu,
  X,
  Sun,
  Moon,
  Book,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient as createSupabaseBrowserClient } from "@/util/supabase/client";

/** Simple media query hook */
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

/** Tiny spring for numbers (stiffness/damping, no deps) */
function useSpringNumber(
  target: number,
  {
    stiffness = 260,
    damping = 28,
    mass = 1,
    precision = 0.0005,
    maxStep = 0.032, // clamp dt for stability
  }: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    precision?: number;
    maxStep?: number;
  } = {}
) {
  const [value, setValue] = useState(target);
  const valRef = useRef(value);
  const velRef = useRef(0);
  const tgtRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef<number | null>(null);

  useEffect(() => {
    tgtRef.current = target;
    if (rafRef.current == null) tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function tick() {
    rafRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      const last = timeRef.current ?? now;
      const dt = Math.min(maxStep, (now - last) / 1000);
      timeRef.current = now;

      const x = valRef.current;
      const v = velRef.current;
      const to = tgtRef.current;

      // Hooke's law towards "to" with damping
      const k = stiffness;
      const c = damping;
      const m = mass;

      // F = -k(x - to) - c*v
      const F = -k * (x - to) - c * v;
      const a = F / m;

      const newV = v + a * dt;
      let newX = x + newV * dt;

      const done =
        Math.abs(newV) < precision && Math.abs(to - newX) < precision;

      velRef.current = done ? 0 : newV;
      valRef.current = done ? to : newX;

      setValue(valRef.current);

      if (!done) tick();
      else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        timeRef.current = null;
      }
    });
  }

  return value;
}

export default function Navbar() {
  const isDesktop = useMediaQuery("(min-width: 778px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Supabase auth state on the client
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIsLoggedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Scroll → target progress (0 → 1)
  const [scrollTarget, setScrollTarget] = useState(0);
  const maxScroll = 160;
  useEffect(() => {
    if (!isDesktop) {
      setScrollTarget(0);
      return;
    }
    const onScroll = () => {
      const t = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setScrollTarget(t);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDesktop]);

  // Springy progress for a soft, tiny bounce
  const progress = useSpringNumber(isDesktop ? scrollTarget : 0, {
    stiffness: 300,
    damping: 24,
  });

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
  const expandedMaxW = 840;
  const compactW = 360;
  const navWidth = Math.round(lerp(expandedMaxW, compactW));
  const padX = Math.round(lerp(20, 12));
  const padY = Math.round(lerp(10, 6));
  const gap = Math.round(lerp(20, 10));
  const labelOpacity = 1 - progress;
  const labelMaxW = Math.max(0, Math.round(lerp(96, 0)));
  const showIconsOnly = progress > 0.85 && isDesktop;

  const navItems = [
    { href: "#", label: "Home", icon: Home },
    { href: "#", label: "Explore", icon: Compass },
    { href: "#", label: "Create", icon: PenTool },
    { href: "#", label: "Community", icon: Users },
  ];

  const isDark = (mounted ? resolvedTheme : "light") === "dark";

  // Glass background styles as a separate layer (content stays crisp)
  const glassBg = {
    backdropFilter: "blur(16px) saturate(140%)",
    WebkitBackdropFilter: "blur(16px) saturate(140%)",
    background: isDark
      ? "linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.36))"
      : "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.38))",
  } as const;

  // Container frame (border + shadow)
  const frameStyle = {
    border: isDark
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: isDark
      ? "0 10px 28px rgba(0,0,0,0.35)"
      : "0 10px 28px rgba(2,6,23,0.12)",
  } as const;

  // Panel style for mobile dropdown
  const panelStyle = {
    backdropFilter: "blur(14px) saturate(140%)",
    WebkitBackdropFilter: "blur(14px) saturate(140%)",
    background: isDark
      ? "linear-gradient(180deg, rgba(15,23,42,0.58), rgba(15,23,42,0.42))"
      : "linear-gradient(180deg, rgba(255,255,255,0.70), rgba(255,255,255,0.50))",
    border: isDark
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: isDark
      ? "0 8px 28px rgba(0,0,0,0.35)"
      : "0 8px 28px rgba(2,6,23,0.12)",
  } as const;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="fixed top-4 inset-x-0 z-50 md:top-6">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-center gap-2 px-3 md:px-6">
          <nav
            style={{ width: isDesktop ? navWidth : undefined }}
            className={`${isDesktop ? "" : "w-[92vw] max-w-[640px]"} relative`}
            role="navigation"
          >
            <div
              className="relative rounded-full overflow-hidden isolate"
              style={frameStyle}
            >
              <div
                className="absolute inset-0 rounded-full -z-10"
                style={glassBg}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
                aria-hidden="true"
              />
              

              <div
                className="relative flex items-center justify-between subpixel-antialiased"
                style={{
                  gap: isDesktop ? gap : 12,
                  padding: `${isDesktop ? padY : 10}px ${
                    isDesktop ? padX : 14
                  }px`,
                }}
              >
                <Link href="/" className="flex items-center gap-2 select-none">
                  <Book className="w-4 h-4 text-foreground shrink-0" />
                  <span
                    className="text-sm md:text-base font-semibold text-foreground overflow-hidden whitespace-nowrap"
                    style={{
                      opacity: isDesktop ? labelOpacity : 1,
                      maxWidth: isDesktop ? labelMaxW : 200,
                    }}
                  >
                    Cookbook
                  </span>
                </Link>

                <div className="hidden md:flex items-center" style={{ gap }}>
                  {navItems.map(({ href, label, icon: Icon }) =>
                    showIconsOnly ? (
                      <Tooltip key={label}>
                        <TooltipTrigger asChild>
                          <Link
                            href={href}
                            className="flex items-center text-muted-foreground hover:text-foreground"
                          >
                            <Icon className="h-4 w-4" />
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
                        className="flex items-center text-muted-foreground hover:text-foreground"
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

                <div className="hidden md:flex items-center" style={{ gap: 12 }}>
                  <Link
                    href={isLoggedIn ? "/home" : "/signup"}
                    className="rounded-full text-foreground text-xs md:text-sm transition-transform"
                    style={{
                      padding: "8px 14px",
                      background: isDark
                        ? "linear-gradient(180deg, rgba(250,250,250,0.92), rgba(250,250,250,0.80))"
                        : "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.80))",
                      color: isDark ? "#0B1220" : "#FFFFFF",
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.16)"
                        : "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    {isLoggedIn
                      ? "Dashboard"
                      : isDesktop && progress >= 0.55
                      ? "Start"
                      : "Get Started"}
                  </Link>
                </div>

                <div className="md:hidden flex items-center gap-2">
                  <button
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen((v) => !v)}
                    className="p-2 rounded-full text-foreground hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                    style={{
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.10)"
                        : "1px solid rgba(255,255,255,0.45)",
                      background: isDark
                        ? "linear-gradient(180deg, rgba(15,23,42,0.40), rgba(15,23,42,0.28))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.35))",
                    }}
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

            {mobileOpen && (
              <div className="md:hidden absolute left-0 right-0 mt-2 z-50">
                <div className="rounded-2xl shadow-lg p-4" style={panelStyle}>
                  <div className="flex flex-col">
                    {navItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{label}</span>
                      </Link>
                    ))}
                    <div className="h-px my-2 bg-white/40 dark:bg-white/10" />
                    <Link
                      href={isLoggedIn ? "/home" : "/signup"}
                      className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="text-sm">{isLoggedIn ? "Dashboard" : "Get Started"}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {mounted && (
            <button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle theme"
              aria-pressed={resolvedTheme === "dark"}
              className="relative w-11 h-11 rounded-full flex items-center justify-center subpixel-antialiased backdrop-blur-md"
              style={{
                border: isDark
                  ? "1px solid rgba(255,255,255,0.10)"
                  : "1px solid rgba(0,0,0,0.08)",
                background: isDark
                  ? "linear-gradient(180deg, rgba(15,23,42,0.50), rgba(15,23,42,0.32))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.38))",
                boxShadow: isDark
                  ? "0 8px 24px rgba(0,0,0,0.35)"
                  : "0 8px 24px rgba(2,6,23,0.12)",
                transition: "transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
              onMouseDown={(e) => e.currentTarget.classList.add("scale-95")}
              onMouseUp={(e) => e.currentTarget.classList.remove("scale-95")}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                    : "inset 0 1px 0 rgba(255,255,255,0.65)",
                }}
              />
              <span className="relative z-10">
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5 text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground" />
                )}
              </span>
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
