import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UISlice = {
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (value: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
};

export const useUiStore = create<UISlice>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed: boolean) => set({ sidebarCollapsed }),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommandPalette: () => set({ commandOpen: !get().commandOpen }),
    }),
    {
      name: "namangan-school-monitor.ui",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);
