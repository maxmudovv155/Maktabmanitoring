"use client";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeft, FileDown, FileSpreadsheet, Printer, Rows3, RotateCcw, Search as SearchIcon, UserRoundPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { StudentInspectorDialog } from "@/components/modals/student-inspector-dialog";
import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logActivity } from "@/lib/logger/activity";
import { studentFormSchema, type StudentFormValues } from "@/lib/validations/student";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { demoListStudents, demoUpsertStudent } from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { ClassRow, SchoolRow, StudentRow } from "@/types/domain";
import { formatLocalDate } from "@/utils/date";
import { exportStudentsCsv, exportStudentsPdf, exportStudentsXlsx } from "@/utils/export-docs";
import { toast } from "sonner";

type Props = {
  school: SchoolRow;
  classRoom: ClassRow;
};

type RowModel = StudentRow;

export function StudentsWorkbench({ school, classRoom }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { profile, user } = useDashboardContext();
  const isAdmin = profile?.role === "admin";
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<RowModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([{ id: "full_name", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilterStatus, setColumnFilterStatus] = useState<string | "ALL">("ALL");

  const [inspectorStudent, setInspectorStudent] = useState<RowModel | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creatingValues, setCreatingValues] = useState<StudentFormValues>({
    full_name: "",
    jshshir: "",
    passport: "",
    birth_date: "",
    phone: "",
    parent_phone: "",
    address: "",
    gender: "unknown",
    image: "",
    status: "active",
  });

  const emptyCreateValues = useMemo<StudentFormValues>(
    () => ({
      full_name: "",
      jshshir: "",
      passport: "",
      birth_date: "",
      phone: "",
      parent_phone: "",
      address: "",
      gender: "unknown",
      image: "",
      status: "active",
    }),
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);

    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) {
      setRows(demoListStudents(classRoom.id));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", classRoom.id)
      .order("full_name");

    if (error) {
      toast.error("O‘quvchilarni yuklab bo‘lmadi", { description: error.message });
    } else {
      setRows((data as StudentRow[]) ?? []);
    }

    setLoading(false);
  }, [classRoom.id, supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (createOpen) {
      setCreatingValues(emptyCreateValues);
    }
  }, [createOpen, emptyCreateValues]);

  useEffect(() => {
    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) return;
    const channel = supabase
      .channel(`students-live-${classRoom.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students", filter: `class_id=eq.${classRoom.id}` },
        () => reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [classRoom.id, reload, supabase]);

  useEffect(() => {
    const studentParam = searchParams.get("student");
    if (!studentParam || loading) return;
    const matched = rows.find((row) => row.id === studentParam);
    if (matched) {
      setInspectorStudent(matched);
    }
  }, [loading, rows, searchParams]);

  async function handleCreateStudent() {
    if (!isAdmin) return;
    try {
      const parsed = studentFormSchema.parse(creatingValues);

      const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
      if (offlineDemo) {
        demoUpsertStudent({
          class_id: classRoom.id,
          full_name: parsed.full_name,
          jshshir: parsed.jshshir,
          passport: parsed.passport?.trim() ? parsed.passport.trim() : null,
          birth_date: parsed.birth_date?.trim() ? parsed.birth_date.trim() : null,
          phone: parsed.phone?.trim() ? parsed.phone.trim() : null,
          parent_phone: parsed.parent_phone,
          address: parsed.address?.trim() ? parsed.address.trim() : null,
          gender: parsed.gender,
          image: parsed.image?.trim() ? parsed.image.trim() : null,
          status: parsed.status,
        });
        toast.success("Qo‘shildi (demo)");
        setCreateOpen(false);
        setCreatingValues(emptyCreateValues);
        await reload();
        return;
      }

      const { data, error } = await supabase
        .from("students")
        .insert({
          class_id: classRoom.id,
          full_name: parsed.full_name,
          jshshir: parsed.jshshir,
          passport: parsed.passport?.trim() ? parsed.passport.trim() : null,
          birth_date: parsed.birth_date?.trim() ? parsed.birth_date.trim() : null,
          phone: parsed.phone?.trim() ? parsed.phone.trim() : null,
          parent_phone: parsed.parent_phone,
          address: parsed.address?.trim() ? parsed.address.trim() : null,
          gender: parsed.gender,
          image: parsed.image?.trim() ? parsed.image.trim() : null,
          status: parsed.status,
        })
        .select("*")
        .maybeSingle();

      if (error) throw error;

      await logActivity(supabase, {
        actorId: user?.id ?? null,
        action: "create_student",
        entity: "student",
        entityId: data?.id ?? null,
        details: parsed,
      });

      toast.success("Qo‘shildi");
      setCreateOpen(false);
      setCreatingValues(emptyCreateValues);
      await reload();
    } catch (error: unknown) {
      const fallbackMessage =
        error && typeof error === "object" && "message" in error && typeof (error as { message: string }).message === "string"
          ? (error as { message: string }).message
          : "Qo‘shmadi.";
      toast.error("Yangi o‘quvchi saqlanmadi", { description: fallbackMessage });
    }
  }

  const filteredRowsByStatus = useMemo(() => {
    if (columnFilterStatus === "ALL") return rows;
    return rows.filter((row) => row.status === columnFilterStatus);
  }, [columnFilterStatus, rows]);

  const columns = useMemo<ColumnDef<RowModel>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: () => (
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Rows3 className="h-3.5 w-3.5" />
            <span>F.I.Sh</span>
          </div>
        ),
        cell: ({ row }) => <span className="font-semibold tracking-tight">{row.original.full_name}</span>,
      },
      {
        accessorKey: "jshshir",
        header: "JSHSHIR",
        cell: ({ row }) => (
          <div className="font-mono text-xs text-accent">{row.original.jshshir}</div>
        ),
      },
      {
        accessorKey: "birth_date",
        header: "Tug‘ilgan sana",
        cell: ({ row }) => (
          <div className="text-sm">{formatLocalDate(row.original.birth_date)}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ row }) => row.original.phone ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "active" ? "success" : "muted"}>{row.original.status}</Badge>
        ),
      },
      {
        accessorKey: "address",
        header: "Manzil",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-muted-foreground">{row.original.address ?? "—"}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRowsByStatus,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = `${filterValue}`.trim().toLowerCase();
      if (!search.length) return true;
      const haystack = [
        row.original.full_name,
        row.original.jshshir,
        row.original.phone ?? "",
        row.original.parent_phone,
        row.original.address ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 14 } },
  });

  async function exportsBundle() {
    const payload = filteredRowsByStatus.map((row) => ({
      ...row,
      school: school.name,
      className: classRoom?.name ?? "",
    }));
    exportStudentsXlsx(payload);
    toast.success("Excel tayyor");
  }

  function handlePdfExport() {
    exportStudentsPdf(
      filteredRowsByStatus.map((row) => ({ ...row, school: school.name, className: classRoom?.name ?? "" })),
      `${school.name} — ${classRoom?.name}`,
    );
    toast.success("PDF saqlandi");
  }

  function handleCsvExport() {
    exportStudentsCsv(
      filteredRowsByStatus.map((row) => ({ ...row, school: school.name, className: classRoom?.name ?? "" })),
    );
    toast.success("CSV yaratildi");
  }

  function handlePrint() {
    toast.message("Chop etish", { description: "Brauzer chop etish oynasini oching." });
    window.print();
  }

  return (
    <div id="students-print-zone" className="space-y-8">
      <motion.section
        layout
        className="glass-card rounded-[36px] border border-border/60 bg-gradient-to-r from-muted/82 via-muted/72 to-muted/92 p-[28px]"
      >
        <div className="flex flex-wrap items-start justify-between gap-[18px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sinf</p>
            <h1 className="mt-[10px] text-[36px] font-semibold leading-snug">{classRoom.name}</h1>
            <p className="mt-[10px] text-sm text-muted-foreground">
              Maktab · <span className="font-semibold text-foreground">{school.name}</span>
            </p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm" type="button">
                <Link href={`/dashboard/schools/${school.id}`} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Ortga
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <Button type="button" variant="accent" className="gap-2" onClick={() => setCreateOpen(true)}>
                <UserRoundPlus className="h-[18px] w-[18px]" />
                O‘quvchi qo‘shish
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="gap-2 glass-card" onClick={() => reload()}>
              <RotateCcw className="h-[18px] w-[18px]" />
              Yangilash
            </Button>
          </div>
        </div>
        <Separator className="my-[22px]" />
        <div className="grid gap-[18px] md:grid-cols-5">
          <Card className="rounded-[26px] border border-border/50 bg-muted/45 p-[14px] text-center backdrop-blur-2xl">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">O‘quvchilar soni</span>
            <p className="text-3xl font-semibold">{classRoom.student_count}</p>
          </Card>
          <Card className="rounded-[26px] border border-border/50 bg-muted/45 p-[14px] text-center backdrop-blur-2xl">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Jami</span>
            <p className="text-3xl font-semibold">{rows.length}</p>
          </Card>
          <div className="md:col-span-3 rounded-[29px] border border-border/54 bg-muted/62 p-[16px]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Umumiy qidiruv</p>
            <div className="relative mt-3">
              <SearchIcon className="absolute left-[18px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nom, telefon..."
                value={globalFilter}
                className="h-[46px] rounded-[18px] pl-[44px]"
                onChange={(event) => setGlobalFilter(event.target.value)}
              />
            </div>
          </div>
        </div>
      </motion.section>

      <Card className="glass-card space-y-[26px] border border-border/60 p-[26px]">
        <div className="flex flex-wrap gap-4">
          <Select value={columnFilterStatus} onValueChange={(value) => setColumnFilterStatus(value)}>
            <SelectTrigger className="w-[248px]">
              <SelectValue placeholder="Status bo‘yicha filtr" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Barcha statuslar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="inactive">Nofaol</SelectItem>
              <SelectItem value="transferred">Ko‘chirib ketgan</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="hidden h-auto md:block" />

          <Button type="button" variant="outline" className="gap-3" onClick={exportsBundle}>
            <FileSpreadsheet className="h-[17px] w-[17px]" />
            Excel
          </Button>
          <Button type="button" variant="outline" className="gap-3" onClick={handleCsvExport}>
            <FileDown className="h-[17px] w-[17px]" />
            CSV
          </Button>
          <Button type="button" variant="outline" className="gap-3" onClick={handlePdfExport}>
            <FileSpreadsheet className="h-[17px] w-[17px]" />
            PDF hisobot
          </Button>
          <Button type="button" variant="secondary" className="gap-3" onClick={handlePrint}>
            <Printer className="h-[17px] w-[17px]" />
            Chop etish
          </Button>
        </div>

        <ScrollArea className="w-full pb-10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    Bo‘sh jadval
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-accent/12"
                    onClick={() => setInspectorStudent(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex flex-wrap items-center gap-6">
          <div className="text-sm">
            Sahifa #{table.getState().pagination.pageIndex + 1} /{" "}
            <span>
              {table.getPageCount().toLocaleString()} · {filteredRowsByStatus.length} ta yozuv
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Oldingi
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Keyingi
            </Button>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 14, 20, 31, 48].map((pageSizeOption) => (
                  <SelectItem key={pageSizeOption} value={`${pageSizeOption}`}>
                    {pageSizeOption}/sahifa
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <StudentInspectorDialog
        open={Boolean(inspectorStudent)}
        onOpenChange={(openFlag) => {
          if (!openFlag) setInspectorStudent(null);
        }}
        student={inspectorStudent}
        classInfo={classRoom}
        school={school}
        onChanged={() => reload()}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Yangi o‘quvchi</DialogTitle>
          </DialogHeader>

          <div className="grid gap-[22px] md:grid-cols-2">
            <FloatingInput
              label="F.I.Sh"
              value={creatingValues.full_name}
              onChange={(value) => setCreatingValues({ ...creatingValues, full_name: value })}
            />
            <FloatingInput
              label="JSHSHIR"
              mono
              value={creatingValues.jshshir}
              onChange={(value) => setCreatingValues({ ...creatingValues, jshshir: value })}
            />
            <FloatingInput
              label="Passport"
              value={creatingValues.passport ?? ""}
              onChange={(value) => setCreatingValues({ ...creatingValues, passport: value })}
            />
            <FloatingInput
              label="Tug‘ilgan sana (YYYY-MM-DD)"
              value={creatingValues.birth_date ?? ""}
              onChange={(value) => setCreatingValues({ ...creatingValues, birth_date: value })}
            />
            <FloatingInput
              label="O‘quvchi telefoni"
              value={creatingValues.phone ?? ""}
              onChange={(value) => setCreatingValues({ ...creatingValues, phone: value })}
            />
            <FloatingInput
              label="Ota-ona telefoni"
              value={creatingValues.parent_phone}
              onChange={(value) => setCreatingValues({ ...creatingValues, parent_phone: value })}
            />
            <FloatingInput
              label="Gender (male | female | other | unknown)"
              value={creatingValues.gender}
              onChange={(value) =>
                setCreatingValues({ ...creatingValues, gender: value as StudentFormValues["gender"] })
              }
            />
            <FloatingInput
              label="Status (active | inactive | transferred)"
              value={creatingValues.status}
              onChange={(value) =>
                setCreatingValues({ ...creatingValues, status: value as StudentFormValues["status"] })
              }
            />
            <FloatingInput
              label="Rasm URL (ixtiyoriy)"
              value={creatingValues.image ?? ""}
              onChange={(value) => setCreatingValues({ ...creatingValues, image: value })}
            />
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manzil</label>
              <textarea
                rows={5}
                className="mt-3 w-full rounded-[22px] border border-input bg-muted/62 p-[18px] text-sm backdrop-blur-2xl"
                value={creatingValues.address}
                onChange={(event) => setCreatingValues({ ...creatingValues, address: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Bekor
            </Button>
            <Button type="button" size="lg" variant="accent" onClick={handleCreateStudent}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FloatingInput({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <Input
        className={`mt-3 rounded-[18px] border border-border bg-muted/74 ${mono ? "font-mono text-xs tracking-tighter" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
