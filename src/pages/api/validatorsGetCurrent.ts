import { apiRoute } from "@/lib/api.server";
import { consensusMethods, ethApiCall, nodeNamesByAddress, requireConsensus } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Validator } from "@/types/Validators";

export default apiRoute<Validator[]>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const algorithm = await requireConsensus();
  const [addresses, names] = await Promise.all([
    ethApiCall<string[]>(rpcUrl, consensusMethods[algorithm].getValidators, ["latest"]),
    nodeNamesByAddress(rpcUrl),
  ]);
  return addresses.map((address) => ({ address, name: names.get(address.toLowerCase()) }));
});
