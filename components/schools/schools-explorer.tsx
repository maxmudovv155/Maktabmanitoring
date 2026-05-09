"use client";

import { Building2, PencilLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { SchoolFormDialog } from "@/components/modals/school-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { logActivity } from "@/lib/logger/activity";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { demoDeleteSchool, demoListSchools } from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { SchoolRow } from "@/types/domain";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SchoolCardModel = SchoolRow & {
  classCount: number;
  studentTotal: number;
};

export function SchoolsExplorer() {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();

  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolCardModel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SchoolRow | null>(null);

  const isAdmin = profile?.role === "admin";

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
      if (offlineDemo) {
        const schoolsData = demoListSchools();
        const mapped = schoolsData.map((s) => ({ ...s, classCount: 0, studentTotal: 0 }));
        setSchools(mapped);
        return;
      }

      const [{ data: schoolsData, error: schoolError }, { data: classesData, error: classError }] =
        await Promise.all([
          supabase.from("schools").select("*").order("name"),
          supabase.from("classes").select("school_id, student_count"),
        ]);

      if (schoolError || classError) throw schoolError ?? classError;

      const stats = new Map<string, { classCount: number; studentTotal: number }>();

      for (const row of classesData ?? []) {
        const agg = stats.get(row.school_id) ?? { classCount: 0, studentTotal: 0 };
        agg.classCount += 1;
        agg.studentTotal += row.student_count ?? 0;
        stats.set(row.school_id, agg);
      }

      const mapped =
        schoolsData?.map((school) => {
          const s = stats.get(school.id) ?? { classCount: 0, studentTotal: 0 };
          return { ...school, classCount: s.classCount, studentTotal: s.studentTotal };
        }) ?? [];

      setSchools(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Maktablarni yuklab bo‘lmadi");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) return;
    const channel = supabase
      .channel("schools-explorer-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => reload())
      .subscribe();
    const channelSchools = supabase
      .channel("schools-explorer-live-schools")
      .on("postgres_changes", { event: "*", schema: "public", table: "schools" }, () => reload())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(channelSchools);
    };
  }, [reload, supabase]);

  async function handleDeleteSchool() {
    if (!deleteTarget || !isAdmin) return;

    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) {
      demoDeleteSchool(deleteTarget.id);
      toast.success("Maktab o‘chirildi (demo)");
      setDeleteTarget(null);
      await reload();
      return;
    }

    const { error } = await supabase.from("schools").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Maktab o‘chirib bo‘lmadi", { description: error.message });
      return;
    }

    await logActivity(supabase, {
      actorId: user?.id ?? null,
      action: "delete_school",
      entity: "school",
      entityId: deleteTarget.id,
      details: { name: deleteTarget.name },
    });
    toast.success("Maktab o‘chirildi");
    setDeleteTarget(null);
    await reload();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: SchoolRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Maktablar</p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">Premium maktab kartochkalari</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Yangi Namangan tumani bo‘ylab aktiv maktablar, sinflar ulushi va tahrirlash harakatlari bitta sahifada jamlangan.
          </p>
        </div>

        {isAdmin ? (
          <Button size="lg" variant="accent" className="w-full lg:w-fit" type="button" onClick={() => openCreate()}>
            + Maktab qo‘shish
          </Button>
        ) : (
          <Badge variant="muted" className="self-start">
            Qo‘shmalar faqat ADMIN uchun
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[230px]" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <Card className="glass-card border-dashed bg-transparent shadow-none backdrop-blur-2xl">
          <CardContent className="space-y-[18px] py-[72px] text-center">
            <p className="text-lg font-semibold">Hali maktablar yozuvi mavjud emas</p>
            <p className="text-sm text-muted-foreground">Demo ma‘lumotlarni (`supabase/seed.sql`) yuklang va qaytadan sahifani yangilang.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school, index) => (
            <motion.div
              layout
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className="h-full"
            >
              <Card className={cn(
                "glass-card group h-full border border-border/60 bg-gradient-to-b from-card via-card to-card",
                "hover:-translate-y-1 hover:shadow-[0_35px_80px_-50px_rgb(148,237,254,1)]",
              )}>
                <CardHeader className="space-y-[18px]">
                  <div className="flex items-start gap-[18px]">
                    <span className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-primary/90 text-white shadow-xl">
                      <Building2 className="h-[24px] w-[24px]" />
                    </span>
                    <div className="min-w-0 space-y-[6px]">
                      <Badge variant="muted" className="text-[11px]">
                        Direktor bilan integratsiya
                      </Badge>
                      <CardTitle className="line-clamp-2 text-[21px] leading-snug">{school.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-[18px] text-sm leading-relaxed text-muted-foreground">
                  <div>
                    <span className="text-xs uppercase tracking-[0.12em]">Direktor</span>
                    <p className="font-medium text-foreground">{school.director}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-[18px]">
                    <div className="rounded-[18px] border border-white/65 bg-muted/65 p-[18px] dark:border-white/12">
                      <p className="text-xs uppercase">Sinflar</p>
                      <p className="text-2xl font-semibold">{school.classCount}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/65 bg-muted/65 p-[18px] dark:border-white/12">
                      <p className="text-xs uppercase">O‘quvchilar</p>
                      <p className="text-2xl font-semibold text-primary">{school.studentTotal}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-[0.14em]">Telefon</span>
                    <p className="text-base font-medium text-accent">{school.phone}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  <Button asChild variant="default" size="lg" className="flex-1 min-w-[150px]">
                    <Link href={`/dashboard/schools/${school.id}`}>Ochish</Link>
                  </Button>
                  <Button variant="outline" size="lg" disabled={!isAdmin} type="button" onClick={() => openEdit(school)}>
                    <PencilLine className="mr-[10px] h-[18px] w-[18px]" />
                    Tahrirlash
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setDeleteTarget(school)}
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <SchoolFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        school={editing ?? undefined}
        onCompleted={() => reload()}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Maktabni o‘chirishni tasdiqlaysizmi?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {deleteTarget?.name} bilan bog‘langan barcha sinflar va o‘quvchilar Postgres kaskadi orqali yo‘qoladi — bu ortga qaytarilmaydi.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSchool} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Ha, o‘chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
