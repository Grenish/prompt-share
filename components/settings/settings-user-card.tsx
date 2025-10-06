"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/util/supabase/client";

import { SectionHeader } from "./section-header";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { Skeleton } from "../ui/skeleton";

function isValidUsername(name: string) {
  // Adjust rules as needed
  return /^[a-zA-Z0-9_]{3,32}$/.test(name);
}

export default function SettingsUserCard() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [savedUsername, setSavedUsername] = useState("");
  const [username, setUsername] = useState("");

  // Availability check state
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Save status
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Delete dialog state (UI only)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load user + current username
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setSaveError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (alive) {
          setSaveError("Not authenticated");
          setLoading(false);
        }
        return;
      }
      setUserId(user.id);

      const { data: row, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        if (alive) {
          setSaveError(profileError.message);
          setLoading(false);
        }
        return;
      }

      const current = (row as any)?.username ?? "";
      if (alive) {
        setSavedUsername(current);
        setUsername(current);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  // Debounced availability check on username change
  useEffect(() => {
    if (!userId) return;

    const trimmed = username.trim();
    setSaveMessage(null);
    setSaveError(null);

    // Clear any running debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Reset states first
    setChecking(false);
    setAvailable(null);
    setCheckError(null);

    // No input
    if (!trimmed) return;

    // No change from saved
    if (trimmed === savedUsername.trim()) return;

    // Invalid format
    if (!isValidUsername(trimmed)) {
      setCheckError("Use 3–32 characters: letters, numbers, underscores.");
      return;
    }

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      // Query to see if username exists for another user
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .limit(1);

      if (error) {
        setCheckError("Couldn't check availability. Try again.");
        setAvailable(null);
        setChecking(false);
        return;
      }

      const takenBy = data?.[0]?.id;
      if (takenBy && takenBy !== userId) {
        setAvailable(false);
      } else {
        setAvailable(true);
      }
      setChecking(false);
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, savedUsername, supabase, userId]);

  const handleSave = useCallback(async () => {
    if (saving) return;

    const trimmed = username.trim();
    setSaveError(null);
    setSaveMessage(null);

    // Guard conditions
    if (!userId) {
      setSaveError("Not authenticated");
      return;
    }
    if (!trimmed) {
      setSaveError("Username cannot be empty");
      return;
    }
    if (trimmed === savedUsername.trim()) {
      setSaveError("No changes to save");
      return;
    }
    if (!isValidUsername(trimmed)) {
      setSaveError("Use 3–32 characters: letters, numbers, underscores.");
      return;
    }
    if (checking) return;
    if (available !== true) {
      setSaveError("Please choose an available username");
      return;
    }

    setSaving(true);
    try {
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: userId, username: trimmed }, { onConflict: "id" });

      if (upsertError) {
        setSaveError(upsertError.message);
      } else {
        setSavedUsername(trimmed);
        setSaveMessage("Saved");
        // Reset availability states after saving
        setAvailable(null);
        setCheckError(null);
      }
    } catch (e: any) {
      setSaveError(e?.message || "Failed to save username");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 2200);
    }
  }, [saving, userId, username, savedUsername, available, checking, supabase]);

  const handleCancel = () => {
    setUsername(savedUsername);
    setSaveError(null);
    setSaveMessage(null);
    setAvailable(null);
    setCheckError(null);
    setChecking(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const isDirty = username.trim() !== savedUsername.trim();
  const canSave =
    !loading &&
    !saving &&
    isDirty &&
    isValidUsername(username.trim()) &&
    !checking &&
    available === true;

  // Status line logic
  const status = (() => {
    if (loading)
      return { text: "Loading profile…", cls: "text-muted-foreground" };
    if (saving) return { text: "Saving…", cls: "text-muted-foreground" };
    if (saveError) return { text: saveError, cls: "text-destructive" };
    if (saveMessage) return { text: saveMessage, cls: "text-green-600" };

    const trimmed = username.trim();
    if (!trimmed) return { text: " ", cls: "text-muted-foreground" };
    if (!isDirty)
      return {
        text: "This is your current username.",
        cls: "text-muted-foreground",
      };
    if (!isValidUsername(trimmed))
      return {
        text: "Use 3-32 characters: letters, numbers, underscores.",
        cls: "text-destructive",
      };
    if (checking)
      return { text: "Checking availability…", cls: "text-muted-foreground" };
    if (checkError) return { text: checkError, cls: "text-destructive" };
    if (available === false)
      return { text: "Username is taken", cls: "text-destructive" };
    if (available === true)
      return { text: "the username is available", cls: "text-green-600" };
    return { text: " ", cls: "text-muted-foreground" };
  })();

  const resetDeleteUI = () => {
    setConfirmText("");
    setConfirmPwd("");
  };

  return (
    <section>
      <SectionHeader
        title="Account"
        description="Basic account information and preferences."
      />

      <div className="mt-6 grid gap-6 max-w-2xl mx-auto">
        {/* Username */}
        <Card>
          <CardHeader>
            <CardTitle>Username</CardTitle>
            <CardDescription>
              Your public handle shown across the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            {loading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Input
                id="username"
                placeholder="your-handle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || saving}
                autoComplete="username"
                aria-invalid={
                  !!saveError || !!checkError || available === false
                }
              />
            )}
            <p className={`text-xs ${status.cls}`} aria-live="polite">
              {status.text}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading || saving || !isDirty}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!canSave}>
              Save changes
            </Button>
          </CardFooter>
        </Card>

        {/* Delete account */}
        <Card>
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This action is irreversible. Please make sure you've exported any
            important data before continuing. (Coming Soon)
          </CardContent>
          <CardFooter className="flex justify-end">
            <AlertDialog
              open={deleteOpen}
              onOpenChange={(open) => {
                setDeleteOpen(open);
                if (!open) resetDeleteUI();
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled>Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove your account and all associated
                    data.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-3 py-2">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="confirm-delete"
                      className="text-muted-foreground"
                    >
                      Type DELETE to confirm
                    </Label>
                    <Input
                      id="confirm-delete"
                      placeholder="DELETE"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="delete-confirm-password"
                      className="text-muted-foreground"
                    >
                      Confirm with current password
                    </Label>
                    <Input
                      id="delete-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={resetDeleteUI}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={confirmText !== "DELETE" || !confirmPwd}
                  >
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
