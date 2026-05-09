import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { DashboardGrowthPoint } from "@/lib/queries/dashboard-metrics";
import { fetchDashboardMetrics } from "@/lib/queries/dashboard-metrics";

export default async function DashboardLandingPage() {
  let metrics = {
    schoolCount: 0,
    classCount: 0,
    studentCount: 0,
    maleCount: 0,
    femaleCount: 0,
    todayAdds: 0,
    growthSeries: [] as DashboardGrowthPoint[],
    schoolsError: null as string | null,
    classesError: null as string | null,
    studentsError: null as string | null,
  };

  try {
    metrics = await fetchDashboardMetrics();
  } catch {
    metrics = {
      ...metrics,
      schoolsError: "Supabase ulanishi xato.",
    };
  }

  return <DashboardOverview metrics={metrics} />;
}
