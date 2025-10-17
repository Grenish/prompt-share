import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-8 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to your email address. Please check your inbox and click the link to verify your account.
          </p>
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <span className="font-semibold">Tip:</span> If you don't see the email, please check your spam or junk folder.
          </p>
        </div>

        {/* Message */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            After confirming your email, you'll be able to log in and start exploring prompts.
          </p>
        </div>

        {/* Action */}
        <div className="space-y-3 pt-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Back to Login</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already verified?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
