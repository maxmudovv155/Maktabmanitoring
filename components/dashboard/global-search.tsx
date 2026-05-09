"use client";

import { useRouter } from "next/navigation";
import { Loader2, Search as SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { SchoolRow, StudentWithClassSchool } from "@/types/domain";
import { normalizeJshshirDigits } from "@/utils/jshshir";
import { escapeIlike } from "@/utils/search";

type SchoolHit = Pick<SchoolRow, "id" | "name" | "phone" | "director">;

export function GlobalSearch() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentWithClassSchool[]>([]);
  const [schoolHits, setSchoolHits] = useState<SchoolHit[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const debounced = useDebouncedValue(query.trim(), 120);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      if (!debounced) {
        setStudents([]);
        setSchoolHits([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const digits = normalizeJshshirDigits(debounced);
      const wildcard = `%${escapeIlike(debounced)}%`;

      try {
        let studentsQuery = supabase
          .from("students")
          .select(
            `*,
            classes (
              id,
              name,
              school_id,
              student_count,
              created_at,
              schools ( id, name, director, phone, address, created_at )
            )`,
          )
          .limit(30);

        if (digits.length === 14) {
          studentsQuery = studentsQuery.eq("jshshir_normalized", digits);
        } else {
          studentsQuery = studentsQuery.or(
            [
              `full_name.ilike.${wildcard}`,
              `phone.ilike.${wildcard}`,
              `parent_phone.ilike.${wildcard}`,
              `jshshir.ilike.${wildcard}`,
            ].join(","),
          );
        }

        const schoolsPromise =
          debounced.length >= 2
            ? supabase
                .from("schools")
                .select("id,name,director,phone")
                .or(
                  [`name.ilike.${wildcard}`, `director.ilike.${wildcard}`, `phone.ilike.${wildcard}`].join(","),
                )
                .limit(8)
            : Promise.resolve({ data: [] as SchoolHit[] | null, error: null });

        const [{ data: studentsData }, { data: schoolsData }] = await Promise.all([studentsQuery, schoolsPromise]);

        if (cancelled) return;

        setStudents((studentsData as unknown as StudentWithClassSchool[]) ?? []);
        setSchoolHits((schoolsData as SchoolHit[] | null) ?? []);
      } catch {
        if (!cancelled) {
          setStudents([]);
          setSchoolHits([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchResults();
    return () => {
      cancelled = true;
    };
  }, [debounced, reloadToken, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("global-search-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        setReloadToken((token) => token + 1);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "schools" }, () => {
        setReloadToken((token) => token + 1);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const hasResults = students.length > 0 || schoolHits.length > 0;

  return (
    <div className="relative z-40 w-full max-w-3xl md:mr-auto">
      {open ? (
        <button
          type="button"
          aria-label="Orqa fonni yopish"
          className="fixed inset-0 z-[35] bg-background/55 backdrop-blur-[2px] dark:bg-background/72"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="relative z-[45]">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <Input
          data-hotkey-scope="exclude"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="JSHSHIR, F.I.Sh, telefon yoki maktab bo‘yicha qidirish..."
          className="h-12 rounded-2xl border-primary/12 bg-card/80 pl-12 pr-12 shadow-inner backdrop-blur-lg"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 animate-spin text-primary" />
        ) : null}
      </div>

      {open && debounced ? (
        <div className="absolute z-[50] mt-3 w-full rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-2xl">
          {!hasResults && !loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Natija topilmadi.</p>
          ) : (
            <ScrollArea className="max-h-[360px] pr-2">
              {schoolHits.length > 0 ? (
                <div className="mb-3 space-y-2">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Maktablar
                  </p>
                  {schoolHits.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      className={cn(
                        "w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5",
                      )}
                      onClick={() => {
                        router.push(`/dashboard/schools/${school.id}`);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="font-semibold">{school.name}</div>
                      <div className="text-xs text-muted-foreground">{school.director}</div>
                    </button>
                  ))}
                </div>
              ) : null}

              {students.length > 0 ? (
                <div className="space-y-2">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    O‘quvchilar
                  </p>
                  {students.map((student) => {
                    const cls = student.classes;
                    const schoolName = cls?.schools?.name ?? "—";
                    const className = cls?.name ?? "—";
                    return (
                      <button
                        key={student.id}
                        type="button"
                        className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5"
                        onClick={() => {
                          if (!cls?.id) return;
                          router.push(`/dashboard/schools/${cls.school_id}/classes/${cls.id}?student=${student.id}`);
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <div className="font-semibold">{student.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {schoolName} · {className} · {student.jshshir}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </ScrollArea>
          )}
        </div>
      ) : null}
    </div>
  );
}
