"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { useUiStore } from "@/store/ui-store";

const links = [
  { label: "Bosh sahifa", href: "/dashboard", group: "Navigatsiya" },
  { label: "Maktablar", href: "/dashboard/schools", group: "Navigatsiya" },
  { label: "Statistika", href: "/dashboard/statistics", group: "Navigatsiya" },
  { label: "Monitoring", href: "/dashboard/monitoring", group: "Navigatsiya" },
  { label: "Sozlamalar", href: "/dashboard/settings", group: "Navigatsiya" },
];

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof links>();
    links.forEach((item) => {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Umumiy panel">
      <CommandInput placeholder="Maktab, sahifa yoki boshqa..." />
      <CommandList className="pr-4">
        <CommandEmpty>Mos keladigan yozuv yo‘q.</CommandEmpty>

        {grouped.map(([group, items]) => (
          <CommandGroup heading={group} key={group}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${group} ${item.label}`}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                {item.label}
                <CommandShortcut>Enter</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
