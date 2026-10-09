import { useState } from "react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage, postApi } from "@/lib/api";

export function ValidatorsActive({
  rpcUrl,
  validators,
  error,
}: {
  rpcUrl: string;
  validators: string[] | null;
  error: string | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const proposeRemoval = async (address: string) => {
    setBusy(address);
    try {
      await postApi("validatorsPropose", { rpcUrl, address, vote: false });
      toast.success("Vote to remove submitted", { description: address });
    } catch (e) {
      toast.error("Vote failed", { description: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Active validators</CardTitle>
        {validators && <CardDescription>{validators.length} in the current set</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <EmptyState>{error}</EmptyState>
        ) : validators === null ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-11" />)
        ) : validators.length === 0 ? (
          <EmptyState>No validators returned by this node.</EmptyState>
        ) : (
          validators.map((v) => (
            <div key={v} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <code className="truncate font-mono text-[13px]">{v}</code>
              <Button
                variant="destructive"
                disabled={busy !== null}
                onClick={() => proposeRemoval(v)}
              >
                {busy === v ? <Spinner data-icon="inline-start" /> : <UserMinus data-icon="inline-start" />}
                Vote out
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
