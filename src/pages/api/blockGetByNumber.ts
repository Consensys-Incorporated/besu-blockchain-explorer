import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Block } from "@/types/Explorer";

export default apiRoute<Block | null>(async (body) => {
  const blockNumber = requireString(body, "blockNumber");
  if (blockNumber !== "latest" && !/^0x[0-9a-fA-F]+$/.test(blockNumber)) {
    throw new Error('"blockNumber" must be "latest" or a hex quantity');
  }
  return ethApiCall<Block | null>(requireString(body, "rpcUrl"), "eth_getBlockByNumber", [
    blockNumber,
    true,
  ]);
});
