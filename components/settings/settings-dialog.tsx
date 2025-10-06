"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Loader2,
  Check,
  Camera,
  X,
  Upload,
  Trash2,
  Pencil,
  Images,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/util/supabase/client";
import { updateProfileAvatar } from "@/util/actions/profileActions";
import { SectionHeader } from "./section-header";
import SettingsUserCard from "./settings-user-card";
import UserSettingsCard from "./settings-userSettings-card";
import { SettingsAppearanceCard } from "./settings-appearance-card";
import SettingsNotificationCard from "./settings-notifications-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export type SettingsDialogProps = {
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

// Mobile-first settings with creative navigation
export function SettingsDialog({
  name,
  email,
  imageSrc = null,
  initialSection = "profile",
}: SettingsDialogProps) {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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

  // UI-only state
  const [editingName, setEditingName] = React.useState(false);
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [avatarGalleryOpen, setAvatarGalleryOpen] = React.useState(false);

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
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const onAvatarFile = (file?: File | null) => {
    if (!file) return;
    setAvatarOptionsOpen(false);
    const url = URL.createObjectURL(file);
    setTempImageUrl(url);
    setCropperOpen(true);
    // Reset input value so same file can be selected again
    if (avatarInputRef.current) avatarInputRef.current.value = "";
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
      {/* Single file input for avatar upload, used by both desktop and mobile */}
      <input
        id={avatarInputId}
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onAvatarFile(e.target.files?.[0])}
      />

      <DialogContent
        className={cn(
          "p-0 overflow-hidden bg-background",
          // Mobile: fullscreen
          "w-screen h-[80svh] max-h-[100svh] rounded-none border-0",
          // Desktop: contained
          "sm:w-[900px] sm:max-w-[900px] sm:h-[640px] sm:rounded-xl sm:border"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account preferences.
          </DialogDescription>
        </DialogHeader>
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
                  "animate-in fade-in-0 duration-200"
                )}
                key={active}
              >
                {active === "profile" && (
                  <section className="space-y-6">
                    <SectionHeader
                      title="Profile"
                      description="Update your personal information"
                    />

                    <div className="grid gap-6">
                      {/* Avatar card */}
                      <div className="rounded-xl border bg-card text-card-foreground p-6">
                        <div className="flex flex-col items-center text-center gap-4">
                          {/* Desktop: dropdown on click. Mobile: open bottom sheet. */}
                          {isMobile ? (
                            <button
                              type="button"
                              aria-label="Edit avatar"
                              onClick={() => setAvatarOptionsOpen(true)}
                              className="group relative block rounded-full outline-none"
                            >
                              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-2 ring-border shadow-sm transition-transform group-active:scale-95">
                                {effectiveImage && (
                                  <AvatarImage
                                    src={effectiveImage}
                                    alt={trimmedName || "User"}
                                    onError={() => setImgError(true)}
                                  />
                                )}
                                <AvatarFallback className="text-2xl">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </span>
                              </div>
                            </button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Avatar actions"
                                  className="group relative block rounded-full outline-none"
                                >
                                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-2 ring-border shadow-sm transition-transform group-active:scale-95">
                                    {effectiveImage && (
                                      <AvatarImage
                                        src={effectiveImage}
                                        alt={trimmedName || "User"}
                                        onError={() => setImgError(true)}
                                      />
                                    )}
                                    <AvatarFallback className="text-2xl">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                                      <Pencil className="h-3.5 w-3.5" />
                                      Edit photo
                                    </span>
                                  </div>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="center"
                                className="w-48"
                              >
                                <DropdownMenuItem
                                  onClick={() => {
                                    avatarInputRef.current?.click();
                                  }}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload photo
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setAvatarGalleryOpen(true)}
                                >
                                  <Images className="mr-2 h-4 w-4" />
                                  Browse avatars
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={!effectiveImage}
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setLocalAvatar(null);
                                    setImgError(false);
                                    setAvatarFile(null);
                                    setAvatarRemoved(true);
                                    toast("Avatar removed");
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove photo
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          <p className="text-sm text-muted-foreground">
                            Recommended 256×256+; JPG, PNG, or WebP. Cropped to
                            a circle.
                          </p>
                        </div>
                      </div>

                      {/* Info card */}
                      <div className="rounded-xl border bg-card text-card-foreground p-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                          {/* Name */}
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="name">Display name</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 gap-1.5"
                                onClick={() => {
                                  setEditingName((v) => !v);
                                  if (!editingName) {
                                    setTimeout(
                                      () => nameRef.current?.focus(),
                                      0
                                    );
                                  }
                                }}
                              >
                                {editingName ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Done
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </>
                                )}
                              </Button>
                            </div>
                            <Input
                              id="name"
                              defaultValue={trimmedName}
                              ref={nameRef}
                              disabled={!editingName}
                              className="h-11 sm:h-10 text-sm disabled:opacity-100 disabled:bg-muted/50"
                              aria-describedby="name-hint"
                            />
                            <p
                              id="name-hint"
                              className="text-xs text-muted-foreground"
                            >
                              This is your public name. Use Save to apply
                              changes.
                            </p>
                          </div>

                          {/* Email */}
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="email">Email</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 gap-1.5"
                                onClick={() => {
                                  setEditingEmail((v) => !v);
                                  if (!editingEmail) {
                                    setTimeout(
                                      () => emailRef.current?.focus(),
                                      0
                                    );
                                  }
                                }}
                              >
                                {editingEmail ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Done
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </>
                                )}
                              </Button>
                            </div>
                            <Input
                              id="email"
                              defaultValue={email}
                              type="email"
                              ref={emailRef}
                              disabled={!editingEmail}
                              className="h-11 sm:h-10 text-sm disabled:opacity-100 disabled:bg-muted/50"
                              aria-describedby="email-hint"
                            />
                            <p
                              id="email-hint"
                              className="text-xs text-muted-foreground"
                            >
                              Changing your email may require re‑verification.
                              Remember to Save.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Browse avatars dialog (skeleton only) */}
                    <Dialog
                      open={avatarGalleryOpen}
                      onOpenChange={setAvatarGalleryOpen}
                    >
                      <DialogContent className="sm:max-w-[560px]">
                        <DialogHeader>
                          <DialogTitle>Choose an avatar</DialogTitle>
                          <DialogDescription>
                            Pick from our preset gallery.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-[60vh] overflow-auto pt-2">
                          {Array.from({ length: 18 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              className="group relative aspect-square rounded-full ring-1 ring-border hover:ring-primary/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              disabled
                            >
                              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-muted">
                                <Skeleton className="h-full w-full rounded-full" />
                              </div>
                              <span className="sr-only">Avatar {i + 1}</span>
                            </button>
                          ))}
                        </div>

                        <p className="text-xs text-muted-foreground pt-2">
                          Preset avatars coming soon.
                        </p>
                      </DialogContent>
                    </Dialog>
                  </section>
                )}

                {active === "account" && <SettingsUserCard />}

                {active === "security" && <UserSettingsCard />}

                {active === "notifications" && <SettingsNotificationCard />}

                {active === "appearance" && <SettingsAppearanceCard />}
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
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                avatarInputRef.current?.click();
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

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

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
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0 overflow-hidden
          w-[min(100vw,640px)] sm:max-w-[640px]
          max-h-[90svh]
          rounded-none sm:rounded-xl
        "
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust your new avatar before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[90svh] flex-col">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-30 flex items-center justify-between p-4 border-b bg-background">
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

          <div
            className="
              relative w-full bg-black
              h-[min(60svh,420px)] sm:h-[360px]
            "
          >
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={(z) => setZoom(z)}
              onRotationChange={setRotation}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              showGrid={false}
              zoomWithScroll
              restrictPosition
            />
          </div>

          {/* Controls */}
          <div className="shrink-0 sticky bottom-0 z-30 border-t bg-background p-4 space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={1}
                max={3}
                step={0.01}
                className="flex-1"
                aria-label="Zoom"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation((r) => r - 90)}
                aria-label="Rotate left"
              >
                <RotateCw className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation(0)}
                aria-label="Reset rotation"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation((r) => r + 90)}
                aria-label="Rotate right"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <div className="mx-2 h-4 w-px bg-border" />
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getRadianAngle(deg: number) {
  return (deg * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  opts?: {
    maxSize?: number; // longest side in px
    quality?: number; // 0..1
    mimeType?: "image/webp" | "image/png" | "image/jpeg";
    circleMask?: boolean; // optional: output round image
  }
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc);

  const maxSize = opts?.maxSize ?? 384;
  const quality = opts?.quality ?? 0.9;
  const mimeType = opts?.mimeType ?? "image/webp";

  const { width: bW, height: bH } = rotateSize(
    image.width,
    image.height,
    rotation
  );
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = Math.max(1, Math.round(bW));
  tmpCanvas.height = Math.max(1, Math.round(bH));
  const tctx = tmpCanvas.getContext("2d", { willReadFrequently: true });
  if (!tctx) throw new Error("No 2d context");

  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";

  tctx.translate(tmpCanvas.width / 2, tmpCanvas.height / 2);
  tctx.rotate(getRadianAngle(rotation));
  tctx.translate(-image.width / 2, -image.height / 2);
  tctx.drawImage(image, 0, 0);

  const scale = Math.min(
    1,
    maxSize / Math.max(pixelCrop.width, pixelCrop.height)
  );
  const outW = Math.max(1, Math.round(pixelCrop.width * scale));
  const outH = Math.max(1, Math.round(pixelCrop.height * scale));

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const octx = outCanvas.getContext("2d");
  if (!octx) throw new Error("No 2d context");

  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";

  octx.drawImage(
    tmpCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  if (opts?.circleMask) {
    octx.globalCompositeOperation = "destination-in";
    octx.beginPath();
    octx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2);
    octx.closePath();
    octx.fill();
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas is empty"))),
      mimeType,
      quality
    );
  });

  const file = new File([blob], "avatar.webp", { type: mimeType });
  const url = URL.createObjectURL(blob);
  return { file, url };
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = (event: Event | string) => reject(event);
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
