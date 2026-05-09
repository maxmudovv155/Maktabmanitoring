"use client";

import { motion } from "framer-motion";
import { History, Radio } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { ActivityLogRow } from "@/types/domain";
import { toast } from "sonner";

export function MonitoringConsole() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      toast.error("Loglar yuklanmadi");
    }

    setRows((data as ActivityLogRow[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = supabase
      .channel("activity-logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => reload())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload, supabase]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent animate-pulse" />
            Monitoring
          </p>
          <h1 className="text-[36px] font-semibold leading-tight">Realtime faoliyat jurnali</h1>
        </div>
        <Badge variant="muted" className="text-xs">
          Supabase Realtime orqali avtokuchlash
        </Badge>
      </div>

      <Card className="glass-card border border-border/60">
        <CardHeader className="flex flex-row items-center gap-3">
          <History className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">So‘nggi harakatlar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[480px] rounded-[24px]" />
          ) : (
            <ScrollArea className="h-[520px] pr-3">
              <div className="space-y-4">
                {rows.map((row, index) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="rounded-[24px] border border-border/60 bg-muted/40 p-4 backdrop-blur-2xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{row.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.entity} · {row.entity_id ?? "—"}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString("uz-UZ")}
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <pre className="max-h-[180px] overflow-auto rounded-[18px] bg-background/80 p-3 text-xs">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
