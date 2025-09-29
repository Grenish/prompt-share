"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinWaitlist } from "@/util/actions/waitlistActions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your full name")
    .max(120, "That name looks a bit long"),
  email: z.string().email("Please enter a valid email"),
  consent: z
    .boolean()
    .refine((v) => v, "You must consent to join the waitlist"),
});

type FormValues = z.infer<typeof formSchema>;

type WaitlistFormProps = {
  className?: string;
  // Optional: pass a custom submit handler; falls back to POST /api/waitlist
  onSubmit?: (data: FormValues) => Promise<void>;
  title?: string;
  subtitle?: string;
};

const steps = ["fullName", "email", "consent"] as const;
type StepKey = (typeof steps)[number];

export default function WaitlistForm({
  className,
  onSubmit,
  title = "Join the waitlist",
  subtitle = "We’ll only email you when it’s ready.",
}: WaitlistFormProps) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      consent: false,
    },
  });

  const isLast = step === steps.length - 1;
  const currentKey = steps[step];

  // Autofocus current step field
  useEffect(() => {
    const t = setTimeout(() => {
      if (currentKey === "consent") {
        document.getElementById("consent")?.focus();
      } else {
        // react-hook-form focus helper
        form.setFocus(currentKey as "fullName" | "email");
      }
    }, 50);
    return () => clearTimeout(t);
  }, [form, currentKey]);

  const triggerCurrent = useCallback(async () => {
    return form.trigger(currentKey);
  }, [form, currentKey]);

  const handleNext = useCallback(async () => {
    const ok = await triggerCurrent();
    if (!ok) return;
    if (isLast) {
      // last step -> submit
      form.handleSubmit(async (data) => {
        try {
          if (onSubmit) {
            await onSubmit(data);
          } else {
            // default: call server action
            const fd = new FormData();
            fd.append("fullName", data.fullName);
            fd.append("email", data.email);
            const result = await joinWaitlist(fd);
            if (!result?.ok) {
              throw new Error(result?.error || "Failed to join");
            }
          }
          setCompleted(true);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          form.setError("root", { message });
        }
      })();
    } else {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  }, [form, isLast, onSubmit, triggerCurrent]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const onEnterKeyProceed = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleNext();
    }
  };

  const progressPct = Math.round((step / (steps.length - 1)) * 100);

  if (completed) {
    const values = form.getValues();
    return (
      <div
        className={cn(
          "w-full max-w-md rounded-xl border bg-card text-card-foreground p-6 sm:p-8 shadow-sm",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Beta
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            You’re on the list 🎉
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks, {values.fullName.split(" ")[0] || "friend"}! We’ve added{" "}
          {values.email} to the waitlist.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="default"
            onClick={() => {
              form.reset();
              setCompleted(false);
              setStep(0);
            }}
          >
            Add another
          </Button>
          <Button variant="secondary" asChild>
            <a href="/" aria-label="Go back home">
              Go home
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border bg-card text-card-foreground p-6 sm:p-8 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Beta
          </span>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {step + 1} / {steps.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary/30">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />
      </div>

      <Form {...form}>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          {/* Step content */}
          <div
            key={step}
            className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200"
          >
            {currentKey === "fullName" && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What’s your full name?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                        onKeyDown={onEnterKeyProceed}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentKey === "email" && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>And your email?</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@domain.com"
                        autoComplete="email"
                        inputMode="email"
                        onKeyDown={onEnterKeyProceed}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {currentKey === "consent" && (
              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>One last thing</FormLabel>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You’re about to join the waitlist. This is still in beta,
                      so you might encounter bugs.
                    </p>
                    <div className="mt-4 flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          id="consent"
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          aria-describedby="consent-desc"
                          onKeyDown={onEnterKeyProceed}
                        />
                      </FormControl>
                      <div className="grid gap-1">
                        <label
                          htmlFor="consent"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I understand and want to join the waitlist
                        </label>
                        <span
                          id="consent-desc"
                          className="text-xs text-muted-foreground"
                        >
                          You can opt out anytime.
                        </span>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Footer actions */}
          {form.formState.errors.root?.message && (
            <p className="mt-4 text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={step === 0 || form.formState.isSubmitting}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="default"
              disabled={form.formState.isSubmitting}
            >
              {isLast
                ? form.formState.isSubmitting
                  ? "Submitting..."
                  : "Join waitlist"
                : "Proceed"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
