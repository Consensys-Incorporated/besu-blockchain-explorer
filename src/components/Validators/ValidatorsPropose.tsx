import { useState, type FormEvent } from "react";
import { isAddress } from "ethers";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage, postApi } from "@/lib/api";

export function ValidatorsPropose({ rpcUrl }: { rpcUrl: string }) {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = isAddress(address);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await postApi("validatorsPropose", { rpcUrl, address, vote: true });
      toast.success("Vote to add submitted", { description: address });
      setAddress("");
    } catch (err) {
      toast.error("Vote failed", { description: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Propose validator</CardTitle>
        <CardDescription>Cast a vote to add a new validator</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="validator-address">Validator address</Label>
            <Input
              id="validator-address"
              placeholder="0x…"
              className="font-mono"
              aria-invalid={address !== "" && !valid}
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
            />
            {address && !valid && <p className="text-xs text-destructive">Enter a valid 0x address</p>}
          </div>
          <Button type="submit" size="lg" disabled={!valid || busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
            Vote in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
