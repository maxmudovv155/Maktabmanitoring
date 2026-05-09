"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { logActivity } from "@/lib/logger/activity";
import { classFormSchema, type ClassFormValues } from "@/lib/validations/class";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { demoUpsertClass } from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { ClassRow } from "@/types/domain";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  classRoom?: ClassRow | null;
  onCompleted?: () => void;
};

export function ClassFormDialog({ open, onOpenChange, schoolId, classRoom, onCompleted }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (classRoom) {
      form.reset({ name: classRoom.name });
    } else {
      form.reset({ name: "" });
    }
  }, [classRoom, form, open]);

  async function onSubmit(values: ClassFormValues) {
    if (profile?.role !== "admin") {
      toast.error("Ruxsat yo‘q");
      return;
    }

    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();
    if (offlineDemo) {
      demoUpsertClass({
        id: classRoom?.id,
        school_id: schoolId,
        name: values.name,
      });
      toast.success(classRoom ? "Sinf yangilandi (demo)" : "Sinf yaratildi (demo)");
      onCompleted?.();
      onOpenChange(false);
      return;
    }

    if (classRoom) {
      const { error } = await supabase.from("classes").update({ name: values.name }).eq("id", classRoom.id);

      if (error) {
        toast.error("Sinf yangilanmadi", { description: error.message });
        return;
      }

      await logActivity(supabase, {
        actorId: user?.id ?? null,
        action: "update_class",
        entity: "class",
        entityId: classRoom.id,
        details: values,
      });
      toast.success("Sinf yangilandi");
    } else {
      const { data, error } = await supabase
        .from("classes")
        .insert({
          school_id: schoolId,
          name: values.name,
        })
        .select("*")
        .maybeSingle();

      if (error) {
        toast.error("Sinf qo‘shilmadi", { description: error.message });
        return;
      }

      await logActivity(supabase, {
        actorId: user?.id ?? null,
        action: "create_class",
        entity: "class",
        entityId: data?.id ?? null,
        details: values,
      });
      toast.success("Sinf yaratildi");
    }

    onCompleted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{classRoom ? "Sinf nomini tahrirlash" : "Yangi sinf"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinf</FormLabel>
                  <FormControl>
                    <Input placeholder="5-A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="accent">
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
