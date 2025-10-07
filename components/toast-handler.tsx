"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastType = searchParams.get("toast");
    const message = searchParams.get("m");

    if (toastType === "verify_email") {
      toast("Check your email", {
        description:
          "We've sent a verification link to your email. If you don't see it, please check your spam or junk folder.",
      });
    } else if (toastType === "signup_success") {
      toast("Welcome!", {
        description: "Your account has been created successfully.",
      });
    } else if (toastType === "error" && message) {
      toast.error("Error", {
        description: message,
      });
    }
  }, [searchParams]);

  return null;
}
