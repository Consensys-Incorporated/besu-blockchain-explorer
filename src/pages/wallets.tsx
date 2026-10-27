import { useEffect, useState, type FormEvent } from "react";
import { formatEther, isAddress, parseEther } from "ethers";
import { toast } from "sonner";
import { PageHeader } from "@/components/Layout/PageHeader";
import { WalletPanel } from "@/components/Wallet/WalletPanel";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getPageProps } from "@/lib/api.server";
import { errorMessage } from "@/lib/api";
import { useWallet } from "@/lib/wallet";
import type { PageProps } from "@/types/Config";

function parseAmount(amount: string): bigint | null {
  try {
    const wei = parseEther(amount.trim());
    return wei > BigInt(0) ? wei : null;
  } catch {
    return null;
  }
}

export default function Wallets({ config }: PageProps) {
  const wallet = useWallet(config);
  const [balance, setBalance] = useState<{ account: string; eth: string } | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const [balanceNonce, setBalanceNonce] = useState(0);

  const { account, chainMatches, getSigner } = wallet;
  useEffect(() => {
    if (!account || !chainMatches) return;
    let cancelled = false;
    getSigner()
      .then((signer) => signer.provider.getBalance(account))
      .then((wei) => !cancelled && setBalance({ account, eth: formatEther(wei) }))
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [account, chainMatches, getSigner, balanceNonce]);

  const shownBalance = chainMatches && balance?.account === account ? balance.eth : null;
  const value = parseAmount(amount);
  const canSend = !!account && chainMatches && isAddress(to) && value !== null;

  const transfer = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    try {
      const signer = await getSigner();
      const tx = await signer.sendTransaction({ to, value });
      const pending = toast.loading("Transaction submitted", { description: tx.hash });
      const receipt = await tx.wait();
      toast.success(`Confirmed in block #${receipt?.blockNumber}`, {
        id: pending,
        description: tx.hash,
      });
      setAmount("");
      setBalanceNonce((n) => n + 1);
    } catch (err) {
      toast.error("Transfer failed", { description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Wallets"
        description="Send ETH from your browser wallet."
      />
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Transfer ETH</CardTitle>
          {shownBalance !== null && (
            <CardAction className="text-muted-foreground">
              Balance: <span className="font-medium text-foreground">{shownBalance} ETH</span>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <WalletPanel wallet={wallet} />
          <form onSubmit={transfer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Recipient</Label>
              <Input
                id="to"
                placeholder="0x…"
                className="font-mono"
                aria-invalid={to !== "" && !isAddress(to)}
                value={to}
                onChange={(e) => setTo(e.target.value.trim())}
              />
              {to && !isAddress(to) && <p className="text-xs text-destructive">Enter a valid 0x address</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="1.0"
                aria-invalid={amount !== "" && value === null}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && value === null && <p className="text-xs text-destructive">Enter a positive amount</p>}
            </div>
            <Button type="submit" size="lg" disabled={!canSend || busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export const getServerSideProps = getPageProps;
