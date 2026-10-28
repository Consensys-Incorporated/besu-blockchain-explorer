import { createContext, useContext, useState, type ReactNode } from "react";
import type { ValidatorNode } from "@/types/Config";

const NodeContext = createContext<{
  selected: string;
  setSelected: (name: string) => void;
} | null>(null);

// Keeps the selected validator across page navigations.
export function NodeProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState("");
  return (
    <NodeContext.Provider value={{ selected, setSelected }}>{children}</NodeContext.Provider>
  );
}

// Undefined when no validators are configured (voting is off).
export function useSelectedValidator(
  validators: ValidatorNode[]
): [ValidatorNode | undefined, (name: string) => void] {
  const ctx = useContext(NodeContext);
  if (!ctx) throw new Error("useSelectedValidator must be used inside NodeProvider");
  const validator = validators.find((v) => v.name === ctx.selected) ?? validators[0];
  return [validator, ctx.setSelected];
}
