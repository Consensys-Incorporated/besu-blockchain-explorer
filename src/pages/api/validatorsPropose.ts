import { apiRoute } from "@/lib/api.server";
import { consensusMethods, ethApiCall, requireConsensus } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";

// vote = true proposes adding the validator, false proposes removing it.
export default apiRoute<boolean>(async (body) => {
  const algorithm = await requireConsensus();
  return ethApiCall<boolean>(requireString(body, "rpcUrl"), consensusMethods[algorithm].propose, [
    requireAddress(body, "address"),
    body.vote === true,
  ]);
});
