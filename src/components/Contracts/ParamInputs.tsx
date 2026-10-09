import type { ParamType } from "ethers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeholderFor } from "@/lib/contracts";

export function ParamInputs({
  idPrefix,
  params,
  values,
  onChange,
}: {
  idPrefix: string;
  params: readonly ParamType[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <>
      {params.map((p, i) => {
        const id = `${idPrefix}-${i}`;
        return (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id} className="text-xs">
              {p.name || `arg${i}`} <span className="font-mono text-muted-foreground">({p.type})</span>
            </Label>
            <Input
              id={id}
              className="font-mono"
              placeholder={placeholderFor(p)}
              value={values[i] ?? ""}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          </div>
        );
      })}
    </>
  );
}
