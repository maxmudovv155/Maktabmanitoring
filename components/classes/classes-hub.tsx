"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Layers3, NotebookPen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { ClassFormDialog } from "@/components/modals/class-form-dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { logActivity } from "@/lib/logger/activity";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import {
  demoDeleteClass,
  demoGetSchoolById,
  demoListClasses,
} from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { ClassRow, SchoolRow } from "@/types/domain";

type Props = { schoolId: string };

export function ClassesHub({ schoolId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();

  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);

  const isAdmin = profile?.role === "admin";

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
      if (offlineDemo) {
        setSchool(demoGetSchoolById(schoolId));
        setClasses(demoListClasses(schoolId));
        return;
      }

      const [{ data: schoolRow, error: schoolErr }, { data: classRows, error: classesErr }] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).maybeSingle(),
        supabase.from("classes").select("*").eq("school_id", schoolId).order("name"),
      ]);

      if (schoolErr || classesErr) throw schoolErr ?? classesErr;

      setSchool((schoolRow as SchoolRow | null) ?? null);
      setClasses((classRows as ClassRow[] | null) ?? []);
    } catch {
      /* handled UI */
    } finally {
      setLoading(false);
    }
  }, [schoolId, supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) return;
    const channel = supabase.channel(`school-${schoolId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "classes",
      },
      () => reload(),
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload, schoolId, supabase]);

  async function handleDeleteClass() {
    if (!deleteTarget || !isAdmin) return;

    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) {
      demoDeleteClass(deleteTarget.id);
      setDeleteTarget(null);
      await reload();
      return;
    }

    const { error } = await supabase.from("classes").delete().eq("id", deleteTarget.id);
    if (error) return;
    await logActivity(supabase, {
      actorId: user?.id ?? null,
      action: "delete_class",
      entity: "class",
      entityId: deleteTarget.id,
      details: deleteTarget,
    });
    setDeleteTarget(null);
    await reload();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  if (loading) {
    return <Skeleton className="h-[420px] rounded-[32px]" />;
  }

  if (!school) {
    return <p>Maktab topilmadi.</p>;
  }

  return (
    <div className="space-y-[22px]">
      <div className="rounded-[36px] border border-border/60 bg-gradient-to-r from-background to-muted/46 p-[22px] shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-[18px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Maktab</p>
            <h1 className="mt-[10px] text-[32px] font-semibold leading-tight">{school.name}</h1>
            <p className="mt-[10px] text-sm text-muted-foreground">{school.address ?? "Manzil yozilmagan"}</p>
          </div>
          <div className="flex flex-wrap gap-[12px]">
            <Button asChild variant="outline" size="lg" type="button">
              <Link href="/dashboard/schools" className="gap-2">
                <ArrowLeft className="h-[18px] w-[18px]" />
                Ortga
              </Link>
            </Button>
            {isAdmin ? (
              <Button variant="accent" size="lg" type="button" onClick={() => openCreate()}>
                + Yangi sinf
              </Button>
            ) : (
              <Badge variant="muted" className="self-center">Faqat TOMOSHABIN · sinflarni tahrirlay olmaysiz</Badge>
            )}
          </div>
        </div>
        <Separator className="my-[22px]" />
        <div className="grid gap-[18px] md:grid-cols-3">
          <GlassStat label="Direktor" value={school.director} />
          <GlassStat label="Telefon" accent value={school.phone} />
          <GlassStat label="Sinflar" value={`${classes.length}`} />
        </div>
      </div>

      <div className="grid gap-[18px] md:grid-cols-3">
        {classes.map((room, idx) => (
          <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
            <Card className="glass-card h-full border-white/72 bg-muted/54 dark:border-white/12">
              <CardContent className="space-y-[18px] p-[26px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[14px]">
                    <Layers3 className="h-[22px] w-[22px] text-accent" />
                    <p className="text-[21px] font-semibold">{room.name}</p>
                  </div>
                  <Badge>{room.student_count} o‘quvchi</Badge>
                </div>
                <div className="flex flex-wrap gap-[12px]">
                  <Button asChild variant="default" size="lg" className="flex-1">
                    <Link href={`/dashboard/schools/${schoolId}/classes/${room.id}`}>O‘quvchilarni ko‘rish</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isAdmin}
                    onClick={() => {
                      setEditing(room);
                      setDialogOpen(true);
                    }}
                  >
                    <NotebookPen className="mr-[10px] h-[18px] w-[18px]" />
                    Tahrirlash
                  </Button>
                  <Button variant="destructive" type="button" disabled={!isAdmin} onClick={() => setDeleteTarget(room)}>
                    <Trash2 className="h-[18px] w-[18px]" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <ClassFormDialog
        open={dialogOpen}
        schoolId={schoolId}
        classRoom={editing}
        onOpenChange={setDialogOpen}
        onCompleted={() => reload()}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sinfni o‘chirish</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Sinf bilan birgalikda ichidagi hamma o‘quvchilari ham ketadi.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-danger text-danger-foreground">
              Tasdiqlayman
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GlassStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-background/60 p-[22px] text-sm backdrop-blur-2xl dark:border-white/10">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`mt-[10px] text-[19px] font-semibold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
