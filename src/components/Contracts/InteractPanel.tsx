import { useMemo } from "react";
import { Contract, Interface, type FunctionFragment } from "ethers";
import type { Wallet } from "@/lib/wallet";
import type { CompiledContracts, DeployedContract } from "@/types/Contracts";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FunctionCard } from "./FunctionCard";

export function InteractPanel({
  compiled,
  deployed,
  selected,
  onSelect,
  wallet,
  log,
}: {
  compiled: CompiledContracts;
  deployed: DeployedContract[];
  selected: DeployedContract | null;
  onSelect: (address: string) => void;
  wallet: Wallet;
  log: (msg: string) => void;
}) {
  const abi = selected ? compiled[selected.name]?.abi : undefined;
  const fragments = useMemo(
    () =>
      abi
        ? new Interface(abi).fragments.filter((f): f is FunctionFragment => f.type === "function")
        : [],
    [abi]
  );

  if (!selected || !abi) {
    return <EmptyState>Deploy a contract to interact with it.</EmptyState>;
  }

  const getContract = async () => new Contract(selected.address, abi, await wallet.getSigner());
  const reads = fragments.filter((f) => f.constant);
  const writes = fragments.filter((f) => !f.constant);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="interact-contract">Deployed contract</Label>
        <Select value={selected.address} onValueChange={onSelect}>
          <SelectTrigger id="interact-contract" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deployed.map((d) => (
              <SelectItem key={d.address} value={d.address}>
                {d.name} <span className="font-mono text-muted-foreground">{d.address}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {[
        { title: "Read", list: reads },
        { title: "Write", list: writes },
      ].map(
        ({ title, list }) =>
          list.length > 0 && (
            <section key={title} className="space-y-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
              {list.map((f) => (
                <FunctionCard
                  key={`${selected.address}-${f.format()}`}
                  fragment={f}
                  getContract={getContract}
                  log={log}
                />
              ))}
            </section>
          )
      )}
    </div>
  );
}
