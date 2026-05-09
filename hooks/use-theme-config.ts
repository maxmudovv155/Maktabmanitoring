import { useCallback, useEffect, useMemo, useState } from "react";

import { THEME_CONFIG_STORAGE_KEY } from "@/lib/theme";

export type ThemeUXConfig = {
  enableShortcut: boolean;
  enableParticles: boolean;
  enableSound: boolean;
};

const defaults: ThemeUXConfig = {
  enableShortcut: true,
  enableParticles: true,
  enableSound: false,
};

function safeParse(raw: string | null): Partial<ThemeUXConfig> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<ThemeUXConfig>;
  } catch {
    return null;
  }
}

export function useThemeConfig() {
  const [config, setConfig] = useState<ThemeUXConfig>(defaults);

  useEffect(() => {
    const parsed = safeParse(globalThis.localStorage?.getItem(THEME_CONFIG_STORAGE_KEY) ?? null);
    if (!parsed) return;
    setConfig((prev) => ({ ...prev, ...parsed }));
  }, []);

  const update = useCallback((patch: Partial<ThemeUXConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      globalThis.localStorage?.setItem(THEME_CONFIG_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      config,
      update,
    }),
    [config, update],
  );
}

