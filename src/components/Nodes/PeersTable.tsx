import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shortenHex } from "@/lib/format";
import type { Peer } from "@/types/Nodes";

export function PeersTable({ peers }: { peers: Peer[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Peers</CardTitle>
        <CardDescription>{peers.length} connected</CardDescription>
      </CardHeader>
      <CardContent>
        {peers.length === 0 ? (
          <EmptyState>No peers reported by this node.</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Node ID</TableHead>
                <TableHead>Local address</TableHead>
                <TableHead>Remote address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="font-mono" title={p.enode}>
                    {shortenHex(p.id, 12, 8)}
                  </TableCell>
                  <TableCell className="font-mono">{p.localAddress}</TableCell>
                  <TableCell className="font-mono">{p.remoteAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
