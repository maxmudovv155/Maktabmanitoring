"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useDashboardContext } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const profileSchema = z.object({
  full_name: z.string().min(2, "Ism majburiy."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsConsole() {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useDashboardContext();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      full_name: profile?.full_name ?? "",
    });
  }, [form, profile?.full_name]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: values.full_name }).eq("id", user.id);
    if (error) {
      toast.error("Profil yangilanmadi", { description: error.message });
      return;
    }
    toast.success("Profil saqlandi");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sozlamalar</p>
        <h1 className="mt-3 text-[36px] font-semibold">Profil va xavfsizlik</h1>
      </div>

      <Card className="glass-card border border-border/60">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Ism familiyangiz va elektron pochta (pochta o‘zgarmaydi).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-[24px] border border-border/60 bg-muted/40 p-4 text-sm">
            <p className="text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{user?.email}</p>
            <Separator className="my-4" />
            <p className="text-muted-foreground">Rol</p>
            <p className="text-lg font-semibold uppercase">{profile?.role}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To‘liq ism</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="accent">
                Saqlash
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
