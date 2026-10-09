import { DataList } from "@/components/ui/DataList";
import { formatTimestamp, hexToDecimal, hexToNumber } from "@/lib/format";
import type { Block } from "@/types/Explorer";
import { DetailDialog } from "./DetailDialog";

export function BlockDialog({ block, onClose }: { block: Block | null; onClose: () => void }) {
  return (
    <DetailDialog open={block !== null} onClose={onClose} title={block ? `Block #${hexToNumber(block.number)}` : ""}>
      {block && (
        <DataList
          items={[
            { label: "Hash", value: block.hash, mono: true },
            { label: "Parent hash", value: block.parentHash, mono: true },
            { label: "Timestamp", value: formatTimestamp(block.timestamp) },
            { label: "Proposer", value: block.miner, mono: true },
            { label: "Transactions", value: block.transactions.length },
            { label: "Gas used", value: `${hexToDecimal(block.gasUsed)} / ${hexToDecimal(block.gasLimit)}` },
            ...(block.baseFeePerGas
              ? [{ label: "Base fee (wei)", value: hexToDecimal(block.baseFeePerGas) }]
              : []),
            { label: "Size (bytes)", value: hexToDecimal(block.size) },
            { label: "State root", value: block.stateRoot, mono: true },
            { label: "Receipts root", value: block.receiptsRoot, mono: true },
            { label: "Txns root", value: block.transactionsRoot, mono: true },
            { label: "Extra data", value: block.extraData, mono: true },
          ]}
        />
      )}
    </DetailDialog>
  );
}
