import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { NodeDetails } from "@/types/Nodes";

type NodeInfo = { id: string; name: string; enode: string; ip: string };

export default apiRoute<NodeDetails>(async (body) => {
  const rpcUrl = requireString(body, "rpcUrl");
  try {
    const [info, blockNumber, peerCount, txpool] = await Promise.all([
      ethApiCall<NodeInfo>(rpcUrl, "admin_nodeInfo"),
      ethApiCall<string>(rpcUrl, "eth_blockNumber"),
      ethApiCall<string>(rpcUrl, "net_peerCount"),
      // Needs the TXPOOL api enabled on the node; treat as unknown otherwise.
      ethApiCall<unknown[]>(rpcUrl, "txpool_besuTransactions").catch(() => null),
    ]);
    return {
      online: true,
      nodeId: info.id,
      nodeName: info.name,
      enode: info.enode,
      ip: info.ip,
      blocks: parseInt(blockNumber, 16),
      peers: parseInt(peerCount, 16),
      pendingTxns: txpool ? txpool.length : -1,
    };
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return {
      online: false,
      nodeId: "",
      nodeName: "",
      enode: "",
      ip: "",
      blocks: 0,
      peers: 0,
      pendingTxns: 0,
    };
  }
});
