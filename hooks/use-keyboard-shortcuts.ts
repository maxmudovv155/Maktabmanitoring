"use client";

import { useEffect } from "react";

type Options = { enabled?: boolean };

export function useKeyboardShortcuts(
  map: Partial<Record<"Escape" | "mod+k", (event: KeyboardEvent) => void>>,
  deps: unknown[] = [],
  options?: Options,
) {
  useEffect(() => {
    if (options?.enabled === false) return;

    const handler = (event: KeyboardEvent) => {
      const mod = navigator.platform.includes("Mac") ? event.metaKey : event.ctrlKey;

      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-hotkey-scope="exclude"]')) {
        return;
      }

      const keyUpper = typeof event.key === "string" ? event.key.toLowerCase() : "";

      if (event.key === "Escape" && map.Escape) {
        map.Escape(event);
        return;
      }

      if (mod && keyUpper === "k" && map["mod+k"]) {
        event.preventDefault();
        map["mod+k"](event);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.enabled, ...(deps ?? [])]);
}
