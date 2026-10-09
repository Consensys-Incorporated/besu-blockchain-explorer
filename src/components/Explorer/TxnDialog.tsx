import { DataList } from "@/components/ui/DataList";
import { hexToDecimal, hexToEther, hexToNumber } from "@/lib/format";
import type { Txn } from "@/types/Explorer";
import { DetailDialog } from "./DetailDialog";

export function TxnDialog({ txn, onClose }: { txn: Txn | null; onClose: () => void }) {
  return (
    <DetailDialog open={txn !== null} onClose={onClose} title="Transaction">
      {txn && (
        <DataList
          items={[
            { label: "Hash", value: txn.hash, mono: true },
            { label: "Block", value: txn.blockNumber ? `#${hexToNumber(txn.blockNumber)}` : "Pending" },
            { label: "Block hash", value: txn.blockHash ?? "—", mono: true },
            { label: "From", value: txn.from, mono: true },
            { label: "To", value: txn.to ?? "Contract creation", mono: !!txn.to },
            { label: "Value (ETH)", value: hexToEther(txn.value) },
            { label: "Gas limit", value: hexToDecimal(txn.gas) },
            { label: "Gas price (wei)", value: hexToDecimal(txn.gasPrice) },
            { label: "Nonce", value: hexToDecimal(txn.nonce) },
            { label: "Index", value: txn.transactionIndex ? hexToDecimal(txn.transactionIndex) : "—" },
            ...(txn.type ? [{ label: "Type", value: hexToDecimal(txn.type) }] : []),
            {
              label: "Input",
              value: (
                <pre className="max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap">
                  {txn.input}
                </pre>
              ),
              mono: true,
            },
          ]}
        />
      )}
    </DetailDialog>
  );
}
