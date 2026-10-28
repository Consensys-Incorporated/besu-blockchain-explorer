import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const BLOCK_COUNT_OPTIONS = [10, 20, 30, 50];

// "<prefix> [N] blocks" picker for how far back a page scans.
export function BlockCountSelect({
  prefix,
  value,
  onChange,
}: {
  prefix: string;
  value: number;
  onChange: (count: number) => void;
}) {
  return (
    <>
      {prefix}
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger size="sm" aria-label="Number of blocks to scan">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_COUNT_OPTIONS.map((o) => (
            <SelectItem key={o} value={String(o)}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      blocks
    </>
  );
}
