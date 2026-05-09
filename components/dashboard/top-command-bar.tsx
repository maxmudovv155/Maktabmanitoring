"use client";

import { BellRing, Command } from "lucide-react";

import { GlobalSearch } from "@/components/dashboard/global-search";
import { PremiumThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import { toast } from "sonner";

type Props = {
  collapsed: boolean;
};

export function TopCommandBar({ collapsed }: Props) {
  const toggleCommand = useUiStore((state) => state.toggleCommandPalette);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/78 px-6 py-4 backdrop-blur-2xl dark:bg-background/88">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 px-3 py-1 font-semibold uppercase tracking-wide text-primary">
              Namangan School Monitoring System
            </span>
            <span className="hidden items-center gap-2 md:inline-flex">
              <Command className="h-3.5 w-3.5" />
              <button
                type="button"
                className="font-semibold text-foreground"
                onClick={() => toggleCommand()}
              >
                Ctrl / ⌘ + K
              </button>
            </span>
            {collapsed ? (
              <span className="text-[11px] text-muted-foreground">Sidebarni yig‘ish rejimi</span>
            ) : null}
          </div>
          <GlobalSearch />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="glass-card relative flex h-11 w-11 items-center justify-center rounded-2xl"
            onClick={() => toast.info("Bildirishnomalar", { description: "Tez orada faollashtiriladi." })}
            aria-label="Bildirishnomalar"
          >
            <BellRing className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger shadow-lg shadow-danger/60" />
          </Button>
          <PremiumThemeToggle />
        </div>
      </div>
    </header>
  );
}
