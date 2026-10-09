import { useState } from "react";
import type { Contract, FunctionFragment } from "ethers";
import { parseEther } from "ethers";
import { BookOpen, PenLine } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import { parseArg, stringifyResult } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ParamInputs } from "./ParamInputs";

export function FunctionCard({
  fragment,
  getContract,
  log,
}: {
  fragment: FunctionFragment;
  getContract: () => Promise<Contract>;
  log: (msg: string) => void;
}) {
  const [args, setArgs] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signature = fragment.format();
  const readOnly = fragment.constant;

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const contract = await getContract();
      const fn = contract.getFunction(signature);
      const params = fragment.inputs.map((p, i) => parseArg(p, args[i] ?? ""));
      if (readOnly) {
        const out = await fn.staticCall(...params);
        const text = stringifyResult(out);
        setResult(text);
        log(`${signature} → ${text}`);
      } else {
        const overrides = fragment.payable && value ? { value: parseEther(value) } : {};
        const tx = await fn.send(...params, overrides);
        const pending = toast.loading(`Sent ${fragment.name}`, { description: tx.hash });
        const receipt = await tx.wait();
        const msg = `Confirmed in block #${receipt?.blockNumber}`;
        toast.success(msg, { id: pending, description: tx.hash });
        setResult(msg);
        log(`${signature} txn ${tx.hash} ${msg.toLowerCase()}`);
      }
    } catch (e) {
      toast.error(`${fragment.name} failed`, { description: errorMessage(e) });
      log(`${signature} failed: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <code className="truncate font-mono text-[13px]">{fragment.name}</code>
        <Button variant={readOnly ? "secondary" : "default"} disabled={busy} onClick={run}>
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : readOnly ? (
            <BookOpen data-icon="inline-start" />
          ) : (
            <PenLine data-icon="inline-start" />
          )}
          {readOnly ? "Call" : "Transact"}
        </Button>
      </div>
      <ParamInputs idPrefix={signature} params={fragment.inputs} values={args} onChange={setArgs} />
      {fragment.payable && (
        <div className="space-y-1.5">
          <Label htmlFor={`${signature}-value`} className="text-xs">
            Value (ETH)
          </Label>
          <Input
            id={`${signature}-value`}
            placeholder="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      )}
      {result !== null && (
        <pre className="overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
