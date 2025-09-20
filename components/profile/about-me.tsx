"use client";

import * as React from "react";
import {
  PencilLine,
  Save,
  X,
  Loader2,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Image as ImageIcon,
  Columns,
  Users,
  UserCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { Streamdown } from "streamdown";
import { updateAboutMe } from "@/util/actions/profileActions";

interface AboutMeSectionProps {
  profileInfo?: { bio?: string; backgroundUrl?: string | null };
  followCounts?: { followers: number; following: number };
  postCount?: number;
  canEdit?: boolean;
  className?: string;
}

export function AboutMeSection({
  profileInfo,
  followCounts,
  postCount,
  canEdit = true,
  className,
}: AboutMeSectionProps) {
  const followers = followCounts?.followers ?? 0;
  const following = followCounts?.following ?? 0;
  const posts = postCount ?? 0;

  const fmt = React.useMemo(
    () => new Intl.NumberFormat(undefined, { notation: "compact" }),
    []
  );

  const initialBio = (profileInfo?.bio ?? "").trim();
  const [bio, setBio] = React.useState(initialBio);
  const [draft, setDraft] = React.useState(initialBio);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Collapsed reading
  const [expanded, setExpanded] = React.useState(false);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const viewRef = React.useRef<HTMLDivElement>(null);

  // Editor helpers
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = React.useState(true); // desktop toggle
  const [mobileTab, setMobileTab] = React.useState<"write" | "preview">(
    "write"
  );

  React.useEffect(() => {
    const next = (profileInfo?.bio ?? "").trim();
    setBio(next);
    setDraft(next);
  }, [profileInfo?.bio]);

  React.useEffect(() => {
    const el = viewRef.current;
    if (!el) return;

    let raf = 0;

    const measure = () => {
      if (!el) return;
      // Only measure overflow when collapsed to avoid resize loops
      if (!expanded) {
        const overflowing = el.scrollHeight > el.clientHeight + 1;
        setIsOverflowing(overflowing);
      }
    };

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [bio, expanded]);

  // autosize textarea
  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 520) + "px";
  }, [draft, isEditing]);

  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && draft.trim() !== bio.trim()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isEditing, draft, bio]);

  const displayBio =
    bio || "No bio added yet. Use the edit button to add your bio.";

  async function handleSave() {
    setError(null);
    const next = draft.trim();
    try {
      setSaving(true);
      await updateAboutMe(next);
      setBio(next);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(bio);
    setIsEditing(false);
    setError(null);
  }

  function onEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!saving) void handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  }

  // Markdown helpers
  function surround(before: string, after = before, placeholder = "text") {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd, value } = ta;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const next =
      value.slice(0, selectionStart) +
      before +
      selected +
      after +
      value.slice(selectionEnd);
    setDraft(next);
    const cursorStart = selectionStart + before.length;
    const cursorEnd = cursorStart + selected.length;
    requestAnimationFrame(() => ta.setSelectionRange(cursorStart, cursorEnd));
  }

function toggleLinePrefix(prefix: string) {
  const ta = textareaRef.current;
  if (!ta) return;
  const { selectionStart, selectionEnd, value } = ta;

  const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const endIdx = value.indexOf("\n", selectionEnd);
  const end = endIdx === -1 ? value.length : endIdx;

  const block = value.slice(start, end);
  const lines = block.split("\n");

  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const willRemove = lines.every((l) => l.startsWith(prefix));
  const newLines = lines.map((l) =>
    willRemove ? l.replace(new RegExp("^" + escaped), "") : prefix + l
  );

  const replaced = newLines.join("\n");
  const next = value.slice(0, start) + replaced + value.slice(end);
  setDraft(next);

  const delta = replaced.length - block.length;
  requestAnimationFrame(() => ta.setSelectionRange(start, end + delta));
}

  function toggleHeading(level = 2) {
    toggleLinePrefix("#".repeat(level) + " ");
  }

  function insertLink() {
    const url = prompt("Enter URL");
    if (!url) return;
    surround("[", `](${url})`, "link text");
  }

  function insertImage() {
    const url = prompt("Enter image URL");
    if (!url) return;
    const alt = prompt("Alt text") || "image";
    surround(`![${alt}](`, ")", url);
  }

  return (
    <TooltipProvider>
      <div
        className={["max-w-4xl mx-auto", className].filter(Boolean).join(" ")}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-5">
            {profileInfo?.backgroundUrl ? (
              <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-2xl ring-1 ring-border">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${profileInfo.backgroundUrl})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">About</h3>
              {!isEditing && canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setIsEditing(true);
                    setExpanded(true);
                  }}
                >
                  <PencilLine className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            {!isEditing ? (
              <div className="relative">
                <article
                  ref={viewRef}
                  className={[
                    "prose prose-sm sm:prose-base prose-neutral dark:prose-invert",
                    "text-muted-foreground leading-7",
                    expanded ? "max-h-none" : "max-h-60 overflow-hidden",
                  ].join(" ")}
                >
                  <Streamdown>{displayBio}</Streamdown>
                </article>

                {!expanded && isOverflowing && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                )}

                {isOverflowing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs relative font-medium"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? (
                      <>
                        Show less <ChevronUp className="ml-1 h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={[
                  "group/edit rounded-2xl ring-1 ring-border",
                  "bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40",
                  "transition-shadow focus-within:ring-primary/50",
                ].join(" ")}
              >
                {/* Top chrome */}
                <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Editing bio</span>
                    <UnsavedDot active={draft.trim() !== bio.trim()} />
                    <span className="text-[11px] text-muted-foreground">
                      {draft.length} chars
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-xs text-muted-foreground mr-2">
                      {isMac() ? "⌘" : "Ctrl"} + Enter to save
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                      className="gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1.5"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 sm:px-3 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ToolbarButton
                      icon={<Bold className="h-4 w-4" />}
                      label="Bold"
                      onClick={() => surround("**")}
                    />
                    <ToolbarButton
                      icon={<Italic className="h-4 w-4" />}
                      label="Italic"
                      onClick={() => surround("*")}
                    />
                    <ToolbarButton
                      icon={<Heading2 className="h-4 w-4" />}
                      label="Heading"
                      onClick={() => toggleHeading(2)}
                    />
                    <ToolbarButton
                      icon={<List className="h-4 w-4" />}
                      label="Bulleted list"
                      onClick={() => toggleLinePrefix("- ")}
                    />
                    <ToolbarButton
                      icon={<ListOrdered className="h-4 w-4" />}
                      label="Numbered list"
                      onClick={() => toggleLinePrefix("1. ")}
                    />
                    <ToolbarButton
                      icon={<Quote className="h-4 w-4" />}
                      label="Quote"
                      onClick={() => toggleLinePrefix("> ")}
                    />
                    <ToolbarButton
                      icon={<Code className="h-4 w-4" />}
                      label="Inline code"
                      onClick={() => surround("`")}
                    />
                    <ToolbarButton
                      icon={<LinkIcon className="h-4 w-4" />}
                      label="Link"
                      onClick={insertLink}
                    />
                    <ToolbarButton
                      icon={<ImageIcon className="h-4 w-4" />}
                      label="Image"
                      onClick={insertImage}
                    />
                  </div>

                  {/* Desktop preview toggle */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview((v) => !v)}
                      className="gap-1.5"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Hide preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Show preview
                        </>
                      )}
                    </Button>
                    <div className="hidden md:flex h-8 items-center text-muted-foreground">
                      <Columns className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mobile: tabs */}
                <div className="md:hidden px-3 pt-3">
                  <Tabs
                    value={mobileTab}
                    onValueChange={(v) => setMobileTab(v as any)}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="write" className="h-8 px-3">
                        Write
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="h-8 px-3">
                        Preview
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="write" className="mt-3">
                      <EditorArea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onEditorKeyDown}
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="mt-3">
                      <PreviewArea value={draft} />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Desktop: resizable split */}
                <div className="hidden md:block">
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[320px]"
                  >
                    <ResizablePanel
                      defaultSize={showPreview ? 55 : 100}
                      minSize={30}
                    >
                      <div className="p-3">
                        <EditorArea
                          ref={textareaRef}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={onEditorKeyDown}
                        />
                      </div>
                    </ResizablePanel>
                    {showPreview && (
                      <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={45} minSize={25}>
                          <div className="p-3">
                            <PreviewArea value={draft} />
                          </div>
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </div>

                {error && (
                  <div className="px-4 py-3">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right: Stats (cards are fine) */}
          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StatRow
                    icon={<Users className="h-4 w-4" />}
                    label="Followers"
                    value={fmt.format(followers)}
                  />
                  <Separator />
                  <StatRow
                    icon={<UserCheck className="h-4 w-4" />}
                    label="Following"
                    value={fmt.format(following)}
                  />
                  <Separator />
                  <StatRow
                    icon={<FileText className="h-4 w-4" />}
                    label="Posts"
                    value={fmt.format(posts)}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

const PreviewArea = ({ value }: { value: string }) => (
  <article className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert">
    {value.trim() ? (
      <Streamdown>{value}</Streamdown>
    ) : (
      <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
    )}
  </article>
);

const EditorArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function EditorArea(props, ref) {
  return (
    <div className="rounded-xl border bg-background">
      <Textarea
        ref={ref}
        {...props}
        spellCheck
        placeholder="Write your bio in Markdown…"
        className={[
          "w-full resize-none border-0 bg-transparent focus-visible:ring-0",
          "px-3 py-3 min-h-[200px] leading-7 text-sm",
        ].join(" ")}
      />
    </div>
  );
});

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function UnsavedDot({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-block h-1.5 w-1.5 rounded-full transition-opacity",
        active ? "bg-primary opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function isMac() {
  if (typeof window === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);
}
