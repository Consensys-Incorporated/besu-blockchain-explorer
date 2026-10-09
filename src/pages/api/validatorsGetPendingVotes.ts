import { apiRoute } from "@/lib/api.server";
import { loadConfig } from "@/lib/config";
import { consensusMethods, ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { PendingVote } from "@/types/Validators";

export default apiRoute<PendingVote[]>(async (body) => {
  const { algorithm } = await loadConfig();
  // All three algorithms return a map of { address: voteToAdd }.
  const votes = await ethApiCall<Record<string, boolean>>(
    requireString(body, "rpcUrl"),
    consensusMethods[algorithm].getPendingVotes
  );
  return Object.entries(votes ?? {});
});
