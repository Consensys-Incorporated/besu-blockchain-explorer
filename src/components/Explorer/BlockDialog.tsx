import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/DataList";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatTimestamp,
  gasUsedPercent,
  hexToDecimal,
  hexToNumber,
  shortenHex,
  timeAgo,
} from "@/lib/format";
import type { Block, Txn } from "@/types/Explorer";
import { DetailDialog } from "./DetailDialog";
import { TxnList } from "./TxnList";

// Busy blocks can hold hundreds of transactions, so start with the first few.
const INITIAL_TXNS = 10;

export function BlockDialog({
  block,
  now,
  onClose,
  onSelectTxn,
}: {
  block: Block | null;
  now: number;
  onClose: () => void;
  onSelectTxn: (txn: Txn) => void;
}) {
  // Keyed by block hash so the list collapses again when another block opens.
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const expanded = block !== null && expandedBlock === block.hash;
  const txns = block?.transactions ?? [];
  const shownTxns = expanded ? txns : txns.slice(0, INITIAL_TXNS);

  return (
    <DetailDialog open={block !== null} onClose={onClose} title={block ? `Block #${hexToNumber(block.number)}` : ""}>
      {block && (
        <>
          <div className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold tabular-nums">#{hexToNumber(block.number)}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(block.timestamp, now)}</span>
            </div>
            <p className="mt-2 text-muted-foreground">
              {block.transactions.length} txn{block.transactions.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">by {shortenHex(block.miner)}</p>
          </div>
          <section className="space-y-3">
            <h3 className="font-medium">Transactions ({block.transactions.length})</h3>
            {block.transactions.length === 0 ? (
              <EmptyState>No transactions in this block.</EmptyState>
            ) : (
              <>
                <TxnList rows={shownTxns.map((txn) => ({ txn }))} onSelect={onSelectTxn} showBlock={false} />
                {txns.length > INITIAL_TXNS && (
                  <Button
                    variant="outline"
                    className="w-full"
                    aria-expanded={expanded}
                    onClick={() => setExpandedBlock(expanded ? null : block.hash)}
                  >
                    {expanded ? <ChevronUp data-icon="inline-start" /> : <ChevronDown data-icon="inline-start" />}
                    {expanded ? "Show fewer" : `Show ${txns.length - INITIAL_TXNS} more`}
                  </Button>
                )}
              </>
            )}
          </section>
          <section className="space-y-3">
            <h3 className="font-medium">Details</h3>
            <DataList
              items={[
                { label: "Hash", value: block.hash, mono: true },
                { label: "Parent hash", value: block.parentHash, mono: true },
                { label: "Timestamp", value: formatTimestamp(block.timestamp) },
                { label: "Proposer", value: block.miner, mono: true },
                {
                  label: "Gas used",
                  value: `${hexToDecimal(block.gasUsed)} / ${hexToDecimal(block.gasLimit)} (${gasUsedPercent(block.gasUsed, block.gasLimit).toFixed(1)}%)`,
                },
                ...(block.baseFeePerGas
                  ? [{ label: "Base fee (wei)", value: hexToDecimal(block.baseFeePerGas) }]
                  : []),
                { label: "Size (bytes)", value: hexToDecimal(block.size) },
              ]}
            />
            {/* Keyed so it starts collapsed for each block. */}
            <details key={block.hash} className="group rounded-lg border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                More details
              </summary>
              <DataList
                className="border-t px-3"
                items={[
                  { label: "State root", value: block.stateRoot, mono: true },
                  { label: "Receipts root", value: block.receiptsRoot, mono: true },
                  { label: "Txns root", value: block.transactionsRoot, mono: true },
                ]}
              />
            </details>
          </section>
        </>
      )}
    </DetailDialog>
  );
}
