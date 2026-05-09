import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentActionKind = "info" | "success" | "warning" | "danger";

export type RecentActionEntry = {
  id: string;
  title: string;
  description?: string | null;
  kind: RecentActionKind;
  at: string;
};

type RecentActionsState = {
  items: RecentActionEntry[];
  push: (entry: Omit<RecentActionEntry, "id" | "at"> & { id?: string }) => void;
  clear: () => void;
};

export const useRecentActionsStore = create<RecentActionsState>()(
  persist(
    (set) => ({
      items: [],
      push: ({ id, ...rest }) => {
        const next: RecentActionEntry = {
          id: id ?? crypto.randomUUID(),
          at: new Date().toISOString(),
          ...rest,
        };
        set((state) => ({ items: [next, ...state.items].slice(0, 50) }));
      },
      clear: () => set({ items: [] }),
    }),
    { name: "namangan-school-monitor.recent-actions" },
  ),
);
