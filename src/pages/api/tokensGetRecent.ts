import { apiRoute } from "@/lib/api.server";
import { clampBlockCount, recentTransferLogs, tokenInfo, transferTokenType } from "@/lib/chainData";
import { requireString } from "@/lib/validate";
import type { TokenSummary, TokenType } from "@/types/Explorer";

// Each token costs several calls for its metadata, so cap how many we look up.
const MAX_TOKENS = 25;

// Tokens with transfers in the latest `count` blocks, most recently active first.
export default apiRoute<TokenSummary[]>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const logs = await recentTransferLogs(rpcUrl, clampBlockCount(body.count));
  const seen = new Map<string, { type: TokenType; transfers: number; lastBlock: string }>();
  for (const log of logs) {
    const type = transferTokenType(log);
    if (!type) continue;
    const address = log.address.toLowerCase();
    const entry = seen.get(address);
    if (entry) {
      entry.transfers++;
      entry.lastBlock = log.blockNumber;
    } else {
      seen.set(address, { type, transfers: 1, lastBlock: log.blockNumber });
    }
  }
  const active = [...seen.entries()]
    .sort(([, a], [, b]) => parseInt(b.lastBlock, 16) - parseInt(a.lastBlock, 16))
    .slice(0, MAX_TOKENS);
  return Promise.all(
    active.map(async ([address, entry]) => ({
      ...(await tokenInfo(rpcUrl, address)),
      address,
      // The transfer events say which standard it is, even if the
      // contract doesn't implement supportsInterface.
      type: entry.type,
      transfers: entry.transfers,
      lastBlock: entry.lastBlock,
    }))
  );
});
