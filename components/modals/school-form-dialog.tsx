"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logActivity } from "@/lib/logger/activity";
import { schoolFormSchema, type SchoolFormValues } from "@/lib/validations/school";
import { allowLocalOfflineDemo } from "@/lib/demo-dev-auth";
import { demoUpsertSchool } from "@/lib/demo-local-db";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/public-env";
import type { SchoolRow } from "@/types/domain";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school?: SchoolRow | null;
  onCompleted?: () => void;
};

export function SchoolFormDialog({ open, onOpenChange, school, onCompleted }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      director: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name,
        director: school.director,
        phone: school.phone,
        address: school.address ?? "",
      });
    } else {
      form.reset({ name: "", director: "", phone: "", address: "" });
    }
  }, [form, school, open]);

  async function onSubmit(values: SchoolFormValues) {
    if (profile?.role !== "admin") {
      toast.error("Ruxsat yo‘q", { description: "Faqat admin tahrirlashi mumkin." });
      return;
    }

    const offlineDemo = allowLocalOfflineDemo() && !isSupabasePublicConfigured();

    if (offlineDemo) {
      demoUpsertSchool({
        id: school?.id,
        name: values.name,
        director: values.director,
        phone: values.phone,
        address: values.address?.trim() ? values.address.trim() : null,
      });

      toast.success(school ? "Maktab yangilandi (demo)" : "Maktab qo‘shildi (demo)");
      onCompleted?.();
      onOpenChange(false);
      return;
    }

    if (school) {
      const { error } = await supabase
        .from("schools")
        .update({
          name: values.name,
          director: values.director,
          phone: values.phone,
          address: values.address?.trim() ? values.address.trim() : null,
        })
        .eq("id", school.id);

      if (error) {
        toast.error("Yangilanmadi", { description: error.message });
        return;
      }

      await logActivity(supabase, {
        actorId: user?.id ?? null,
        action: "update_school",
        entity: "school",
        entityId: school.id,
        details: values,
      });
      toast.success("Maktab yangilandi");
    } else {
      const { data, error } = await supabase
        .from("schools")
        .insert({
          name: values.name,
          director: values.director,
          phone: values.phone,
          address: values.address?.trim() ? values.address.trim() : null,
        })
        .select("*")
        .maybeSingle();

      if (error) {
        toast.error("Qo‘shilmadi", { description: error.message });
        return;
      }

      await logActivity(supabase, {
        actorId: user?.id ?? null,
        action: "create_school",
        entity: "school",
        entityId: data?.id ?? null,
        details: values,
      });
      toast.success("Maktab qo‘shildi");
    }

    onCompleted?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{school ? "Maktabni tahrirlash" : "Yangi maktab"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomi</FormLabel>
                  <FormControl>
                    <Input placeholder="12-son UM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="director"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direktor</FormLabel>
                  <FormControl>
                    <Input placeholder="Familiya Ism Otasi" {...field} />
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
                    <Input placeholder="+998 69 555 77 77" {...field} />
                  </FormControl>
                  <FormDescription>Asosiy aloqa raqami</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manzil</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mahalla, ko‘cha, uy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" variant="accent" disabled={form.formState.isSubmitting}>
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
