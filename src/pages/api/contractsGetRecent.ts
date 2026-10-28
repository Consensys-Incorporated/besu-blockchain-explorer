import { apiRoute } from "@/lib/api.server";
import { clampBlockCount, recentBlocks } from "@/lib/chainData";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { ContractSummary } from "@/types/Explorer";

type Receipt = { contractAddress: string | null; status: string };

// Contracts deployed by transactions in the latest `count` blocks, newest first.
// Contracts created by other contracts (factories) don't appear here.
export default apiRoute<ContractSummary[]>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const blocks = await recentBlocks(rpcUrl, clampBlockCount(body.count));
  const deploys = blocks.flatMap((b) =>
    b.transactions.filter((t) => t.to === null).map((t) => ({ txn: t, timestamp: b.timestamp }))
  );
  const receipts = await Promise.all(
    deploys.map(({ txn }) => ethApiCall<Receipt | null>(rpcUrl, "eth_getTransactionReceipt", [txn.hash]))
  );
  return deploys.flatMap(({ txn, timestamp }, i) => {
    const receipt = receipts[i];
    if (!receipt?.contractAddress || receipt.status !== "0x1") return [];
    return [
      {
        address: receipt.contractAddress,
        creator: txn.from,
        txHash: txn.hash,
        blockNumber: txn.blockNumber,
        timestamp,
      },
    ];
  });
});
