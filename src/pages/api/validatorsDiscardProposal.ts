import { apiRoute } from "@/lib/api.server";
import { consensusMethods, ethApiCall, requireConsensus } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";

export default apiRoute<boolean>(async (body) => {
  const algorithm = await requireConsensus();
  return ethApiCall<boolean>(requireString(body, "rpcUrl"), consensusMethods[algorithm].discard, [
    requireAddress(body, "address"),
  ]);
});
