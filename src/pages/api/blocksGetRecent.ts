import { apiRoute } from "@/lib/api.server";
import { clampBlockCount, recentBlocks } from "@/lib/chainData";
import { requireString } from "@/lib/validate";
import type { Block } from "@/types/Explorer";

// Returns the latest `count` blocks (with full transactions), newest first.
export default apiRoute<Block[]>(async (body) =>
  recentBlocks(requireString(body, "rpcUrl"), clampBlockCount(body.count))
);
