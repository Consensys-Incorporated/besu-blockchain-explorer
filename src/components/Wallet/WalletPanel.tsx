import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/DataList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { errorMessage } from "@/lib/api";
import type { Wallet } from "@/lib/wallet";

function chainLabel(id: string) {
  try {
    return id ? BigInt(id).toString() : "—";
  } catch {
    return id;
  }
}

// Shows the browser wallet's account and chain against the selected node's chain.
export function WalletPanel({ wallet }: { wallet: Wallet }) {
  const run = (fn: () => Promise<void>) => () =>
    fn().catch((e) => toast.error("Wallet request failed", { description: errorMessage(e) }));

  if (!wallet.installed) {
    return (
      <Alert>
        <TriangleAlert />
        <AlertTitle>No browser wallet detected</AlertTitle>
        <AlertDescription>
          <p>
            Install{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              MetaMask
            </a>{" "}
            to send transactions.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <DataList
        items={[
          {
            label: "Account",
            value: wallet.account || <span className="text-muted-foreground">Not connected</span>,
            mono: !!wallet.account,
          },
          {
            label: "Chain ID",
            value: (
              <span className="flex flex-wrap items-center gap-2">
                <span>Node {chainLabel(wallet.nodeChainId)}</span>
                <span className="text-muted-foreground">/</span>
                <span>Wallet {chainLabel(wallet.walletChainId)}</span>
                {wallet.nodeChainId && (
                  <StatusBadge tone={wallet.chainMatches ? "success" : "danger"}>
                    {wallet.chainMatches ? "Match" : "Mismatch"}
                  </StatusBadge>
                )}
              </span>
            ),
          },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        {wallet.account ? (
          <Button variant="outline" onClick={run(wallet.switchAccount)}>
            Switch account
          </Button>
        ) : (
          <Button onClick={run(wallet.connect)}>Connect wallet</Button>
        )}
        {wallet.nodeChainId && !wallet.chainMatches && (
          <Button variant="outline" onClick={run(wallet.switchNetwork)}>
            Switch wallet to node&apos;s chain
          </Button>
        )}
      </div>
    </div>
  );
}
