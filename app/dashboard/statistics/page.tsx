import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { DashboardGrowthPoint } from "@/lib/queries/dashboard-metrics";
import { fetchDashboardMetrics } from "@/lib/queries/dashboard-metrics";

const emptyGrowth: DashboardGrowthPoint[] = [];

export default async function StatisticsPage() {
  let metrics;

  try {
    metrics = await fetchDashboardMetrics();
  } catch {
    metrics = {
      schoolCount: 0,
      classCount: 0,
      studentCount: 0,
      maleCount: 0,
      femaleCount: 0,
      todayAdds: 0,
      growthSeries: emptyGrowth,
      schoolsError: "Supabase bilan bog‘lanish xato.",
      classesError: null,
      studentsError: null,
    };
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Statistika</p>
        <h1 className="text-[32px] font-semibold tracking-tight">Vizual boshqarma</h1>
      </div>
      <DashboardOverview metrics={metrics} />
    </div>
  );
}
