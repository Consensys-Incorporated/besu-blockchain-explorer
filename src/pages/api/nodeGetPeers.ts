import { apiRoute } from "@/lib/api.server";
import { ethApiCall } from "@/lib/rpc";
import { requireString } from "@/lib/validate";
import type { Peer } from "@/types/Nodes";

type AdminPeer = {
  id: string;
  name: string;
  enode: string;
  network: { localAddress: string; remoteAddress: string };
};

export default apiRoute<Peer[]>(async (body) => {
  const peers = await ethApiCall<AdminPeer[]>(requireString(body, "rpcUrl"), "admin_peers");
  return peers.map((p) => ({
    id: p.id,
    name: p.name,
    enode: p.enode,
    localAddress: p.network.localAddress,
    remoteAddress: p.network.remoteAddress,
  }));
});
