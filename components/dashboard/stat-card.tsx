"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "success" | "danger";
  delay?: number;
};

const accentMap: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-primary/28 via-primary/12 to-transparent",
  accent: "from-accent/28 via-accent/12 to-transparent",
  success: "from-emerald-400/25 via-emerald-300/10 to-transparent",
  danger: "from-danger/25 via-danger/10 to-transparent",
};

export function StatCard({ title, value, hint, icon: Icon, accent = "primary", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <Card className="glass-card relative overflow-hidden border border-border/60 bg-gradient-to-br from-card/90 to-card/60 shadow-glass">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 blur-3xl",
            accentMap[accent],
          )}
        />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
