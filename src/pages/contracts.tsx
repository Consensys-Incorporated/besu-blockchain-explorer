import { useState } from "react";
import { isAddress } from "ethers";
import { toast } from "sonner";
import { BlockCountSelect } from "@/components/Explorer/BlockCountSelect";
import { ContractDialog } from "@/components/Explorer/ContractDialog";
import { SearchForm } from "@/components/Explorer/SearchForm";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPageProps } from "@/lib/api.server";
import { postApi } from "@/lib/api";
import { hexToNumber, shortenHex, timeAgo } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import type { PageProps } from "@/types/Config";
import type { ContractSummary } from "@/types/Explorer";

export default function Contracts({ config }: PageProps) {
  const [contracts, setContracts] = useState<ContractSummary[] | null>(null);
  const [count, setCount] = useState(10);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState<{ address: string; summary?: ContractSummary } | null>(null);

  usePolling(
    async (signal) => {
      const recent = await postApi<ContractSummary[]>(
        "contractsGetRecent",
        { rpcUrl: config.rpcUrl, count },
        signal
      );
      setContracts(recent);
      setNow(Date.now());
    },
    10000,
    [config.rpcUrl, count]
  );

  const searchAddress = async (q: string) => {
    if (!isAddress(q)) {
      toast.error("Enter a valid 0x address");
      return;
    }
    setOpen({ address: q, summary: contracts?.find((c) => c.address.toLowerCase() === q.toLowerCase()) });
  };

  return (
    <>
      <PageHeader title="Contracts" description="Contracts deployed in recent blocks." />

      <Card>
        <CardHeader className="border-b max-sm:grid-cols-1">
          <CardTitle>Recently deployed</CardTitle>
          <CardDescription className="flex items-center gap-2 max-sm:col-start-1">
            <BlockCountSelect prefix="From the last" value={count} onChange={setCount} />
          </CardDescription>
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-stretch">
            <SearchForm label="Search by contract address" placeholder="Contract address (0x…)" onSearch={searchAddress} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {contracts === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState>
              No contracts deployed in the last {count} blocks. Search by address to look up an older one.
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Block</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow
                    key={c.address}
                    tabIndex={0}
                    onClick={() => setOpen({ address: c.address, summary: c })}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen({ address: c.address, summary: c })}
                    className="cursor-pointer outline-none focus-visible:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs text-primary" title={c.address}>
                      {shortenHex(c.address, 12, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-xs" title={c.creator}>
                      {shortenHex(c.creator)}
                    </TableCell>
                    <TableCell className="tabular-nums">#{hexToNumber(c.blockNumber)}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(c.timestamp, now)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContractDialog
        rpcUrl={config.rpcUrl}
        address={open?.address ?? null}
        summary={open?.summary}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

export const getServerSideProps = getPageProps;
