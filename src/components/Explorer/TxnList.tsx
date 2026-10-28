import { FileCode2, Send } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { hexToEther, hexToNumber, shortenHex, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Txn } from "@/types/Explorer";

export type TxnRow = { txn: Txn; timestamp?: string };

// Clickable list of transactions. `inset` lines the rows up with a Card's
// edges; otherwise the list sits in its own bordered box (as in a dialog).
export function TxnList({
  rows,
  onSelect,
  showBlock = true,
  inset = false,
  now,
}: {
  rows: TxnRow[];
  onSelect: (txn: Txn) => void;
  showBlock?: boolean;
  inset?: boolean;
  // Shows each row's age when given along with the block timestamps.
  now?: number;
}) {
  return (
    <ul className={cn("divide-y", inset ? "-mx-(--card-spacing)" : "rounded-lg border")}>
      {rows.map(({ txn: t, timestamp }) => (
        <li key={t.hash}>
          <button
            onClick={() => onSelect(t)}
            className={cn(
              "grid w-full gap-2 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted/50 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-4",
              inset ? "px-(--card-spacing)" : "px-3"
            )}
          >
            {t.to === null ? (
              <StatusBadge tone="warning">
                <FileCode2 /> Deploy
              </StatusBadge>
            ) : (
              <StatusBadge tone="info">
                <Send /> Txn
              </StatusBadge>
            )}
            <div className="min-w-0">
              <p className="truncate font-mono text-[13px]">{t.hash}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {shortenHex(t.from)} → {t.to ? shortenHex(t.to) : "new contract"}
              </p>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              {showBlock && (
                <p>
                  Block #{hexToNumber(t.blockNumber)}
                  {timestamp && now !== undefined && ` · ${timeAgo(timestamp, now)}`}
                </p>
              )}
              <p>{hexToEther(t.value)} ETH</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
