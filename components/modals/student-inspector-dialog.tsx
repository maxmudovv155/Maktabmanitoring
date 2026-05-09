"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInYears, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logActivity } from "@/lib/logger/activity";
import { studentFormSchema, type StudentFormValues } from "@/lib/validations/student";
import { createClient } from "@/lib/supabase/client";
import type { ClassRow, SchoolRow, StudentRow } from "@/types/domain";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRow | null;
  classInfo: ClassRow | null;
  school: SchoolRow | null;
  onChanged?: () => void;
};

export function StudentInspectorDialog({ open, onOpenChange, student, classInfo, school, onChanged }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();
  const isAdmin = profile?.role === "admin";

  const [tab, setTab] = useState<"info" | "edit">("info");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
  });

  useEffect(() => {
    if (!student) return;
    form.reset({
      full_name: student.full_name,
      jshshir: student.jshshir,
      passport: student.passport ?? "",
      birth_date: student.birth_date ?? "",
      phone: student.phone ?? "",
      parent_phone: student.parent_phone,
      address: student.address ?? "",
      gender: student.gender,
      image: student.image ?? "",
      status: student.status,
    });
  }, [form, student, open]);

  const age = useMemo(() => {
    if (!student?.birth_date) return null;
    try {
      return differenceInYears(new Date(), parseISO(student.birth_date));
    } catch {
      return null;
    }
  }, [student?.birth_date]);

  async function handleUpdate(values: StudentFormValues) {
    if (!student || !isAdmin) return;
    const { error } = await supabase
      .from("students")
      .update({
        full_name: values.full_name,
        jshshir: values.jshshir,
        passport: values.passport?.trim() ? values.passport.trim() : null,
        birth_date: values.birth_date ? values.birth_date : null,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        parent_phone: values.parent_phone,
        address: values.address?.trim() ? values.address.trim() : null,
        gender: values.gender,
        image: values.image?.trim() ? values.image.trim() : null,
        status: values.status,
      })
      .eq("id", student.id);

    if (error) {
      toast.error("O‘quvchi yangilanmadi", { description: error.message });
      return;
    }

    await logActivity(supabase, {
      actorId: user?.id ?? null,
      action: "update_student",
      entity: "student",
      entityId: student.id,
      details: values,
    });

    toast.success("Malumot saqlandi");
    onChanged?.();
    setTab("info");
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!student || !isAdmin) return;
    const { error } = await supabase.from("students").delete().eq("id", student.id);
    if (error) {
      toast.error("O‘chirib bo‘lmadi");
      return;
    }
    await logActivity(supabase, {
      actorId: user?.id ?? null,
      action: "delete_student",
      entity: "student",
      entityId: student.id,
      details: { full_name: student.full_name },
    });
    toast.success("O‘quvchi o‘chirildi");
    setDeleteOpen(false);
    onOpenChange(false);
    onChanged?.();
  }

  if (!student) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl gap-9">
          <DialogHeader className="items-start gap-4 text-left lg:flex lg:flex-row">
            <Avatar className="h-[118px] w-[118px] rounded-[38px] border border-primary/42 shadow-glass">
              {student.image ? (
                <AvatarImage src={student.image} alt={student.full_name} className="object-cover" />
              ) : null}
              <AvatarFallback>{student.full_name.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <div className="space-y-[15px]">
              <Badge variant={student.status === "active" ? "success" : "muted"}>{student.status}</Badge>
              <DialogTitle className="text-[32px] leading-tight">{student.full_name}</DialogTitle>
              <DialogDescription>
                {school?.name ?? "Maktab noma'lum"} · {classInfo?.name ?? "Sinf noma'lum"}
              </DialogDescription>

              <div className="flex flex-wrap gap-3">
                {isAdmin ? (
                  <>
                    <Button type="button" variant="accent" onClick={() => setTab((t) => (t === "info" ? "edit" : "info"))}>
                      {tab === "info" ? "Tahrir" : "Batafsil"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="mr-[10px] h-[18px] w-[18px]" /> O‘chirish
                    </Button>
                  </>
                ) : null}

                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Yopish
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "info" | "edit")}> 
            <TabsList className="w-full md:w-fit">
              <TabsTrigger value="info">Ma’lumot</TabsTrigger>
              <TabsTrigger value="edit" disabled={!isAdmin}>
                Tahrir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Info label="JSHSHIR" value={student.jshshir} mono />
                <Info label="Passport" value={student.passport ?? "—"} />
                <Info label="Tug‘ilgan sana" value={student.birth_date ?? "—"} />
                <Info label="Yosh" value={age !== null ? `${age} yosh` : "—"} />
                <Info label="Telefon" value={student.phone ?? "—"} />
                <Info label="Ota-ona telefoni" value={student.parent_phone} />
                <Info label="Manzil" value={student.address ?? "—"} />
                <Info label="Gender" value={student.gender} />
              </div>
            </TabsContent>

            <TabsContent value="edit">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdate)} className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>To‘liq ism sharif</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jshshir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>JSHSHIR</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tug‘ilgan kun</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ota-ona telefoni</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Erkak</SelectItem>
                            <SelectItem value="female">Ayol</SelectItem>
                            <SelectItem value="other">Boshqa</SelectItem>
                            <SelectItem value="unknown">{"Noma\u2019lum"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Faol</SelectItem>
                            <SelectItem value="inactive">Nofaol</SelectItem>
                            <SelectItem value="transferred">Ko‘chirib ketgan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Manzil</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rasm URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex flex-wrap gap-4">
                    <Button type="submit" variant="accent">
                      Saqlash
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setTab("info")}>
                      Bekor
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O‘quvchini o‘chirish</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">Bu operatsiya qaytarilmaydi.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger text-danger-foreground">
              Tasdiqlayman
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-muted/40 p-[18px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <Separator className="my-[12px]" />
      <p className={`${mono ? "font-mono tracking-tight text-base" : "text-[15px] font-medium"}`}>{value}</p>
    </div>
  );
}
