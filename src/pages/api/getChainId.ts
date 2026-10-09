import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";

export default apiRoute<{ chainId: string }>(async (body) => ({
  chainId: await ethApiCall<string>(requireString(body, "rpcUrl"), "eth_chainId"),
}));
