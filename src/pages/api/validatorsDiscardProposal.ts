import { apiRoute } from "@/lib/api.server";
import { loadConfig } from "@/lib/config";
import { consensusMethods, ethApiCall } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";

export default apiRoute<boolean>(async (body) => {
  const { algorithm } = await loadConfig();
  return ethApiCall<boolean>(requireString(body, "rpcUrl"), consensusMethods[algorithm].discard, [
    requireAddress(body, "address"),
  ]);
});
