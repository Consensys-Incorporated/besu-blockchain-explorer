import { useState } from "react";
import { ContractFactory, Interface } from "ethers";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import { parseArg } from "@/lib/contracts";
import type { Wallet } from "@/lib/wallet";
import type { CompiledContracts, DeployedContract } from "@/types/Contracts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ParamInputs } from "./ParamInputs";

export function DeployPanel({
  compiled,
  wallet,
  onDeployed,
  log,
}: {
  compiled: CompiledContracts;
  wallet: Wallet;
  onDeployed: (c: DeployedContract) => void;
  log: (msg: string) => void;
}) {
  const deployable = Object.keys(compiled).filter((n) => compiled[n].bytecode !== "");
  const [selected, setSelected] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (deployable.length === 0) {
    return <EmptyState>Compile a contract to deploy it.</EmptyState>;
  }
  const name = deployable.includes(selected) ? selected : deployable[0];
  const iface = new Interface(compiled[name].abi);
  const inputs = iface.deploy.inputs;

  const deploy = async () => {
    setBusy(true);
    try {
      const signer = await wallet.getSigner();
      const factory = new ContractFactory(compiled[name].abi, compiled[name].bytecode, signer);
      const contract = await factory.deploy(...inputs.map((p, i) => parseArg(p, args[i] ?? "")));
      const tx = contract.deploymentTransaction();
      const pending = toast.loading(`Deploying ${name}…`, { description: tx?.hash });
      log(`Deploying ${name}, txn ${tx?.hash}`);
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      toast.success(`${name} deployed`, { id: pending, description: address });
      log(`${name} deployed at ${address}`);
      onDeployed({ name, address });
    } catch (e) {
      toast.error("Deployment failed", { description: errorMessage(e) });
      log(`Deployment of ${name} failed: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="deploy-contract">Contract</Label>
        <Select
          value={name}
          onValueChange={(v) => {
            setSelected(v);
            setArgs([]);
          }}
        >
          <SelectTrigger id="deploy-contract" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deployable.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ParamInputs idPrefix={`ctor-${name}`} params={inputs} values={args} onChange={setArgs} />
      <Button
        size="lg"
        onClick={deploy}
        disabled={busy || !wallet.account || !wallet.chainMatches}
        title={!wallet.account ? "Connect a wallet first" : !wallet.chainMatches ? "Wallet is on a different chain" : undefined}
      >
        {busy ? <Spinner data-icon="inline-start" /> : <Rocket data-icon="inline-start" />}
        Deploy
      </Button>
    </div>
  );
}
