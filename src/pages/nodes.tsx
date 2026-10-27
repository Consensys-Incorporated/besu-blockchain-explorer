import { useState, type ReactNode } from "react";
import { Activity, ArrowLeftRight, Blocks, Users } from "lucide-react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { PeersTable } from "@/components/Nodes/PeersTable";
import { StatCard } from "@/components/Nodes/StatCard";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataList } from "@/components/ui/DataList";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPageProps } from "@/lib/api.server";
import { postApi } from "@/lib/api";
import { clientIdentity } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import type { PageProps } from "@/types/Config";
import type { NodeDetails, Peer } from "@/types/Nodes";

export default function Nodes({ config }: PageProps) {
  const [details, setDetails] = useState<NodeDetails | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

  usePolling(
    async (signal) => {
      const d = await postApi<NodeDetails>("nodeGetDetails", { rpcUrl: config.rpcUrl }, signal);
      setDetails(d);
      setPeers(
        d.online ? await postApi<Peer[]>("nodeGetPeers", { rpcUrl: config.rpcUrl }, signal) : []
      );
    },
    5000,
    [config.rpcUrl]
  );

  const loading = details === null;
  const online = details?.online ?? false;
  const value = (v: ReactNode) =>
    loading ? <Skeleton className="h-5 w-2/3" /> : online ? v : "—";

  return (
    <>
      <PageHeader
        title="Nodes"
        description="Health and identity of the Besu node."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status"
          loading={loading}
          value={online ? "Running" : "Unreachable"}
          icon={<Activity className={online ? "size-5 text-emerald-500" : "size-5 text-red-500"} />}
        />
        <StatCard
          label="Block height"
          loading={loading}
          value={online ? details!.blocks.toLocaleString() : "—"}
          icon={<Blocks className="size-5 text-primary" />}
        />
        <StatCard
          label="Peers"
          loading={loading}
          value={online ? details!.peers : "—"}
          icon={<Users className="size-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending txns"
          loading={loading}
          value={!online ? "—" : details!.pendingTxns < 0 ? "n/a" : details!.pendingTxns}
          icon={<ArrowLeftRight className="size-5 text-orange-500" />}
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Node details</CardTitle>
          {!loading && (
            <CardAction>
              <StatusBadge tone={online ? "success" : "danger"}>{online ? "Online" : "Offline"}</StatusBadge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <DataList
            items={[
              {
                label: "Name",
                value: value(clientIdentity(details?.nodeName ?? "") ?? "Not set (--identity)"),
              },
              { label: "Client", value: value(details?.nodeName) },
              { label: "Node ID", value: value(details?.nodeId), mono: true },
              { label: "Enode", value: value(details?.enode), mono: true },
              { label: "IP address", value: value(details?.ip), mono: true },
              { label: "RPC URL", value: config.rpcUrl, mono: true },
            ]}
          />
        </CardContent>
      </Card>

      {online && (
        <div className="mt-6">
          <PeersTable peers={peers} />
        </div>
      )}
    </>
  );
}

export const getServerSideProps = getPageProps;
