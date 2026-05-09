import { utcStartOfTodayIso } from "@/utils/date";
import { createClient } from "@/lib/supabase/server";

export type DashboardGrowthPoint = { label: string; total: number };

export async function fetchDashboardMetrics() {
  const supabase = await createClient();

  const fourteenDaysAgo = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() - 13,
    ),
  ).toISOString();

  const [
    schoolsRes,
    classesRes,
    studentsRes,
    maleStudentsRes,
    femaleStudentsRes,
    todayStudentsRes,
    growthRes,
  ] = await Promise.all([
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("gender", "male"),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("gender", "female"),
    supabase.from("students").select("id", { count: "exact", head: true }).gte("created_at", utcStartOfTodayIso()),
    supabase.from("students").select("created_at").gte("created_at", fourteenDaysAgo),
  ]);

  const dayKeys = Array.from({ length: 14 }, (_, index) => {
    const utc = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() - (13 - index),
    );
    const d = new Date(utc);
    return d.toISOString().slice(0, 10);
  });

  const buckets = new Map<string, number>(dayKeys.map((k) => [k, 0]));

  (growthRes.data ?? []).forEach((row) => {
    if (!row.created_at) return;
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (!buckets.has(key)) return;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });

  const growthSeries: DashboardGrowthPoint[] = dayKeys.map((key) => ({
    label: key,
    total: buckets.get(key) ?? 0,
  }));

  return {
    schoolCount: schoolsRes.count ?? 0,
    classCount: classesRes.count ?? 0,
    studentCount: studentsRes.count ?? 0,
    maleCount: maleStudentsRes.count ?? 0,
    femaleCount: femaleStudentsRes.count ?? 0,
    todayAdds: todayStudentsRes.count ?? 0,
    growthSeries,
    schoolsError: schoolsRes.error?.message ?? null,
    classesError: classesRes.error?.message ?? null,
    studentsError: studentsRes.error?.message ?? null,
  };
}
