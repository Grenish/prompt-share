"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { SectionHeader } from "./section-header";
import { useActionState, useEffect, useRef } from "react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/util/actions/authActions";

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

export default function UserSettingsCard() {
  const [state, formAction, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>
                      Keep your account secure by using a strong password.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    ref={formRef}
                    action={formAction}
                    className="grid gap-6"
                  >
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">
                          Current password
                        </Label>
                        <Input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          required
                          disabled={pending}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New password</Label>
                        <Input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          required
                          disabled={pending}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">
                          Confirm new password
                        </Label>
                        <Input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          placeholder="Re-enter new password"
                          autoComplete="new-password"
                          required
                          disabled={pending}
                        />
                      </div>
                    </div>

                    {state?.error ? (
                      <p className="text-sm text-destructive" role="alert">
                        {state.error}
                      </p>
                    ) : null}
                    {state?.ok && state?.message ? (
                      <p className="text-sm text-emerald-600" role="status">
                        {state.message}
                      </p>
                    ) : null}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={pending}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={pending}>
                        {pending ? "Saving…" : "Save changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />
        </div>
      </section>
    </>
  );
}
