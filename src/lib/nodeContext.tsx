import { createContext, useContext, useState, type ReactNode } from "react";
import type { BesuNode, ExplorerConfig } from "@/types/Config";

const NodeContext = createContext<{
  selected: string;
  setSelected: (name: string) => void;
} | null>(null);

// Keeps the selected node across page navigations.
export function NodeProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState("");
  return (
    <NodeContext.Provider value={{ selected, setSelected }}>{children}</NodeContext.Provider>
  );
}

export function useSelectedNode(config: ExplorerConfig): [BesuNode, (name: string) => void] {
  const ctx = useContext(NodeContext);
  if (!ctx) throw new Error("useSelectedNode must be used inside NodeProvider");
  const node = config.nodes.find((n) => n.name === ctx.selected) ?? config.nodes[0];
  return [node, ctx.setSelected];
}
