import { apiRoute } from "@/lib/api.server";
import { loadConfig } from "@/lib/config";
import { consensusMethods, ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";

export default apiRoute<string[]>(async (body) => {
  const { algorithm } = await loadConfig();
  return ethApiCall<string[]>(
    requireString(body, "rpcUrl"),
    consensusMethods[algorithm].getValidators,
    ["latest"]
  );
});
