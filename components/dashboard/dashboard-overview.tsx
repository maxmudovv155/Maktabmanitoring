"use client";

import { useEffect, useRef } from "react";
import { Activity, GraduationCap, School, Users2 } from "lucide-react";

import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DashboardGrowthPoint } from "@/lib/queries/dashboard-metrics";
import { useRecentActionsStore } from "@/store/recent-actions-store";
import { toast } from "sonner";

type Metrics = {
  schoolCount: number;
  classCount: number;
  studentCount: number;
  maleCount: number;
  femaleCount: number;
  todayAdds: number;
  growthSeries: DashboardGrowthPoint[];
  schoolsError: string | null;
  classesError: string | null;
  studentsError: string | null;
};

export function DashboardOverview({ metrics }: { metrics: Metrics }) {
  const pushRecent = useRecentActionsStore((state) => state.push);

  useEffect(() => {
    if (metrics.schoolsError || metrics.classesError || metrics.studentsError) {
      toast.error("Statistikani olishda xatolik", {
        description:
          metrics.schoolsError ?? metrics.classesError ?? metrics.studentsError ?? "Noma'lum",
      });
    }
  }, [metrics.classesError, metrics.schoolsError, metrics.studentsError]);

  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    pushRecent({
      title: "Bosh sahifa yangilandi",
      description: "Statistiklar yuklandi",
      kind: "success",
    });
  }, [pushRecent]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Namangan · Yangi Namangan tumani
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Holat paneli
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Premium admin ko‘rinishida real vaqtda monitoring, barqaror performans va Supabase bilan uyg‘un integratsiya.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Jami maktablar"
          value={metrics.schoolCount}
          icon={School}
          accent="primary"
          delay={0}
          hint="Faol litsenziyalangan maktablar"
        />
        <StatCard
          title="Jami sinflar"
          value={metrics.classCount}
          icon={GraduationCap}
          accent="accent"
          delay={0.05}
          hint="Har bir maktab bo‘yicha sinflar"
        />
        <StatCard
          title="Jami o‘quvchilar"
          value={metrics.studentCount}
          icon={Users2}
          accent="success"
          delay={0.1}
          hint="Yashirilmagan barcha yozuvlar"
        />
        <StatCard
          title="Bugun qo‘shilgan"
          value={metrics.todayAdds}
          icon={Activity}
          accent="danger"
          delay={0.15}
          hint="UTC bo‘yicha kun boshidan"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="glass-card border border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Gender statistikasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase text-muted-foreground">Erkaklar</p>
              <p className="mt-2 text-3xl font-semibold text-primary">{metrics.maleCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs uppercase text-muted-foreground">Ayollar</p>
              <p className="mt-2 text-3xl font-semibold text-accent">{metrics.femaleCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Tezkor eslatma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Ctrl / ⌘ + K yordamida global panelni oching, JSHSHIR bo‘yicha qidiruv esa yuqoridagi panelda.
            </p>
            <Separator />
            <p>Excel, PDF va chop etish — o‘quvchilar jadvalida mavjud.</p>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts male={metrics.maleCount} female={metrics.femaleCount} growth={metrics.growthSeries} />
    </div>
  );
}
