"use client";

import { useEffect, useMemo, useState } from "react";

import { StudentsWorkbench } from "@/components/students/students-workbench";
import { Skeleton } from "@/components/ui/skeleton";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { demoGetClassById, demoGetSchoolById } from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { ClassRow, SchoolRow } from "@/types/domain";
import { toast } from "sonner";

type Props = {
  schoolId: string;
  classId: string;
};

export function ClassStudentsLoader({ schoolId, classId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [classRoom, setClassRoom] = useState<ClassRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);

      const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
      if (offlineDemo) {
        const schoolRow = demoGetSchoolById(schoolId);
        const classRow = demoGetClassById(classId);

        if (!schoolRow || !classRow || classRow.school_id !== schoolId) {
          toast.error("Ma’lumot topilmadi (demo)");
          setLoading(false);
          return;
        }

        setSchool(schoolRow as SchoolRow);
        setClassRoom(classRow as ClassRow);
        setLoading(false);
        return;
      }

      const [{ data: schoolRow, error: schoolErr }, { data: classRow, error: classErr }] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).maybeSingle(),
        supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
      ]);

      if (cancelled) return;

      if (schoolErr || classErr) {
        toast.error("Ma’lumot topilmadi");
        setLoading(false);
        return;
      }

      if (!schoolRow || !classRow || classRow.school_id !== schoolId) {
        toast.error("Sinf yoki maktab mos emas");
        setLoading(false);
        return;
      }

      setSchool(schoolRow as SchoolRow);
      setClassRoom(classRow as ClassRow);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [classId, schoolId, supabase]);

  if (loading || !school || !classRoom) {
    return <Skeleton className="h-[420px] rounded-[32px]" />;
  }

  return <StudentsWorkbench school={school} classRoom={classRoom} />;
}
