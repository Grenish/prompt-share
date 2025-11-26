"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Sun,
  Moon,
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
  Sunset,
  Frame,
  Gem,
  Star,
  CakeSlice,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { SectionHeader } from "./section-header";

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
  {
    id: "butterscotch",
    label: "Butterscotch",
    description:
      "Rich, warm tones inspired by the sweetness and comfort of butterscotch, evoking a cozy and inviting atmosphere",
    icon: CakeSlice,
    preview: {
      primary: "bg-[#cc9c42]",
      secondary: "bg-[#f7f2e3]",
      accent: "bg-[#f7f2e3]",
      muted: "bg-[#f7f2e3]",
      background: "bg-[#fffcf1]",
      foreground: "bg-[#3f3112]",
    },
  },
];

const getPaletteConfig = (id: string): ColorPaletteConfig | undefined =>
  COLOR_PALETTES.find((p) => p.id === id);

type ThemeChoice = "system" | "light" | "dark" | "time";
type ColorPalette = (typeof COLOR_PALETTES)[number]["id"];

export function SettingsAppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [themeChoice, setThemeChoice] = React.useState<ThemeChoice>("system");
  const [colorPalette, setColorPalette] =
    React.useState<ColorPalette>("default");

  React.useEffect(() => setMounted(true), []);

  const applyColorPalette = React.useCallback((paletteId: ColorPalette) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.removeAttribute("data-theme");
    if (paletteId !== "default") {
      const cfg = getPaletteConfig(paletteId);
      root.setAttribute("data-theme", cfg?.dataThemeAttribute ?? paletteId);
    }
    localStorage.setItem("color-palette", paletteId);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const savedThemeChoice = localStorage.getItem(
      "theme-choice",
    ) as ThemeChoice | null;
    if (
      savedThemeChoice &&
      (savedThemeChoice === "system" ||
        savedThemeChoice === "light" ||
        savedThemeChoice === "dark" ||
        savedThemeChoice === "time")
    ) {
      setThemeChoice(savedThemeChoice);
    } else if (theme === "system" || theme === "light" || theme === "dark") {
      setThemeChoice(theme);
    }
  }, [mounted, theme]);

  React.useEffect(() => {
    if (!mounted) return;

    // Check if data-theme attribute is already set (from blocking script)
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme && getPaletteConfig(currentTheme)) {
      setColorPalette(currentTheme as ColorPalette);
      return;
    }

    // Otherwise check localStorage
    const saved = localStorage.getItem("color-palette");
    if (saved && getPaletteConfig(saved)) {
      setColorPalette(saved as ColorPalette);
      applyColorPalette(saved as ColorPalette);
    }
  }, [mounted, applyColorPalette]);

  // Time-based theme switching
  React.useEffect(() => {
    if (themeChoice !== "time") return;

    const applyTimeBasedTheme = () => {
      const hour = new Date().getHours();
      // Light theme: 6 AM to 6 PM (6-17), Dark theme: 6 PM to 6 AM (18-5)
      const shouldBeDark = hour >= 18 || hour < 6;
      setTheme(shouldBeDark ? "dark" : "light");
    };

    // Apply immediately
    applyTimeBasedTheme();

    // Check every minute for theme changes
    const interval = setInterval(applyTimeBasedTheme, 60000);

    return () => clearInterval(interval);
  }, [themeChoice, setTheme]);

  return (
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              value: "time" as const,
              label: "Time",
              icon: Clock,
              description: "Auto-switch based on time of day",
            },
            {
              value: "system" as const,
              label: "System",
              icon: Monitor,
              description: "Match system preferences",
            },
            {
              value: "light" as const,
              label: "Light",
              icon: Sun,
              description: "Always light theme",
            },
            {
              value: "dark" as const,
              label: "Dark",
              icon: Moon,
              description: "Always dark theme",
            },
          ].map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              onClick={() => {
                setThemeChoice(value);
                localStorage.setItem("theme-choice", value);
                if (value !== "time") {
                  setTheme(value);
                }
                toast(`Theme: ${label}`, {
                  description: description,
                });
              }}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all",
                themeChoice === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
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
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <palette.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{palette.label}</span>
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
