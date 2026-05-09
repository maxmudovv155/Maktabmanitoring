"use client";

import type { Session, User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { TopCommandBar } from "@/components/dashboard/top-command-bar";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { allowLocalOfflineDemo, mockDemoProfile, mockDemoUser } from "@/lib/demo-dev-auth";
import { createClient } from "@/lib/supabase/client";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Profile } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

type DashboardContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
};

const DashboardCtx = createContext<DashboardContextValue | undefined>(undefined);

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardCtx);
  if (!ctx) {
    throw new Error("DashboardProvider yo‘qligi.");
  }
  return ctx;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<DashboardContextValue>({
    user: null,
    session: null,
    profile: null,
  });

  const toggleSidebar = useUiStore((state) => state.toggleSidebarCollapsed);
  const toggleCommand = useUiStore((state) => state.toggleCommandPalette);

  useKeyboardShortcuts({
    "mod+k": () => toggleCommand(),
  });

  useEffect(() => {
    let unsub: { subscription: { unsubscribe: () => void } } | null = null;

    void (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profileRes = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        setContext({
          user: session.user,
          session,
          profile: (profileRes.data as Profile | null) ?? null,
        });
        setLoading(false);

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          void (async () => {
            if (!nextSession?.user) {
              window.location.href = "/login";
              return;
            }
            const refreshed = await supabase.from("profiles").select("*").eq("id", nextSession.user.id).maybeSingle();
            setContext({
              user: nextSession.user,
              session: nextSession,
              profile: (refreshed.data as Profile | null) ?? null,
            });
          })();
        });
        unsub = listener;
        return;
      }

      if (allowLocalOfflineDemo()) {
        try {
          const res = await fetch("/api/dev-demo-status", { credentials: "include", cache: "no-store" });
          const js = (await res.json()) as { demo?: boolean };
          if (js.demo === true) {
            setContext({
              user: mockDemoUser(),
              session: null,
              profile: mockDemoProfile(),
            });
            setLoading(false);
            return;
          }
        } catch {
          /* noop */
        }
      }

      if (error || !session?.user) {
        setLoading(false);
        window.location.href = "/login";
      }
    })();

    return () => unsub?.subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const sidebarWidth = collapsed ? "5.5rem" : "18rem";

  return (
    <DashboardCtx.Provider value={context}>
      <CommandPalette />
      <div className="page-gradient-bg flex min-h-screen text-foreground">
        <aside
          aria-label="Sidebar"
          className={cn(
            "relative sticky top-0 z-30 hidden md:flex md:h-[100vh] md:flex-shrink-0 md:flex-col",
            "glass-card border-none border-sidebar-border md:border md:border-transparent",
          )}
          style={{
            flexBasis: sidebarWidth,
            width: sidebarWidth,
            transition: "width 220ms cubic-bezier(.4,.2,.4,1), flex-basis 220ms cubic-bezier(.4,.2,.4,1)",
            backgroundImage:
              "linear-gradient(155deg,hsl(var(--sidebar-background))/98%, hsl(var(--secondary))/94%)",
            boxShadow: "0px 48px 85px hsl(var(--foreground) / .14)",
          }}
        >
          <AppSidebar collapsed={collapsed} profile={context.profile} user={context.user} />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute right-[-18px] top-28 z-40 hidden rounded-full md:inline-flex md:h-11 md:w-11"
            aria-label={collapsed ? "Sidebarni ochish" : "Sidebarni yig‘ish"}
            onClick={() => toggleSidebar()}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </Button>
        </aside>

        <div className="flex min-h-[100vh] flex-1 flex-col">
          <div className="sticky top-0 z-40 border-b border-black/10 bg-background/72 px-5 py-3 backdrop-blur-md dark:bg-background/82 md:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-muted-foreground">
                NSMS
              </Link>
              <MobileNav />
            </div>
          </div>

          <TopCommandBar collapsed={collapsed} />

          <AnimatePresence mode="wait">
            <motion.main
              key="dashboard-main"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.19, 0.71, 0.28, 0.93] }}
              className="flex-1 px-6 pb-10 pt-[22px]"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </DashboardCtx.Provider>
  );
}

function MobileNav() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
      <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-accent/10">
        Bosh sahifa
      </Link>
      <Link href="/dashboard/schools" className="rounded-full px-3 py-2 hover:bg-accent/10">
        Maktablar
      </Link>
      <Link href="/dashboard/statistics" className="rounded-full px-3 py-2 hover:bg-accent/10">
        Statistika
      </Link>
    </div>
  );
}
