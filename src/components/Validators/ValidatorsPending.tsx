import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { errorMessage, postApi } from "@/lib/api";
import type { PendingVote } from "@/types/Validators";

export function ValidatorsPending({ rpcUrl, votes }: { rpcUrl: string; votes: PendingVote[] | null }) {
  const [busy, setBusy] = useState<string | null>(null);

  const discard = async (address: string) => {
    setBusy(address);
    try {
      await postApi("validatorsDiscardProposal", { rpcUrl, address });
      toast.success("Vote discarded", { description: address });
    } catch (e) {
      toast.error("Discard failed", { description: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Pending votes</CardTitle>
        <CardDescription>Votes cast by the selected node</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {votes === null ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-11" />)
        ) : votes.length === 0 ? (
          <EmptyState>No pending votes on this node.</EmptyState>
        ) : (
          votes.map(([address, add]) => (
            <div key={address} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <StatusBadge tone={add ? "success" : "danger"}>{add ? "Add" : "Remove"}</StatusBadge>
                <code className="truncate font-mono text-[13px]">{address}</code>
              </div>
              <Button variant="outline" disabled={busy !== null} onClick={() => discard(address)}>
                {busy === address && <Spinner data-icon="inline-start" />}
                Discard
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
