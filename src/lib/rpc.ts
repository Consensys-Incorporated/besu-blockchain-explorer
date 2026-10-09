import { loadConfig } from "@/lib/config";
import type { ConsensusAlgorithm } from "@/types/Config";

export const consensusMethods: Record<
  ConsensusAlgorithm,
  { getValidators: string; getPendingVotes: string; propose: string; discard: string }
> = {
  qbft: {
    getValidators: "qbft_getValidatorsByBlockNumber",
    getPendingVotes: "qbft_getPendingVotes",
    propose: "qbft_proposeValidatorVote",
    discard: "qbft_discardValidatorVote",
  },
  ibft: {
    getValidators: "ibft_getValidatorsByBlockNumber",
    getPendingVotes: "ibft_getPendingVotes",
    propose: "ibft_proposeValidatorVote",
    discard: "ibft_discardValidatorVote",
  },
  clique: {
    getValidators: "clique_getSigners",
    getPendingVotes: "clique_proposals",
    propose: "clique_propose",
    discard: "clique_discard",
  },
};

const allowedMethods = new Set([
  "admin_nodeInfo",
  "admin_peers",
  "eth_blockNumber",
  "eth_chainId",
  "eth_getBlockByNumber",
  "eth_getTransactionByHash",
  "net_peerCount",
  "txpool_besuTransactions",
  ...Object.values(consensusMethods).flatMap((m) => Object.values(m)),
]);

export class RpcError extends Error {}

// Proxies a JSON-RPC call to a Besu node. Both the URL and the method are
// checked against allow lists so the API can't be used for server-side
// request forgery or to call arbitrary admin methods.
export async function ethApiCall<T = unknown>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
  timeoutMs = 3000
): Promise<T> {
  const config = await loadConfig();
  if (!config.nodes.some((n) => n.rpcUrl === rpcUrl)) {
    throw new RpcError("RPC URL is not in the configured node list");
  }
  if (!allowedMethods.has(method)) {
    throw new RpcError(`Method ${method} is not allowed`);
  }
  let res: Response;
  try {
    res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new RpcError(`Node at ${rpcUrl} is unreachable`);
  }
  if (!res.ok) {
    throw new RpcError(`${method} failed with HTTP ${res.status}`);
  }
  const body = await res.json();
  if (body.error) {
    throw new RpcError(`${method}: ${body.error.message ?? "unknown error"}`);
  }
  return body.result as T;
}
