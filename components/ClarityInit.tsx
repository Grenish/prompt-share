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

        const target = document.head || document.body;
        target?.appendChild(script);
      }

      window.removeEventListener("scroll", initClarity);
    };

    if (!window.clarity) {
      window.addEventListener("scroll", initClarity, { once: true });
    }

    return () => {
      window.removeEventListener("scroll", initClarity);
    };
  }, []);

  return null;
}
