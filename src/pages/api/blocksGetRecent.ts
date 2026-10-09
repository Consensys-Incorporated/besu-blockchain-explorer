import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Block } from "@/types/Explorer";

const MAX_BLOCKS = 50;

// Returns the latest `count` blocks (with full transactions), newest first.
export default apiRoute<Block[]>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const count = Math.min(Math.max(Number(body.count) || 10, 1), MAX_BLOCKS);
  const latest = parseInt(await ethApiCall<string>(rpcUrl, "eth_blockNumber"), 16);
  const numbers = Array.from({ length: Math.min(count, latest + 1) }, (_, i) => latest - i);
  const blocks = await Promise.all(
    numbers.map((n) =>
      ethApiCall<Block | null>(rpcUrl, "eth_getBlockByNumber", ["0x" + n.toString(16), true])
    )
  );
  return blocks.filter((b): b is Block => b !== null);
});
