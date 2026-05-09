"use client";

import { RefreshCcw, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NamanganMonitoring] Boundary error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-[48px]">
      <Card className="glass-card max-w-xl border-danger/35 shadow-glass">
        <CardHeader>
          <ShieldAlert className="mb-[18px] h-14 w-14 text-danger" />
          <CardTitle>{"Noma\u2019lum muammo sodir bo\u2019ldi"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-[18px] text-sm leading-relaxed text-muted-foreground">
          <p>
            Ishonch bilan error boundary ushbu hodisani yozib boradi. Qo‘lda qaytadan urinish yoki qurilmangiz ulanishini
            tekshirib chiqing.
          </p>
          <code className="block rounded-xl bg-muted/60 px-4 py-[14px] text-xs">{error.message}</code>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">digest: <span>{error.digest}</span></p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-[14px]">
          <Button onClick={() => reset()} variant="accent" size="lg" className="gap-3">
            <RefreshCcw className="h-[18px] w-[18px]" />
            Qayta ishga tushirish
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")} variant="outline" size="lg">
            Bosh sahifaga
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
