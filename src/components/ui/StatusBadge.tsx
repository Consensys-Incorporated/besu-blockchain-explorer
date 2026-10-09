import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  info: "bg-primary/10 text-primary",
};

// Badge with semantic colours, which the stock shadcn variants don't cover.
export function StatusBadge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return <Badge className={cn(tones[tone])}>{children}</Badge>;
}
