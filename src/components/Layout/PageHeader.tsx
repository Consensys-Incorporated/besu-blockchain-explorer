import type { ReactNode } from "react";
import { Server } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BesuNode, ExplorerConfig } from "@/types/Config";

export function PageHeader({
  title,
  description,
  config,
  node,
  onSelectNode,
}: {
  title: string;
  description?: ReactNode;
  config: ExplorerConfig;
  node: BesuNode;
  onSelectNode: (name: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Select value={node.name} onValueChange={onSelectNode}>
        <SelectTrigger aria-label="Node" className="w-full data-[size=default]:h-9 sm:w-56">
          <Server className="text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {config.nodes.map((n) => (
            <SelectItem key={n.name} value={n.name}>
              {n.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
