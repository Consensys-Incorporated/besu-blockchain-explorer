import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataItem = { label: string; value: ReactNode; mono?: boolean };

// Label/value rows for detail views (node info, blocks, transactions).
export function DataList({ items, className }: { items: DataItem[]; className?: string }) {
  return (
    <dl className={cn("divide-y", className)}>
      {items.map(({ label, value, mono }) => (
        <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={cn("min-w-0 break-all", mono && "font-mono text-[13px]")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
