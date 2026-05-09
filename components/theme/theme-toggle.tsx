"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { playToggleClickSound, withThemeTransition } from "@/lib/theme";
import { useThemeConfig } from "@/hooks/use-theme-config";

type Ripple = { id: string; x: number; y: number };

export function PremiumThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { config } = useThemeConfig();
  const [mounted, setMounted] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggle = useCallback(
    (clientX?: number, clientY?: number) => {
      withThemeTransition(560);
      if (config.enableSound) playToggleClickSound();

      if (typeof clientX === "number" && typeof clientY === "number" && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const id = `${Date.now()}-${Math.random()}`;
        setRipples((prev) => [...prev, { id, x, y }].slice(-3));
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 650);
      }

      setTheme(isDark ? "light" : "dark");
    },
    [config.enableSound, isDark, setTheme],
  );

  useEffect(() => {
    if (!config.enableShortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [config.enableShortcut, toggle]);

  const tooltip = useMemo(() => {
    const next = isDark ? "Oq mavzu" : "Qora mavzu";
    return `Mavzu: ${isDark ? "Qora" : "Oq"} · (Ctrl+J) → ${next}`;
  }, [isDark]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          ref={btnRef}
          type="button"
          aria-label="Mavzuni almashtirish"
          onClick={(e) => toggle(e.clientX, e.clientY)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          layout
          className={cn(
            "relative isolate inline-flex h-11 w-[86px] items-center rounded-full border border-white/60 bg-background/55 px-1.5 backdrop-blur-2xl",
            "shadow-[0_18px_55px_-30px_rgba(56,189,248,0.9)] dark:shadow-[0_18px_60px_-35px_rgba(37,99,235,0.9)]",
            "transition-all duration-500 ease-in-out",
            className,
          )}
        >
          <span
            className={cn(
              "absolute inset-0 -z-10 rounded-full opacity-90 transition-all duration-500 ease-in-out",
              isDark
                ? "bg-gradient-to-r from-slate-950/70 via-slate-900/65 to-blue-950/55"
                : "bg-gradient-to-r from-sky-100/70 via-white/70 to-blue-100/65",
            )}
          />

          <AnimatePresence>
            {ripples.map((r) => (
              <motion.span
                key={r.id}
                initial={{ opacity: 0.45, scale: 0 }}
                animate={{ opacity: 0, scale: 7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.19, 0.72, 0.24, 0.98] }}
                className={cn(
                  "pointer-events-none absolute -z-10 h-4 w-4 rounded-full",
                  isDark ? "bg-accent/35" : "bg-primary/25",
                )}
                style={{ left: r.x - 8, top: r.y - 8 }}
              />
            ))}
          </AnimatePresence>

          {config.enableParticles ? <ParticlesGlow activeDark={isDark} /> : null}

          <motion.span
            layout
            transition={{ type: "spring", stiffness: 650, damping: 38, mass: 0.6 }}
            className={cn(
              "relative grid h-9 w-9 place-items-center rounded-full border border-white/65",
              "bg-white/75 shadow-[0_18px_60px_-30px_rgba(2,6,23,0.45)]",
              "dark:bg-slate-950/70 dark:border-white/10 dark:shadow-[0_18px_70px_-32px_rgba(56,189,248,0.55)]",
            )}
            style={{ x: isDark ? 36 : 0 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: -65, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 55, scale: 0.65 }}
                  transition={{ type: "spring", stiffness: 560, damping: 34 }}
                  className="grid place-items-center"
                >
                  <MoonStar className="h-[18px] w-[18px] text-accent drop-shadow-[0_0_18px_rgba(56,189,248,0.65)]" />
                </motion.span>
              ) : (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: 65, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -55, scale: 0.65 }}
                  transition={{ type: "spring", stiffness: 560, damping: 34 }}
                  className="grid place-items-center"
                >
                  <Sun className="h-[18px] w-[18px] text-amber-500 drop-shadow-[0_0_18px_rgba(245,158,11,0.6)]" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>

          <motion.div
            layout
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/25 transition-all duration-500 ease-in-out",
              isDark ? "shadow-[0_0_0_0_rgba(56,189,248,0)]" : "shadow-[0_0_0_0_rgba(37,99,235,0)]",
            )}
          />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="glass-card border-white/30 bg-background/70">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function ParticlesGlow({ activeDark }: { activeDark: boolean }) {
  // Ultra-light particles (no canvas) for 60fps.
  const dots = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        id: i,
        left: 12 + i * 10,
        top: 10 + (i % 3) * 8,
        delay: i * 0.12,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          initial={{ opacity: 0.2, y: 0 }}
          animate={{ opacity: [0.15, 0.45, 0.15], y: [-1, 1, -1] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: d.delay, ease: "easeInOut" }}
          className={cn(
            "absolute h-1 w-1 rounded-full blur-[0.5px]",
            activeDark ? "bg-accent/70" : "bg-primary/60",
          )}
          style={{ left: d.left, top: d.top }}
        />
      ))}
    </div>
  );
}

