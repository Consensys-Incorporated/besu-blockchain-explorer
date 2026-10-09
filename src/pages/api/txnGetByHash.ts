import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireHash, requireString } from "@/lib/validate";
import type { Txn } from "@/types/Explorer";

export default apiRoute<Txn | null>(async (body) =>
  ethApiCall<Txn | null>(requireString(body, "rpcUrl"), "eth_getTransactionByHash", [
    requireHash(body, "hash"),
  ])
);
