"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function useThemeInitializer() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const savedPalette = localStorage.getItem("color-palette");
    if (savedPalette) {
      const root = document.documentElement;
      root.removeAttribute("data-theme");
      if (savedPalette !== "default") {
        root.setAttribute("data-theme", savedPalette);
      }
    }

    const savedThemeChoice = localStorage.getItem("theme-choice");

    if (savedThemeChoice === "time") {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 18 || hour < 6;
      setTheme(shouldBeDark ? "dark" : "light");
    } else if (
      savedThemeChoice === "light" ||
      savedThemeChoice === "dark" ||
      savedThemeChoice === "system"
    ) {
      setTheme(savedThemeChoice);
    }
  }, [setTheme]);
}
