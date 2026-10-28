import { useState } from "react";
import { BlockCountSelect } from "@/components/Explorer/BlockCountSelect";
import { ContractDialog } from "@/components/Explorer/ContractDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPageProps } from "@/lib/api.server";
import { postApi } from "@/lib/api";
import { formatTokenAmount, hexToNumber, shortenHex } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import type { PageProps } from "@/types/Config";
import type { TokenSummary } from "@/types/Explorer";

export default function Tokens({ config }: PageProps) {
  const [tokens, setTokens] = useState<TokenSummary[] | null>(null);
  const [count, setCount] = useState(10);
  const [open, setOpen] = useState<string | null>(null);

  usePolling(
    async (signal) => {
      setTokens(await postApi<TokenSummary[]>("tokensGetRecent", { rpcUrl: config.rpcUrl, count }, signal));
    },
    10000,
    [config.rpcUrl, count]
  );

  return (
    <>
      <PageHeader title="Tokens" description="ERC-20, ERC-721 and ERC-1155 tokens transferred in recent blocks." />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Active tokens</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <BlockCountSelect prefix="With transfers in the last" value={count} onChange={setCount} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <EmptyState>No token transfers in the last {count} blocks.</EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Total supply</TableHead>
                  <TableHead className="text-right">Transfers</TableHead>
                  <TableHead>Last active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow
                    key={t.address}
                    tabIndex={0}
                    onClick={() => setOpen(t.address)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(t.address)}
                    className="cursor-pointer outline-none focus-visible:bg-muted/50"
                  >
                    <TableCell>
                      <span className="font-medium">{t.name ?? "Unnamed"}</span>
                      {t.symbol && <span className="ml-2 text-muted-foreground">{t.symbol}</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone="info">{t.type}</StatusBadge>
                    </TableCell>
                    <TableCell className="font-mono text-xs" title={t.address}>
                      {shortenHex(t.address)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatTokenAmount(t.totalSupply, t.decimals)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.transfers}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">Block #{hexToNumber(t.lastBlock)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContractDialog rpcUrl={config.rpcUrl} address={open} onClose={() => setOpen(null)} />
    </>
  );
}

export const getServerSideProps = getPageProps;
