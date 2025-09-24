"use client";

import { useRouter } from "next/navigation";
import { type PropsWithChildren } from "react";

type BackButtonProps = PropsWithChildren<{
  className?: string;
}>;

export function BackButton({ className, children }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => router.back()}
    >
      {children ?? "Back"}
    </button>
  );
}

export default BackButton;
