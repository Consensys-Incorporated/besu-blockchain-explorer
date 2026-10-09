import { Boxes } from "lucide-react";

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Boxes className="size-5" />
      </span>
      Besu Explorer
    </span>
  );
}
