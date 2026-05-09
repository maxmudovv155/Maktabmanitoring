"use client";

import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  PieChart,
  Radar,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Profile } from "@/types/domain";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nav = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/dashboard/schools", label: "Maktablar", icon: Building2 },
  { href: "/dashboard/statistics", label: "Statistika", icon: PieChart },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: Radar },
  { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings2 },
];

type Props = {
  collapsed: boolean;
  profile: Profile | null;
  user: User | null;
};

export function AppSidebar({ collapsed, profile, user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    if (allowLocalOfflineDemo()) {
      try {
        await fetch("/api/dev-demo-logout", { method: "POST", credentials: "include" });
      } catch {
        /* noop */
      }
    }
    await supabase.auth.signOut({ scope: "local" });
    toast.success("Sessiya yopildi.");
    router.push("/login");
    router.refresh();
  }

  const initials =
    profile?.full_name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "AD";

  return (
    <div className="flex h-full flex-col justify-between pb-10 pt-[22px] text-sidebar-foreground">
      <div>
        <div className={cn("mb-12 flex flex-col gap-7 px-[22px]", collapsed && "items-center px-2")}> 
          <div className="flex items-start gap-[14px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-accent shadow-lg shadow-accent/38">
              <Sparkles className="h-[22px] w-[22px] text-primary-foreground drop-shadow-[0_2px_8px_rgb(56,189,248,0.56)]" />
            </div>
            {!collapsed ? (
              <div className="space-y-[5px]">
                <Badge variant="muted" className="bg-white/14 text-sidebar-foreground">
                  Namangan Monitoring
                </Badge>
                <p className="text-[22px] font-semibold tracking-tight text-sidebar-foreground">
                  NSMS
                </p>
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <Separator className="bg-white/17" />
          ) : (
            <div className="h-px w-10 self-center bg-white/10" />
          )}

          <ScrollArea className={cn(collapsed ? "h-[calc(100vh-220px)]" : "max-h-none")}> 
            <nav className="flex flex-col gap-2 pb-24 pr-4">
              {nav.map(({ href, icon: Icon, label }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`));
                return (
                  <motion.div layout key={href} transition={{ duration: 0.25 }}>
                    <Link
                      prefetch
                      href={href}
                      className={cn(
                        "group flex items-center gap-4 rounded-xl px-[18px] py-[13px] text-sm font-semibold transition-all hover:bg-white/[0.12]",
                        active && "bg-white/15 shadow-[inset_0_0_0_1px_hsl(var(--accent)/0.35)] shadow-lg",
                        collapsed ? "justify-center px-4" : "justify-start",
                      )}
                    >
                      <Icon className={cn("h-[19px] w-[19px] text-accent shrink-0", active && "text-white")} />
                      {!collapsed ? (
                        <span className="truncate text-sidebar-foreground/95">{label}</span>
                      ) : (
                        <span className="sr-only">{label}</span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>

      <div className="mt-auto px-5">
        {!collapsed ? <Separator className="mb-[18px] bg-white/[0.07]" /> : <div className="mb-[18px] h-px w-10 mx-auto bg-white/10" />}

        <div
          className={cn(
            "rounded-[18px] border border-white/12 bg-black/33 p-[18px] shadow-[inset_0px_32px_64px_-32px_rgb(148,237,254,0.7)] backdrop-blur-2xl",
            collapsed ? "flex flex-col items-center gap-6 border-none bg-transparent p-4 shadow-none" : "",
          )}
        >
          <div className={cn("flex items-center gap-4", collapsed && "justify-center")}
          >
            <Avatar className="h-[52px] w-[52px] border border-white/[0.20] shadow-lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-semibold text-sidebar-foreground">
                    {profile?.full_name ?? "Administrator"}
                  </p>
                  <Badge variant="muted" className="bg-accent/35 text-accent-foreground text-[11px]">
                    {(profile?.role ?? "viewer").toUpperCase()}
                  </Badge>
                </div>
                <p className="truncate text-[12px] text-sidebar-foreground/75">{user?.email}</p>
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className={cn(
              "glass-card w-full border-white/[0.18] text-sidebar-foreground shadow-lg hover:bg-white/12",
              collapsed && "aspect-square px-4",
            )}
            onClick={handleLogout}
            aria-label="Chiqish"
          >
            <LogOut className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed ? "Chiqish" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
