"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-background px-6 py-[22px]">
      <Skeleton className="hidden h-[100vh] w-[280px] md:block rounded-3xl" />
      <div className="flex flex-1 flex-col gap-[22px]">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] flex-1 rounded-3xl" />
      </div>
    </div>
  );
}
