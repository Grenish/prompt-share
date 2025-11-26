"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  useThemeInitializer();
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
