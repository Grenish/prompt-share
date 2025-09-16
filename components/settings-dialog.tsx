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
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Download,
  Loader2,
  Sparkles,
  Coffee,
  Flower2,
  Zap,
  Mountain,
  type LucideIcon,
  Bird,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/util/supabase/client";
import {
  updateProfileAvatar,
  type UpdateProfileAvatarState,
} from "@/util/actions";
import { useTheme } from "next-themes";

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

const NAV_ITEMS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "account", label: "Account", icon: CreditCard },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
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
  dataThemeAttribute?: string; // Optional: only if different from id
}

const COLOR_PALETTES: ColorPaletteConfig[] = [
  {
    id: "default",
    label: "Default",
    description: "Clean and modern appearance",
    icon: Sparkles,
    preview: {
      primary: "bg-blue-600",
      secondary: "bg-yellow-500",
      accent: "bg-gray-200",
      muted: "bg-gray-100",
      background: "bg-white",
      foreground: "bg-gray-900",
    },
  },
  {
    id: "mocha-mousse",
    label: "Mocha Mousse",
    description: "Warm and cozy appearance",
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
    description: "Futuristic neon colors",
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
    description: "Inspired by Anthropic's Claude",
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
    description: "Inspired by Twitter's color scheme",
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
    description: "Inspired by Studio Ghibli's aesthetic",
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
];

const getPaletteConfig = (id: string): ColorPaletteConfig | undefined => {
  return COLOR_PALETTES.find((p) => p.id === id);
};

type ThemeChoice = "system" | "light" | "dark";
type ColorPalette = (typeof COLOR_PALETTES)[number]["id"];

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

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!mounted) return;
    if (theme === "system" || theme === "light" || theme === "dark") {
      setThemeChoice(theme);
    }
  }, [mounted, theme]);

  React.useEffect(() => {
    const savedPalette = localStorage.getItem("color-palette");
    // Validate that the saved palette exists in our configuration
    if (savedPalette && getPaletteConfig(savedPalette)) {
      setColorPalette(savedPalette as ColorPalette);
      applyColorPalette(savedPalette as ColorPalette);
    }
  }, []);

  const applyColorPalette = (paletteId: ColorPalette) => {
    const config = getPaletteConfig(paletteId);
    if (!config) return;

    // Remove all existing palette data-theme attributes
    COLOR_PALETTES.forEach((p) => {
      const attr = p.dataThemeAttribute || p.id;
      if (attr !== "default") {
        document.documentElement.removeAttribute(`data-theme`);
      }
    });

    // Apply new palette if not default
    if (paletteId !== "default") {
      const themeAttribute = config.dataThemeAttribute || config.id;
      document.documentElement.setAttribute("data-theme", themeAttribute);
    }

    localStorage.setItem("color-palette", paletteId);
  };

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

  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = React.useState(false);
  const effectiveImage =
    !imgError && !avatarRemoved ? localAvatar ?? imageSrc : null;

  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [tempImageUrl, setTempImageUrl] = React.useState<string | null>(null);

  const [savingSection, setSavingSection] = React.useState<Section | null>(
    null
  );
  const isSaving = (section: Section) => savingSection === section;

  const [avatarState, avatarAction] = React.useActionState<
    UpdateProfileAvatarState,
    FormData
  >(updateProfileAvatar, { ok: false, error: null, publicUrl: undefined });
  React.useEffect(() => {
    if (avatarState?.ok) {
      if (avatarState.publicUrl === null) {
        setLocalAvatar(null);
      } else if (avatarState.publicUrl) {
        setLocalAvatar(avatarState.publicUrl);
      }
    } else if (avatarState?.error) {
      toast.error(avatarState.error);
    }
  }, [avatarState]);

  const onAvatarFile = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedUrl: string, file: File) => {
    setLocalAvatar(croppedUrl);
    setAvatarFile(file);
    setAvatarRemoved(false);
    setImgError(false);
    setCropperOpen(false);
    toast.success("Avatar updated", {
      description: `Optimized to ${formatFileSize(
        file.size
      )}. Don't forget to save.`,
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

        const updatePayload: any = {
          data: { display_name: newName },
        };
        if (newEmail && newEmail !== email) updatePayload.email = newEmail;
        if (Object.keys(updatePayload).length > 0) {
          const { error: updateError } = await supabase.auth.updateUser(
            updatePayload
          );
          if (updateError) throw updateError;
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

  const paletteGridCols =
    COLOR_PALETTES.length <= 2
      ? "sm:grid-cols-2"
      : COLOR_PALETTES.length === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <DialogContent className="p-0 overflow-hidden w-[900px] h-[640px] sm:max-w-[900px] max-w-[95vw]">
        <div className="flex h-full flex-col">
          <DialogHeader className="shrink-0 border-b p-6">
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid min-h-0 grid-cols-1 md:grid-cols-[240px_1fr]">
            <aside className="border-r overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-1 ring-border">
                    {effectiveImage ? (
                      <AvatarImage
                        src={effectiveImage}
                        alt={trimmedName || "User"}
                        loading="lazy"
                        onError={() => setImgError(true)}
                      />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {initials}
                    </AvatarFallback>
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

                <nav aria-label="Settings sections" className="space-y-1">
                  {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                    const activeItem = active === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActive(key)}
                        aria-current={activeItem ? "page" : undefined}
                        className={[
                          "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                          activeItem
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                          "transition-colors",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            <main
              className={[
                "p-4 md:p-6",
                active === "appearance"
                  ? "overflow-hidden min-h-0"
                  : "overflow-y-auto",
              ].join(" ")}
            >
              {active === "profile" && (
                <section>
                  <SectionHeader
                    title="Profile"
                    description="Update your name, avatar, and contact information."
                  />

                  <div className="mt-6 grid gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-1 ring-border">
                        {effectiveImage ? (
                          <AvatarImage
                            src={effectiveImage}
                            alt={trimmedName || "User"}
                            loading="lazy"
                            onError={() => setImgError(true)}
                          />
                        ) : null}
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-x-2">
                        <label htmlFor="avatar" className="sr-only">
                          Upload avatar
                        </label>
                        <input
                          id="avatar"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onAvatarFile(e.target.files?.[0])}
                        />
                        <Button
                          variant="secondary"
                          onClick={() =>
                            document.getElementById("avatar")?.click()
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
                              toast("Avatar removed", {
                                description:
                                  "Your initials will be used instead.",
                              });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          defaultValue={trimmedName}
                          ref={nameRef}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          defaultValue={email}
                          type="email"
                          ref={emailRef}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {active === "account" && (
                <section>
                  <SectionHeader
                    title="Account"
                    description="Basic account information and preferences."
                  />
                  <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="your-handle" />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {active === "security" && (
                <section>
                  <SectionHeader
                    title="Security"
                    description="Manage password and two-factor authentication."
                  />
                  <div className="mt-6 grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">
                          Current password
                        </Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">
                          Confirm password
                        </Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          Two-factor authentication
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Add an extra layer of security to your account.
                        </div>
                      </div>
                      <Switch
                        onCheckedChange={(checked) =>
                          toast(
                            checked
                              ? "Two-factor authentication enabled"
                              : "Two-factor authentication disabled",
                            {
                              description:
                                "This will be applied when you save changes.",
                            }
                          )
                        }
                      />
                    </div>
                  </div>
                </section>
              )}

              {active === "notifications" && (
                <section>
                  <SectionHeader
                    title="Notifications"
                    description="Choose how you want to receive updates."
                  />
                  <div className="mt-6 grid gap-6">
                    <div className="space-y-4">
                      <ToggleRow
                        label="Product updates"
                        description="Announcements and release notes."
                        onChange={(v) =>
                          toast(
                            `Product updates ${v ? "enabled" : "disabled"}`,
                            {
                              description:
                                "This will be applied when you save changes.",
                            }
                          )
                        }
                      />
                      <ToggleRow
                        label="Email notifications"
                        description="Get important updates by email."
                        onChange={(v) =>
                          toast(
                            `Email notifications ${v ? "enabled" : "disabled"}`,
                            {
                              description:
                                "This will be applied when you save changes.",
                            }
                          )
                        }
                      />
                      <ToggleRow
                        label="Marketing emails"
                        description="Occasional product tips and offers."
                        onChange={(v) =>
                          toast(
                            `Marketing emails ${v ? "enabled" : "disabled"}`,
                            {
                              description:
                                "This will be applied when you save changes.",
                            }
                          )
                        }
                      />
                    </div>
                  </div>
                </section>
              )}

              {active === "appearance" && (
                <ScrollArea className="h-[500px] pr-5">
                  <section className="space-y-6">
                    <div>
                      <SectionHeader
                        title="Appearance"
                        description="Choose a theme. Preview cards show how the UI will look."
                      />
                      <div
                        role="radiogroup"
                        aria-label="Theme"
                        className="mt-6 grid gap-4 sm:grid-cols-3"
                      >
                        <ThemeOptionButton
                          value="system"
                          label="System"
                          Icon={Monitor}
                          selected={themeChoice === "system"}
                          onSelect={(v) => {
                            setThemeChoice(v);
                            setTheme(v);
                            toast("Theme set to System", {
                              description: "Applied immediately.",
                            });
                          }}
                        />
                        <ThemeOptionButton
                          value="light"
                          label="Light"
                          Icon={Sun}
                          selected={themeChoice === "light"}
                          onSelect={(v) => {
                            setThemeChoice(v);
                            setTheme(v);
                            toast("Theme set to Light", {
                              description: "Applied immediately.",
                            });
                          }}
                        />
                        <ThemeOptionButton
                          value="dark"
                          label="Dark"
                          Icon={Moon}
                          selected={themeChoice === "dark"}
                          onSelect={(v) => {
                            setThemeChoice(v);
                            setTheme(v);
                            toast("Theme set to Dark", {
                              description: "Applied immediately.",
                            });
                          }}
                        />
                      </div>
                    </div>

                    {COLOR_PALETTES.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <SectionHeader
                            title="Special"
                            description="Choose a unique color palette for your interface."
                          />
                          <div
                            role="radiogroup"
                            aria-label="Color Palette"
                            className={`mt-6 grid gap-4 ${paletteGridCols}`}
                          >
                            {COLOR_PALETTES.map((palette) => (
                              <ColorPaletteOptionButton
                                key={palette.id}
                                config={palette}
                                selected={colorPalette === palette.id}
                                onSelect={() => {
                                  setColorPalette(palette.id as ColorPalette);
                                  applyColorPalette(palette.id as ColorPalette);
                                  toast(
                                    `Color palette set to ${palette.label}`,
                                    {
                                      description: palette.description,
                                    }
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                </ScrollArea>
              )}
            </main>
          </div>

          {active !== "appearance" && (
            <div className="shrink-0 border-t p-4 md:p-6 flex justify-end">
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

      {/* Image Cropper Dialog */}
      {cropperOpen && tempImageUrl && (
        <ImageCropper
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </>
  );
}

// Image Cropper Component
interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImage: string, file: File) => void;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
}

function ImageCropper({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  aspectRatio = 1,
  cropShape = "round",
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [quality, setQuality] = React.useState("balanced");
  const [previewStats, setPreviewStats] = React.useState<{
    originalSize: string;
    estimatedSize: string;
  } | null>(null);

  React.useEffect(() => {
    if (imageUrl) {
      fetch(imageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const originalSize = formatFileSize(blob.size);
          const estimatedSize = formatFileSize(
            blob.size * getQualityMultiplier(quality)
          );
          setPreviewStats({ originalSize, estimatedSize });
        });
    }
  }, [imageUrl, quality]);

  const onCropAreaChange = React.useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const { file, url } = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation,
        quality
      );

      onCropComplete(url, file);
      onOpenChange(false);
      resetState();
    } catch (error) {
      toast.error("Failed to process image");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Crop & Optimize Image</DialogTitle>
          <DialogDescription>
            Adjust your image and we'll optimize it for web use
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[400px] bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropAreaChange}
            showGrid={false}
            style={{
              containerStyle: {
                background: "hsl(var(--muted))",
              },
            }}
          />
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Zoom</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={1}
                max={3}
                step={0.01}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Rotation</Label>
              <span className="text-sm text-muted-foreground">{rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setRotation(0)}
              >
                <Maximize className="h-3 w-3" />
              </Button>
              <Slider
                value={[rotation]}
                onValueChange={([v]) => setRotation(v)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setRotation((r) => r + 90)}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quality" className="text-sm">
                Optimization Level
              </Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    High Quality (Larger file)
                  </SelectItem>
                  <SelectItem value="balanced">
                    Balanced (Recommended)
                  </SelectItem>
                  <SelectItem value="optimized">
                    Max Optimization (Smaller file)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {previewStats && (
              <div className="space-y-2">
                <Label className="text-sm">File Size</Label>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original:</span>
                    <span>{previewStats.originalSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ~{previewStats.estimatedSize}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t p-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save & Optimize
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility functions
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  quality = "balanced"
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  const maxSize = getMaxSize(quality);
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
      async (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }

        const file = new File([blob], "avatar.webp", { type: "image/webp" });
        const url = URL.createObjectURL(blob);
        resolve({ file, url });
      },
      "image/webp",
      getCompressionQuality(quality)
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

function getMaxSize(quality: string): number {
  switch (quality) {
    case "high":
      return 512;
    case "optimized":
      return 256;
    default:
      return 384;
  }
}

function getCompressionQuality(quality: string): number {
  switch (quality) {
    case "high":
      return 0.95;
    case "optimized":
      return 0.75;
    default:
      return 0.85;
  }
}

function getQualityMultiplier(quality: string): number {
  switch (quality) {
    case "high":
      return 0.7;
    case "optimized":
      return 0.3;
    default:
      return 0.5;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
}

// Helper components
function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
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

function ThemeOptionButton({
  value,
  label,
  Icon,
  selected,
  onSelect,
}: {
  value: ThemeChoice;
  label: string;
  Icon: React.ElementType;
  selected: boolean;
  onSelect: (v: ThemeChoice) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={[
        "group relative flex min-w-0 flex-col gap-3 rounded-lg border-2 p-3 text-left",
        "transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={[
              "h-4 w-4",
              selected ? "text-primary" : "text-muted-foreground",
            ].join(" ")}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {selected && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <svg
              className="h-2.5 w-2.5 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
            </svg>
          </div>
        )}
      </div>
      <ThemePreview variant={value} />
    </button>
  );
}

function ThemePreview({ variant }: { variant: ThemeChoice }) {
  if (variant === "system") {
    return (
      <div className="flex h-20 gap-1 rounded-md overflow-hidden">
        <MiniPreview theme="light" className="flex-1" />
        <MiniPreview theme="dark" className="flex-1" />
      </div>
    );
  }
  return (
    <div className="h-20 rounded-md overflow-hidden">
      <MiniPreview theme={variant} />
    </div>
  );
}

function MiniPreview({
  theme,
  className,
}: {
  theme: "light" | "dark";
  className?: string;
}) {
  const isLight = theme === "light";

  const colors = {
    bg: isLight ? "bg-white" : "bg-zinc-950",
    bgSecondary: isLight ? "bg-gray-50" : "bg-zinc-900",
    border: isLight ? "border-gray-200" : "border-zinc-800",
    text: isLight ? "text-gray-900" : "text-zinc-100",
    muted: isLight ? "bg-gray-100" : "bg-zinc-800",
    primary: isLight ? "bg-blue-600" : "bg-blue-500",
    accent: isLight ? "bg-gray-200" : "bg-zinc-700",
  };

  return (
    <div
      className={[
        "relative flex h-full w-full flex-col border",
        colors.bg,
        colors.border,
        className || "",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-1 border-b px-2 py-1",
          colors.border,
        ].join(" ")}
      >
        <div className="flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-400/60" />
        </div>
        <div
          className={["ml-auto h-1.5 w-8 rounded-sm", colors.muted].join(" ")}
        />
      </div>

      <div className="flex flex-1">
        <div
          className={["w-8 border-r", colors.bgSecondary, colors.border].join(
            " "
          )}
        >
          <div className="space-y-1 p-1">
            <div
              className={["h-3 w-full rounded-sm", colors.primary].join(" ")}
            />
            <div
              className={["h-3 w-full rounded-sm", colors.accent].join(" ")}
            />
            <div
              className={["h-3 w-full rounded-sm", colors.accent].join(" ")}
            />
          </div>
        </div>

        <div className="flex-1 p-2">
          <div className="space-y-1.5">
            <div
              className={["h-1.5 w-10 rounded-sm", colors.accent].join(" ")}
            />
            <div className="flex gap-1">
              <div
                className={["h-4 flex-1 rounded-sm", colors.muted].join(" ")}
              />
              <div
                className={["h-4 flex-1 rounded-sm", colors.muted].join(" ")}
              />
            </div>
            <div className={["h-3 w-6 rounded-sm", colors.primary].join(" ")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPaletteOptionButton({
  config,
  selected,
  onSelect,
}: {
  config: ColorPaletteConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  const { label, icon: Icon } = config;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${label} color palette`}
      onClick={onSelect}
      className={[
        "group relative flex min-w-0 flex-col gap-3 rounded-lg border-2 p-4 text-left",
        "transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={[
              "h-4 w-4",
              selected ? "text-primary" : "text-muted-foreground",
            ].join(" ")}
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        {selected && (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
            <svg
              className="h-2.5 w-2.5 text-primary-foreground"
              fill="currentColor"
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
            </svg>
          </div>
        )}
      </div>
      <ColorPalettePreview config={config} />
    </button>
  );
}

function ColorPalettePreview({ config }: { config: ColorPaletteConfig }) {
  const { preview } = config;

  return (
    <div className="flex gap-2 p-3 rounded-md border bg-card">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex gap-1">
          <div
            className={["h-8 w-8 rounded-md", preview.primary].join(" ")}
            title="Primary"
            aria-label="Primary color"
          />
          <div
            className={["h-8 w-8 rounded-md", preview.secondary].join(" ")}
            title="Secondary"
            aria-label="Secondary color"
          />
          <div
            className={["h-8 w-8 rounded-md", preview.accent].join(" ")}
            title="Accent"
            aria-label="Accent color"
          />
        </div>
        <div className="flex gap-1">
          <div
            className={["h-4 flex-1 rounded", preview.muted].join(" ")}
            title="Muted"
            aria-label="Muted color"
          />
          <div
            className={["h-4 w-4 rounded", preview.foreground].join(" ")}
            title="Text"
            aria-label="Text color"
          />
        </div>
      </div>
      <div
        className={["w-12 rounded-md", preview.background].join(" ")}
        title="Background"
        aria-label="Background color"
      />
    </div>
  );
}
