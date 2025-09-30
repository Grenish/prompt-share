"use client";
import { useEffect } from "react";

type ClarityFunction = {
  (...args: unknown[]): void;
  q?: unknown[];
};

declare global {
  interface Window {
    clarity?: ClarityFunction;
  }
}

export default function ClarityInit() {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) {
      console.warn("Clarity project ID not configured");
      return;
    }

    const initClarity = () => {
      if (!window.clarity) {
        const clarity: ClarityFunction = (...args) => {
          (clarity.q = clarity.q || []).push(args);
        };

        window.clarity = clarity;

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.clarity.ms/tag/${projectId}`;
        script.onload = () => {
          console.log("✅ Microsoft Clarity loaded successfully");
        };
        script.onerror = () => {
          console.error("❌ Failed to load Microsoft Clarity");
        };

        const target = document.head || document.body;
        target?.appendChild(script);
      }

      window.removeEventListener("scroll", initClarity);
    };

    // Initialize on first scroll for better performance
    if (!window.clarity) {
      // Also initialize after a short delay as fallback
      const timeoutId = setTimeout(initClarity, 3000);
      window.addEventListener("scroll", initClarity, { once: true });

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("scroll", initClarity);
      };
    }
  }, []);

  return null;
}
