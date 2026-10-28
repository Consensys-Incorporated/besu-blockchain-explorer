import { useEffect, useState } from "react";
import { DataList, type DataItem } from "@/components/ui/DataList";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, postApi } from "@/lib/api";
import { formatTimestamp, formatTokenAmount, hexToEther, hexToNumber } from "@/lib/format";
import type { ContractDetails, ContractSummary } from "@/types/Explorer";
import { DetailDialog } from "./DetailDialog";

// Details for a contract address. `summary` adds how it was deployed when the
// address came from the contracts list.
export function ContractDialog({
  rpcUrl,
  address,
  summary,
  onClose,
}: {
  rpcUrl: string;
  address: string | null;
  summary?: ContractSummary;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ address: string; details?: ContractDetails; error?: string } | null>(
    null
  );

  useEffect(() => {
    if (!address) return;
    const controller = new AbortController();
    postApi<ContractDetails>("contractGetDetails", { rpcUrl, address }, controller.signal)
      .then((details) => setResult({ address, details }))
      .catch((e) => !controller.signal.aborted && setResult({ address, error: errorMessage(e) }));
    return () => controller.abort();
  }, [rpcUrl, address]);

  // Ignore a result left over from a previously opened address.
  const current = result?.address === address ? result : null;
  const details = current?.details;
  const token = details?.token;

  const items: DataItem[] = [
    { label: "Address", value: address, mono: true },
    ...(summary
      ? [
          { label: "Creator", value: summary.creator, mono: true },
          { label: "Creation txn", value: summary.txHash, mono: true },
          {
            label: "Deployed",
            value: `Block #${hexToNumber(summary.blockNumber)} · ${formatTimestamp(summary.timestamp)}`,
          },
        ]
      : []),
  ];
  if (details) {
    items.push(
      { label: "Type", value: !details.isContract ? "Not a contract" : (token?.type ?? "Contract") },
      { label: "Bytecode size", value: `${details.codeSize.toLocaleString()} bytes` },
      { label: "Balance (ETH)", value: hexToEther(details.balance) }
    );
    if (token) {
      items.push(
        { label: "Name", value: token.name ?? "—" },
        { label: "Symbol", value: token.symbol ?? "—" },
        ...(token.decimals !== undefined ? [{ label: "Decimals", value: token.decimals }] : []),
        { label: "Total supply", value: formatTokenAmount(token.totalSupply, token.decimals) }
      );
    }
  }

  return (
    <DetailDialog open={address !== null} onClose={onClose} title={token?.name ?? "Contract"}>
      {address && (
        <>
          <DataList items={items} />
          {!current && <Skeleton className="h-24" />}
          {current?.error && <p className="text-destructive">{current.error}</p>}
        </>
      )}
    </DetailDialog>
  );
}
