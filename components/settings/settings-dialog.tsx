"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Bell,
  CreditCard,
  Palette,
  Shield,
  User as UserIcon,
  Monitor,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Loader2,
  Sparkles,
  Coffee,
  Flower2,
  Zap,
  Mountain,
  type LucideIcon,
  Bird,
  Citrus,
  Music,
  Code,
  Check,
  Camera,
  X,
  Upload,
  Trash2,
  Sunset,
  Frame,
  Gem,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/util/supabase/client";
import { updateProfileAvatar } from "@/util/actions/profileActions";
import { useTheme } from "next-themes";
import { SectionHeader } from "./section-header";
import SettingsUserCard from "./settings-user-card";

export type SettingsDialogProps = {
  userId: string;
  name: string;
  email: string;
  imageSrc?: string | null;
  initialSection?: Section;
};

type Section =
  | "profile"
  | "account"
  | "security"
  | "notifications"
  | "appearance";

const NAV_ITEMS: {
  key: Section;
  label: string;
  icon: React.ElementType;
  color?: string;
}[] = [
  { key: "profile", label: "Profile", icon: UserIcon, color: "text-blue-500" },
  {
    key: "account",
    label: "Account",
    icon: CreditCard,
    color: "text-green-500",
  },
  { key: "security", label: "Security", icon: Shield, color: "text-red-500" },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    color: "text-yellow-500",
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: Palette,
    color: "text-purple-500",
  },
];

interface ColorPaletteConfig {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    background: string;
    foreground: string;
  };
  dataThemeAttribute?: string;
}

const COLOR_PALETTES: ColorPaletteConfig[] = [
  {
    id: "default",
    label: "Default",
    description:
      "A balanced, clean, and modern appearance suitable for any interface.",
    icon: Sparkles,
    preview: {
      primary: "bg-[#e5e5e5]",
      secondary: "bg-[#262626]",
      accent: "bg-[#404040]",
      muted: "bg-[#262626]",
      background: "bg-[#0a0a0a]",
      foreground: "bg-[#fafafa]",
    },
  },
  {
    id: "mocha-mousse",
    label: "Mocha Mousse",
    description:
      "Warm, soft, and cozy tones that bring a sense of comfort and familiarity.",
    icon: Coffee,
    preview: {
      primary: "bg-[#a67c52]",
      secondary: "bg-[#c4a574]",
      accent: "bg-[#b89968]",
      muted: "bg-[#d4c4a8]",
      background: "bg-[#f5f0e8]",
      foreground: "bg-[#5c4033]",
    },
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Bold neon colors with a futuristic and edgy aesthetic.",
    icon: Zap,
    preview: {
      primary: "bg-[#ff00c8]",
      secondary: "bg-[#00fff7]",
      accent: "bg-[#ffec00]",
      muted: "bg-[#1a1a1a]",
      background: "bg-[#0d0d0d]",
      foreground: "bg-[#e6e6e6]",
    },
  },
  {
    id: "claude",
    label: "Claude",
    description:
      "Minimal and thoughtful palette inspired by Anthropic's Claude.",
    icon: Flower2,
    preview: {
      primary: "bg-[#d97757]",
      secondary: "bg-[#faf9f5]",
      accent: "bg-[#1a1915]",
      muted: "bg-[#1b1b19]",
      background: "bg-[#262624]",
      foreground: "bg-[#c3c0b6]",
    },
  },
  {
    id: "twitter",
    label: "Twitter",
    description:
      "Bright, sleek palette inspired by Twitter's signature blue and dark tones.",
    icon: Bird,
    preview: {
      primary: "bg-[#1c9cf0]",
      secondary: "bg-[#f0f3f4]",
      accent: "bg-[#061622]",
      muted: "bg-[#181818]",
      background: "bg-[#000000]",
      foreground: "bg-[#e7e9ea]",
    },
  },
  {
    id: "ghibli-studio",
    label: "Ghibli Studio",
    description:
      "Earthy and nostalgic hues inspired by Studio Ghibli's warm aesthetic.",
    icon: Mountain,
    preview: {
      primary: "bg-[#8b906e]",
      secondary: "bg-[#3d332b]",
      accent: "bg-[#3d332b]",
      muted: "bg-[#2b2523]",
      background: "bg-[#1a1512]",
      foreground: "bg-[#e9d4b3]",
    },
  },
  {
    id: "tangerine",
    label: "Tangerine",
    description:
      "Playful, bright, and energetic colors that bring vibrancy to your UI.",
    icon: Citrus,
    preview: {
      primary: "bg-[#e05d38]",
      secondary: "bg-[#2a303e]",
      accent: "bg-[#2a3656]",
      muted: "bg-[#2a303e]",
      background: "bg-[#1c2433]",
      foreground: "bg-[#e5e5e5]",
    },
  },
  {
    id: "spotify",
    label: "Spotify",
    description:
      "A deep, dark theme highlighted with Spotify's signature green accent.",
    icon: Music,
    preview: {
      primary: "bg-[#00b262]",
      secondary: "bg-[#282d3d]",
      accent: "bg-[#282d3d]",
      muted: "bg-[#282d3d]",
      background: "bg-[#080b14]",
      foreground: "bg-[#e9f0f5]",
    },
  },
  {
    id: "vs-code",
    label: "VS Code",
    description:
      "Cool, focused tones inspired by Visual Studio Code's developer aesthetic.",
    icon: Code,
    preview: {
      primary: "bg-[#26acf4]",
      secondary: "bg-[#232838]",
      accent: "bg-[#232838]",
      muted: "bg-[#232838]",
      background: "bg-[#0e111b]",
      foreground: "bg-[#d8dfe4]",
    },
  },
  {
    id: "caffeine",
    label: "Caffeine",
    description:
      "High-contrast palette designed to keep you sharp and focused.",
    icon: Coffee,
    preview: {
      primary: "bg-[#fcdfc2]",
      secondary: "bg-[#3a3128]",
      accent: "bg-[#2b2b2b]",
      muted: "bg-[#222222]",
      background: "bg-[#121212]",
      foreground: "bg-[#eeeeee]",
    },
  },
  {
    id: "nature",
    label: "Nature",
    description:
      "Organic, earthy tones that bring a calming and natural balance.",
    icon: Flower2,
    preview: {
      primary: "bg-[#6a994e]",
      secondary: "bg-[#a7c957]",
      accent: "bg-[#f2e8cf]",
      muted: "bg-[#386641]",
      background: "bg-[#1e5128]",
      foreground: "bg-[#f1faee]",
    },
  },
  {
    id: "blue-print",
    label: "Blueprint",
    description:
      "A wireframe-inspired palette with structured lines and deep blueprint tones.",
    icon: Frame,
    preview: {
      primary: "bg-[#8b5cf6]",
      secondary: "bg-[#1e1b4b]",
      accent: "bg-[#4338ca]",
      muted: "bg-[#1e1b4b]",
      background: "bg-[#0f172a]",
      foreground: "bg-[#e0e7ff]",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    description:
      "Warm and radiant hues inspired by the calming beauty of a sunset.",
    icon: Sunset,
    preview: {
      primary: "bg-[#ff7e5f]",
      secondary: "bg-[#ffedea]",
      accent: "bg-[#feb47b]",
      muted: "bg-[#fff0eb]",
      background: "bg-[#fff9f5]",
      foreground: "bg-[#3d3436]",
    },
  },
  {
    id: "amethyst-haze",
    label: "Amethyst Haze",
    description:
      "Soft, dreamy purples and gentle tones that evoke the elegance of twilight.",
    icon: Gem,
    preview: {
      primary: "bg-[#8a79ab]",
      secondary: "bg-[#dfd9ec]",
      accent: "bg-[#e6a5b8]",
      muted: "bg-[#dcd9e3]",
      background: "bg-[#f8f7fa]",
      foreground: "bg-[#3d3c4f]",
    },
  },
  {
    id: "aurora-glow",
    label: "Aurora Glow",
    description:
      "A vibrant and colorful theme inspired by the natural phenomenon of the aurora borealis.",
    icon: Star,
    preview: {
      primary: "bg-[#00e0d7]",
      secondary: "bg-[#6262cc]",
      accent: "bg-[#1a2550]",
      muted: "bg-[#0d1936]",
      background: "bg-[#020819]",
      foreground: "bg-[#e9f3fb]",
    },
  },
];

const getPaletteConfig = (id: string): ColorPaletteConfig | undefined =>
  COLOR_PALETTES.find((p) => p.id === id);

type ThemeChoice = "system" | "light" | "dark";
type ColorPalette = (typeof COLOR_PALETTES)[number]["id"];

// Mobile-first settings with creative navigation
export function SettingsDialog({
  userId,
  name,
  email,
  imageSrc = null,
  initialSection = "profile",
}: SettingsDialogProps) {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [themeChoice, setThemeChoice] = React.useState<ThemeChoice>("system");
  const [colorPalette, setColorPalette] =
    React.useState<ColorPalette>("default");
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!mounted) return;
    if (theme === "system" || theme === "light" || theme === "dark") {
      setThemeChoice(theme);
    }
  }, [mounted, theme]);

  React.useEffect(() => {
    const saved = localStorage.getItem("color-palette");
    if (saved && getPaletteConfig(saved)) {
      setColorPalette(saved as ColorPalette);
      applyColorPalette(saved as ColorPalette);
    }
  }, []);

  const applyColorPalette = React.useCallback((paletteId: ColorPalette) => {
    const root = document.documentElement;
    root.removeAttribute("data-theme");
    if (paletteId !== "default") {
      const cfg = getPaletteConfig(paletteId);
      root.setAttribute("data-theme", cfg?.dataThemeAttribute ?? paletteId);
    }
    localStorage.setItem("color-palette", paletteId);
  }, []);

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
  const [active, setActive] = React.useState<Section>(initialSection);
  const [prevActive, setPrevActive] = React.useState<Section>(initialSection);

  // Track animation direction
  const isMovingForward =
    NAV_ITEMS.findIndex((i) => i.key === active) >
    NAV_ITEMS.findIndex((i) => i.key === prevActive);

  React.useEffect(() => {
    if (active !== prevActive) {
      setPrevActive(active);
    }
  }, [active]);

  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = React.useState(false);
  const effectiveImage =
    !imgError && !avatarRemoved ? localAvatar ?? imageSrc : null;

  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [tempImageUrl, setTempImageUrl] = React.useState<string | null>(null);
  const [croppedObjectUrl, setCroppedObjectUrl] = React.useState<string | null>(
    null
  );
  const [avatarOptionsOpen, setAvatarOptionsOpen] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (tempImageUrl?.startsWith("blob:")) URL.revokeObjectURL(tempImageUrl);
      if (croppedObjectUrl?.startsWith("blob:"))
        URL.revokeObjectURL(croppedObjectUrl);
    };
  }, [tempImageUrl, croppedObjectUrl]);

  const [savingSection, setSavingSection] = React.useState<Section | null>(
    null
  );
  const isSaving = (section: Section) => savingSection === section;

  const avatarInputId = React.useId();

  const onAvatarFile = (file?: File | null) => {
    if (!file) return;
    setAvatarOptionsOpen(false);
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedUrl: string, file: File) => {
    if (croppedObjectUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(croppedObjectUrl);
    }
    setLocalAvatar(croppedUrl);
    setCroppedObjectUrl(croppedUrl);
    setAvatarFile(file);
    setAvatarRemoved(false);
    setImgError(false);
    setCropperOpen(false);
    toast.success("Avatar updated", {
      description: `Optimized to ${formatFileSize(file.size)}`,
    });
  };

  const handleSave = async (section: Section) => {
    setSavingSection(section);
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

    const promise = (async () => {
      if (section === "profile" || section === "account") {
        const supabase = createClient();
        const newName = nameRef.current?.value?.trim() || "";
        const newEmail = emailRef.current?.value?.trim() || "";

        if (avatarFile || avatarRemoved) {
          const fd = new FormData();
          if (avatarFile) fd.append("avatar", avatarFile);
          if (avatarRemoved) fd.append("remove", "1");
          const result = await updateProfileAvatar({ ok: false }, fd);
          if (!result.ok)
            throw new Error(result.error || "Failed to update avatar");
          if (result.publicUrl === null) setLocalAvatar(null);
          else if (result.publicUrl) setLocalAvatar(result.publicUrl);
        }

        const updatePayload: any = {};
        if (section === "profile" && newName && newName !== trimmedName) {
          updatePayload.data = { display_name: newName };
        }
        if (newEmail && newEmail !== email) updatePayload.email = newEmail;

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase.auth.updateUser(updatePayload);
          if (error) throw error;
        }
      } else {
        await new Promise((res) => setTimeout(res, 400));
      }
    })();

    toast.promise(promise, {
      loading: `Saving ${sectionName}...`,
      success: `${sectionName} saved`,
      error: `Failed to save ${sectionName}`,
    });

    try {
      await promise;
    } finally {
      setSavingSection(null);
    }
  };

  const currentNav = NAV_ITEMS.find((item) => item.key === active);

  return (
    <>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden bg-background",
          // Mobile: fullscreen
          "w-screen h-[80svh] max-h-[100svh] rounded-none border-0",
          // Desktop: contained
          "sm:w-[900px] sm:max-w-[900px] sm:h-[640px] sm:rounded-xl sm:border"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header with Back Navigation */}
          <div className="md:hidden sticky top-0 z-30 border-b bg-background">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {currentNav && (
                  <>
                    <currentNav.icon
                      className={cn("h-5 w-5", currentNav.color)}
                    />
                    <span className="font-semibold">{currentNav.label}</span>
                  </>
                )}
              </div>
              {active !== "appearance" && (
                <Button
                  size="sm"
                  onClick={() => handleSave(active)}
                  disabled={isSaving(active)}
                  className="h-8 px-3"
                  aria-label="Save changes"
                >
                  {isSaving(active) ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">Save changes</span>
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <DialogHeader className="hidden md:block sticky top-0 z-20 border-b p-6 bg-background">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account preferences.
            </DialogDescription>
          </DialogHeader>

          {/* Main Content */}
          <div className="flex-1 grid min-h-0 grid-cols-1 md:grid-cols-[240px_1fr]">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block border-r overflow-y-auto">
              <div className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {effectiveImage && (
                      <AvatarImage
                        src={effectiveImage}
                        alt={trimmedName || "User"}
                        onError={() => setImgError(true)}
                      />
                    )}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {trimmedName || "User"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {email}
                    </div>
                  </div>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActive(key)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                        active === key
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content Area with Slide Animation */}
            <main
              className={cn(
                "relative min-h-0 overflow-hidden",
                "pb-20 md:pb-0" // Space for mobile bottom nav
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto p-4 md:p-6",
                  "animate-in fade-in-0 duration-200",
                  isMovingForward
                    ? "slide-in-from-right-10"
                    : "slide-in-from-left-10"
                )}
                key={active}
              >
                {active === "profile" && (
                  <section className="space-y-6">
                    <SectionHeader
                      title="Profile"
                      description="Update your personal information"
                    />

                    {/* Mobile-optimized Avatar Section */}
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                      <button
                        onClick={() => isMobile && setAvatarOptionsOpen(true)}
                        className="relative group cursor-pointer"
                      >
                        <Avatar className="h-24 w-24 sm:h-16 sm:w-16 ring-2 ring-border">
                          {effectiveImage && (
                            <AvatarImage
                              src={effectiveImage}
                              alt={trimmedName || "User"}
                              onError={() => setImgError(true)}
                            />
                          )}
                          <AvatarFallback className="text-2xl sm:text-lg">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {isMobile && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Desktop Avatar Actions */}
                      {!isMobile && (
                        <div className="space-x-2">
                          <input
                            id={avatarInputId}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onAvatarFile(e.target.files?.[0])}
                          />
                          <Button
                            variant="secondary"
                            onClick={() =>
                              document.getElementById(avatarInputId)?.click()
                            }
                          >
                            Upload new
                          </Button>
                          {effectiveImage && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setLocalAvatar(null);
                                setImgError(false);
                                setAvatarFile(null);
                                setAvatarRemoved(true);
                                toast("Avatar removed");
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          defaultValue={trimmedName}
                          ref={nameRef}
                          className="h-12 text-base sm:h-10 sm:text-sm"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          defaultValue={email}
                          type="email"
                          ref={emailRef}
                          className="h-12 text-base sm:h-10 sm:text-sm"
                        />
                      </div>
                    </div>
                  </section>
                )}

                {active === "account" && <SettingsUserCard />}

                {active === "security" && (
                  <section className="space-y-6">
                    <SectionHeader
                      title="Security"
                      description="Manage your account security"
                    />

                    <div className="space-y-4">
                      <Card
                        title="Password"
                        description="Change your password"
                        action={
                          <Button variant="outline" size="sm">
                            Update
                          </Button>
                        }
                      />

                      <Card
                        title="Two-factor authentication"
                        description="Add an extra layer of security"
                        action={
                          <Switch
                            onCheckedChange={(checked) =>
                              toast(checked ? "2FA enabled" : "2FA disabled")
                            }
                          />
                        }
                      />
                    </div>
                  </section>
                )}

                {active === "notifications" && (
                  <section className="space-y-6">
                    <SectionHeader
                      title="Notifications"
                      description="Choose how you receive updates"
                    />

                    <div className="space-y-2">
                      {[
                        {
                          label: "Product updates",
                          desc: "New features and improvements",
                        },
                        {
                          label: "Security alerts",
                          desc: "Important security notifications",
                        },
                        {
                          label: "Marketing",
                          desc: "Tips, offers, and announcements",
                        },
                      ].map((item) => (
                        <Card
                          key={item.label}
                          title={item.label}
                          description={item.desc}
                          action={
                            <Switch
                              onCheckedChange={(v) =>
                                toast(`${item.label} ${v ? "on" : "off"}`)
                              }
                            />
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}

                {active === "appearance" && (
                  <section className="space-y-6">
                    <SectionHeader
                      title="Appearance"
                      description="Customize your interface"
                    />

                    {/* Theme Selection - Mobile optimized */}
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Theme
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: "system" as const,
                            label: "Auto",
                            icon: Monitor,
                          },
                          {
                            value: "light" as const,
                            label: "Light",
                            icon: Sun,
                          },
                          { value: "dark" as const, label: "Dark", icon: Moon },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setThemeChoice(value);
                              setTheme(value);
                              toast(`Theme: ${label}`);
                            }}
                            className={cn(
                              "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                              themeChoice === value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{label}</span>
                            {themeChoice === value && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Palettes - Mobile optimized grid */}
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Color Scheme
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COLOR_PALETTES.map((palette) => (
                          <button
                            key={palette.id}
                            onClick={() => {
                              const id = palette.id as ColorPalette;
                              setColorPalette(id);
                              applyColorPalette(id);
                              toast(`Palette: ${palette.label}`);
                            }}
                            className={cn(
                              "relative rounded-lg border-2 p-3 text-left transition-all",
                              colorPalette === palette.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <palette.icon className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {palette.label}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {palette.description}
                            </div>
                            <ColorSwatches preview={palette.preview} />
                            {colorPalette === palette.id && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Navigation - Icon Only */}
          <div className="md:hidden sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur">
            <nav className="flex items-center justify-around py-2">
              {NAV_ITEMS.map(({ key, label, icon: Icon, color }) => {
                const isActive = active === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActive(key)}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2 rounded-lg transition-all",
                      "hover:bg-muted/50 active:scale-95",
                      isActive && "bg-muted"
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isActive ? color : "text-muted-foreground"
                      )}
                    />
                    <span className="sr-only">{label}</span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Save Button */}
          {active !== "appearance" && (
            <div className="hidden md:flex sticky bottom-0 border-t p-6 justify-end bg-background">
              <Button
                onClick={() => handleSave(active)}
                disabled={isSaving(active)}
              >
                {isSaving(active) ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Mobile Avatar Options Sheet */}
      <Sheet open={avatarOptionsOpen} onOpenChange={setAvatarOptionsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Change Avatar</SheetTitle>
            <SheetDescription>Choose an option</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            <input
              id={avatarInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onAvatarFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                document.getElementById(avatarInputId)?.click();
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setAvatarOptionsOpen(false);
                // Camera capture logic here
                toast("Camera not available in browser");
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
            {effectiveImage && (
              <Button
                variant="outline"
                className="justify-start text-destructive"
                onClick={() => {
                  setLocalAvatar(null);
                  setImgError(false);
                  setAvatarFile(null);
                  setAvatarRemoved(true);
                  setAvatarOptionsOpen(false);
                  toast("Avatar removed");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Current Photo
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Image Cropper */}
      {cropperOpen && tempImageUrl && (
        <MobileFriendlyCropper
          open={cropperOpen}
          onOpenChange={(open) => {
            setCropperOpen(open);
            if (!open && tempImageUrl?.startsWith("blob:")) {
              URL.revokeObjectURL(tempImageUrl);
              setTempImageUrl(null);
            }
          }}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}

// Mobile-optimized cropper
function MobileFriendlyCropper({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (url: string, file: File) => void;
}) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const { file, url } = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      );
      onCropComplete(url, file);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 w-screen h-[100svh] max-h-[100svh] rounded-none">
        {/* Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Crop Image</span>
          <Button size="sm" onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Done"
            )}
          </Button>
        </div>

        {/* Cropper */}
        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            showGrid={false}
          />
        </div>

        {/* Controls */}
        <div className="sticky bottom-0 z-30 border-t bg-background p-4 space-y-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={1}
              max={3}
              step={0.01}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation((r) => r - 90)}
            >
              <RotateCw className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation(0)}
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRotation((r) => r + 90)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility Components
function Card({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {action}
    </div>
  );
}

function ColorSwatches({
  preview,
}: {
  preview: ColorPaletteConfig["preview"];
}) {
  return (
    <div className="flex gap-1">
      <div className={cn("h-4 w-4 rounded", preview.primary)} />
      <div className={cn("h-4 w-4 rounded", preview.secondary)} />
      <div className={cn("h-4 w-4 rounded", preview.accent)} />
      <div className={cn("h-4 w-4 rounded", preview.background)} />
    </div>
  );
}

// Image processing utilities
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const maxSize = 384;
  const scale = Math.min(
    1,
    maxSize / Math.max(pixelCrop.width, pixelCrop.height)
  );

  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (rotation) {
    const rotRad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rotRad));
    const cos = Math.abs(Math.cos(rotRad));
    const newWidth = pixelCrop.width * cos + pixelCrop.height * sin;
    const newHeight = pixelCrop.width * sin + pixelCrop.height * cos;

    canvas.width = newWidth * scale;
    canvas.height = newHeight * scale;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotRad);
    ctx.translate(
      (-pixelCrop.width * scale) / 2,
      (-pixelCrop.height * scale) / 2
    );
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width * scale,
    pixelCrop.height * scale
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], "avatar.webp", { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        resolve({ file, url });
      },
      "image/webp",
      0.85
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

function ToggleRow({
  label,
  description,
  defaultChecked,
  onChange,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const [checked, setChecked] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="pr-4">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => {
          setChecked(v);
          onChange?.(v);
        }}
      />
    </div>
  );
}
