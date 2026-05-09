"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      richColors
      closeButton
      theme={theme as "dark" | "light" | "system"}
      className="pointer-events-auto"
      toastOptions={{
        classNames: {
          toast:
            "group glass-card backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-white/15 shadow-xl",
          title: "text-sm font-semibold",
          description: "text-muted-foreground text-xs",
          actionButton: "rounded-xl !bg-primary !text-primary-foreground",
          cancelButton: "rounded-xl !bg-muted",
        },
      }}
    />
  );
}
