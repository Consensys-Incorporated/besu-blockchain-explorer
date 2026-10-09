import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted">{icon}</div>
        <div className="min-w-0">
          <p className="text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-16" />
          ) : (
            <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
