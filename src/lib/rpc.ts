import { computeAddress } from "ethers";
import { loadConfig } from "@/lib/config";
import { clientIdentity } from "@/lib/format";
import { CONSENSUS_ALGORITHMS, type ConsensusAlgorithm } from "@/types/Config";

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
  if (rpcUrl !== config.rpcUrl && !config.validators.some((v) => v.rpcUrl === rpcUrl)) {
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

const DETECT_RETRY_MS = 30_000;
let detected: ConsensusAlgorithm | null = null;
let lastDetectAttempt = 0;

// Works out the consensus from which validator API the node answers. Cached
// once found; retried at most every 30s while the node is unreachable or has
// no consensus API enabled.
export async function getConsensus(): Promise<ConsensusAlgorithm | null> {
  if (detected || Date.now() - lastDetectAttempt < DETECT_RETRY_MS) return detected;
  lastDetectAttempt = Date.now();
  const { rpcUrl } = await loadConfig();
  for (const algorithm of CONSENSUS_ALGORITHMS) {
    try {
      await ethApiCall(rpcUrl, consensusMethods[algorithm].getValidators, ["latest"]);
      detected = algorithm;
      break;
    } catch {
      // Not this one; try the next.
    }
  }
  return detected;
}

export async function requireConsensus(): Promise<ConsensusAlgorithm> {
  const algorithm = await getConsensus();
  if (!algorithm) {
    throw new RpcError("Couldn't detect the consensus. Enable the QBFT, IBFT or CLIQUE API on the node.");
  }
  return algorithm;
}

type AdminNode = { id: string; name: string };

// Maps validator address to node name for the queried node and its peers. A
// validator's address is derived from its node key and an enode ID is that
// key's public half, so no config is needed. Names come from Besu's
// --identity. Returns an empty map if the ADMIN API isn't enabled.
export async function nodeNamesByAddress(rpcUrl: string): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  try {
    const [self, peers] = await Promise.all([
      ethApiCall<AdminNode>(rpcUrl, "admin_nodeInfo"),
      ethApiCall<AdminNode[]>(rpcUrl, "admin_peers"),
    ]);
    for (const node of [self, ...peers]) {
      const name = clientIdentity(node.name);
      if (!name) continue;
      try {
        names.set(computeAddress("0x04" + node.id.replace(/^0x/, "")).toLowerCase(), name);
      } catch {
        // Not a secp256k1 public key; leave this node unnamed.
      }
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
  }
  return names;
}
