import { apiRoute } from "@/lib/api.server";
import { tokenInfo } from "@/lib/chainData";
import { ethApiCall } from "@/lib/rpc";
import { requireAddress, requireString } from "@/lib/validate";
import type { ContractDetails } from "@/types/Explorer";

export default apiRoute<ContractDetails>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  const address = requireAddress(body, "address");
  const [code, balance] = await Promise.all([
    ethApiCall<string>(rpcUrl, "eth_getCode", [address, "latest"]),
    ethApiCall<string>(rpcUrl, "eth_getBalance", [address, "latest"]),
  ]);
  const isContract = code !== "0x";
  return {
    address,
    isContract,
    codeSize: isContract ? (code.length - 2) / 2 : 0,
    balance,
    token: isContract ? await tokenInfo(rpcUrl, address) : null,
  };
});
