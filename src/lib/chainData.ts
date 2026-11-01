import { decodeBytes32String, id, Interface } from "ethers";
import { ethApiCall } from "@/lib/rpc";
import type { Block, TokenInfo, TokenType } from "@/types/Explorer";

// Server-side only. The explorer has no index, so these helpers read a recent
// window of blocks straight from the node.

export const MAX_BLOCKS = 50;

export function clampBlockCount(value: unknown): number {
  return Math.min(Math.max(Number(value) || 10, 1), MAX_BLOCKS);
}

// The latest `count` blocks (with full transactions), newest first. Txns that
// emitted token Transfer events get a `tokenType`.
export async function recentBlocks(rpcUrl: string, count: number): Promise<Block[]> {
  const latest = parseInt(await ethApiCall<string>(rpcUrl, "eth_blockNumber"), 16);
  const numbers = Array.from({ length: Math.min(count, latest + 1) }, (_, i) => latest - i);
  const [blocks, logs] = await Promise.all([
    Promise.all(
      numbers.map((n) =>
        ethApiCall<Block | null>(rpcUrl, "eth_getBlockByNumber", ["0x" + n.toString(16), true])
      )
    ),
    // The token tags are a nice-to-have, so a failed log query doesn't fail the blocks.
    transferLogs(rpcUrl, numbers.at(-1) ?? 0, latest).catch(() => [] as Log[]),
  ]);
  const tokenTypes = new Map<string, TokenType>();
  for (const log of logs) {
    const type = transferTokenType(log);
    const current = tokenTypes.get(log.transactionHash);
    if (type && (!current || current === "ERC-20")) tokenTypes.set(log.transactionHash, type);
  }
  const found = blocks.filter((b): b is Block => b !== null);
  for (const txn of found.flatMap((b) => b.transactions)) {
    const tokenType = tokenTypes.get(txn.hash);
    if (tokenType) txn.tokenType = tokenType;
  }
  return found;
}

export type Log = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
};

export const TRANSFER_TOPIC = id("Transfer(address,address,uint256)");
export const TRANSFER_SINGLE_TOPIC = id("TransferSingle(address,address,address,uint256,uint256)");
export const TRANSFER_BATCH_TOPIC = id("TransferBatch(address,address,address,uint256[],uint256[])");

// Token transfer events from blocks `from` to `to` inclusive, oldest first.
function transferLogs(rpcUrl: string, from: number, to: number): Promise<Log[]> {
  return ethApiCall<Log[]>(rpcUrl, "eth_getLogs", [
    {
      fromBlock: "0x" + from.toString(16),
      toBlock: "0x" + to.toString(16),
      topics: [[TRANSFER_TOPIC, TRANSFER_SINGLE_TOPIC, TRANSFER_BATCH_TOPIC]],
    },
  ]);
}

// Token transfer events from the latest `count` blocks, oldest first.
export async function recentTransferLogs(rpcUrl: string, count: number): Promise<Log[]> {
  const latest = parseInt(await ethApiCall<string>(rpcUrl, "eth_blockNumber"), 16);
  return transferLogs(rpcUrl, Math.max(latest - count + 1, 0), latest);
}

// ERC-20 and ERC-721 share the Transfer signature; ERC-721 indexes the token ID,
// so its log has one more topic.
export function transferTokenType(log: Log): TokenType | null {
  if (log.topics[0] === TRANSFER_TOPIC) {
    if (log.topics.length === 3) return "ERC-20";
    if (log.topics.length === 4) return "ERC-721";
    return null;
  }
  return log.topics[0] === TRANSFER_SINGLE_TOPIC || log.topics[0] === TRANSFER_BATCH_TOPIC
    ? "ERC-1155"
    : null;
}

const token = new Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function supportsInterface(bytes4) view returns (bool)",
]);

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

// Calls a read-only token function. The call data is always built here from
// the fixed ABI above, never taken from the browser.
async function callToken(
  rpcUrl: string,
  address: string,
  fn: string,
  args: unknown[] = []
): Promise<unknown> {
  try {
    const data = token.encodeFunctionData(fn, args);
    const result = await ethApiCall<string>(rpcUrl, "eth_call", [{ to: address, data }, "latest"]);
    try {
      return token.decodeFunctionResult(fn, result)[0];
    } catch (e) {
      // Some older tokens return name and symbol as bytes32.
      if ((fn === "name" || fn === "symbol") && result.length === 66) {
        return decodeBytes32String(result);
      }
      throw e;
    }
  } catch {
    return undefined;
  }
}

// Reads whatever token metadata the contract exposes. Returns null when it
// answers none of it, so it's probably not a token.
export async function tokenInfo(rpcUrl: string, address: string): Promise<TokenInfo | null> {
  const [name, symbol, decimals, totalSupply, is721, is1155] = await Promise.all([
    callToken(rpcUrl, address, "name"),
    callToken(rpcUrl, address, "symbol"),
    callToken(rpcUrl, address, "decimals"),
    callToken(rpcUrl, address, "totalSupply"),
    callToken(rpcUrl, address, "supportsInterface", [ERC721_INTERFACE_ID]),
    callToken(rpcUrl, address, "supportsInterface", [ERC1155_INTERFACE_ID]),
  ]);
  const type: TokenType | undefined =
    is1155 === true
      ? "ERC-1155"
      : is721 === true
        ? "ERC-721"
        : decimals !== undefined && totalSupply !== undefined
          ? "ERC-20"
          : undefined;
  if (!type && name === undefined && symbol === undefined) return null;
  return {
    type,
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    decimals: decimals === undefined ? undefined : Number(decimals),
    totalSupply: totalSupply === undefined ? undefined : String(totalSupply),
  };
}
