import { useCallback, useEffect, useState } from "react";
import { Braces, Hammer, Rocket, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { DeployPanel } from "@/components/Contracts/DeployPanel";
import { InteractPanel } from "@/components/Contracts/InteractPanel";
import { PageHeader } from "@/components/Layout/PageHeader";
import { WalletPanel } from "@/components/Wallet/WalletPanel";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { contractTemplates } from "@/lib/contractTemplates";
import { useWallet } from "@/lib/wallet";
import type { PageProps } from "@/types/Config";
import {
  EVM_VERSIONS,
  type CompiledContracts,
  type DeployedContract,
  type SolcBuild,
} from "@/types/Contracts";

const CUSTOM = "__custom__";

export default function Playground({ config }: PageProps) {
  const wallet = useWallet(config);

  const [template, setTemplate] = useState(contractTemplates[0].name);
  const [code, setCode] = useState(contractTemplates[0].contract);
  const [builds, setBuilds] = useState<SolcBuild[]>([]);
  const [solcVersion, setSolcVersion] = useState("");
  const [evmVersion, setEvmVersion] = useState("london");
  const [compiling, setCompiling] = useState(false);
  const [compiled, setCompiled] = useState<CompiledContracts>({});
  const [deployed, setDeployed] = useState<DeployedContract[]>([]);
  const [interactAddress, setInteractAddress] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [tab, setTab] = useState("deploy");

  const log = useCallback(
    (msg: string) => setLogs((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l]),
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://binaries.soliditylang.org/bin/list.json", { signal: controller.signal })
      .then((r) => r.json())
      .then((list: { builds: (SolcBuild & { prerelease?: string })[] }) => {
        const releases = list.builds.filter((b) => !b.prerelease).reverse();
        setBuilds(releases);
        setSolcVersion(`v${releases[0]?.longVersion}`);
      })
      .catch((e) => !controller.signal.aborted && toast.error("Couldn't load compiler list", { description: errorMessage(e) }));
    return () => controller.abort();
  }, []);

  const chooseTemplate = (name: string) => {
    setTemplate(name);
    setCode(name === CUSTOM ? "" : contractTemplates.find((t) => t.name === name)!.contract);
  };

  const compile = async () => {
    if (!code.trim()) return toast.error("Enter some Solidity source first");
    setCompiling(true);
    try {
      const { contracts, errors } = await postApi<{ contracts: CompiledContracts; errors: string[] }>(
        "contractCompile",
        { content: code, version: solcVersion, evmVersion }
      );
      if (errors.length > 0) {
        toast.error("Compilation failed", { description: errors[0] });
        errors.forEach((e) => log(e));
        setTab("logs");
        return;
      }
      setCompiled(contracts);
      setDeployed([]);
      setInteractAddress("");
      toast.success(`Compiled ${Object.keys(contracts).length} contract(s)`);
      log(`Compiled with ${solcVersion} (${evmVersion}): ${Object.keys(contracts).join(", ")}`);
    } catch (e) {
      toast.error("Compilation failed", { description: errorMessage(e) });
      log(`Compilation failed: ${errorMessage(e)}`);
    } finally {
      setCompiling(false);
    }
  };

  const onDeployed = (c: DeployedContract) => {
    setDeployed((d) => [c, ...d]);
    setInteractAddress(c.address);
  };

  return (
    <>
      <PageHeader
        title="Playground"
        description="Compile, deploy and call Solidity contracts through your browser wallet."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Source</CardTitle>
            <CardAction>
              <Select value={template} onValueChange={chooseTemplate}>
                <SelectTrigger aria-label="Contract template" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  {contractTemplates.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Custom contract</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <Textarea
              aria-label="Solidity source"
              spellCheck={false}
              className="field-sizing-fixed min-h-[28rem] flex-1 resize-y font-mono text-[13px] leading-relaxed"
              placeholder={"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;"}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="solc-version">Compiler</Label>
                <Select value={solcVersion} onValueChange={setSolcVersion} disabled={builds.length === 0}>
                  <SelectTrigger id="solc-version" className="w-full">
                    <SelectValue placeholder="Loading…" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {builds.map((b) => (
                      <SelectItem key={b.path} value={`v${b.longVersion}`}>
                        {b.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evm-version">EVM</Label>
                <Select value={evmVersion} onValueChange={setEvmVersion}>
                  <SelectTrigger id="evm-version" className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EVM_VERSIONS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={compile} disabled={compiling || !solcVersion}>
                {compiling ? <Spinner data-icon="inline-start" /> : <Hammer data-icon="inline-start" />}
                Compile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <CardHeader>
              <TabsList className="w-full">
                <TabsTrigger value="deploy">
                  <Rocket /> Deploy &amp; interact
                </TabsTrigger>
                <TabsTrigger value="output">
                  <Braces /> ABI &amp; bytecode
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <ScrollText /> Logs
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="deploy" className="space-y-8">
                <section>
                  <h3 className="mb-3 font-medium">1. Wallet</h3>
                  <WalletPanel wallet={wallet} />
                </section>
                <section>
                  <h3 className="mb-3 font-medium">2. Deploy</h3>
                  <DeployPanel compiled={compiled} wallet={wallet} onDeployed={onDeployed} log={log} />
                </section>
                <section>
                  <h3 className="mb-3 font-medium">3. Interact</h3>
                  <InteractPanel
                    compiled={compiled}
                    deployed={deployed}
                    selected={deployed.find((d) => d.address === interactAddress) ?? null}
                    onSelect={setInteractAddress}
                    wallet={wallet}
                    log={log}
                  />
                </section>
              </TabsContent>
              <TabsContent value="output" className="space-y-4">
                {Object.keys(compiled).length === 0 ? (
                  <EmptyState>Nothing compiled yet.</EmptyState>
                ) : (
                  Object.entries(compiled).map(([name, c]) => (
                    <details key={name} className="rounded-lg border" open>
                      <summary className="cursor-pointer px-4 py-2 font-medium">{name}</summary>
                      <div className="space-y-3 border-t p-4">
                        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                          {JSON.stringify(c.abi, null, 2)}
                        </pre>
                        <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs break-all whitespace-pre-wrap">
                          {c.bytecode || "(abstract contract or interface, no bytecode)"}
                        </pre>
                      </div>
                    </details>
                  ))
                )}
              </TabsContent>
              <TabsContent value="logs">
                {logs.length === 0 ? (
                  <EmptyState>No activity yet.</EmptyState>
                ) : (
                  <pre className="max-h-[36rem] overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                    {logs.join("\n")}
                  </pre>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </>
  );
}

export const getServerSideProps = getPageProps;
