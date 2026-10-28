import { useState } from "react";
import { toast } from "sonner";
import { BlockCountSelect } from "@/components/Explorer/BlockCountSelect";
import { BlockDialog } from "@/components/Explorer/BlockDialog";
import { SearchForm } from "@/components/Explorer/SearchForm";
import { TxnDialog } from "@/components/Explorer/TxnDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { gasUsedPercent, hexToDecimal, hexToNumber, shortenHex, timeAgo } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import type { PageProps } from "@/types/Config";
import type { Block, Txn } from "@/types/Explorer";

export default function Blocks({ config }: PageProps) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [count, setCount] = useState(10);
  const [now, setNow] = useState(() => Date.now());
  const [openBlock, setOpenBlock] = useState<Block | null>(null);
  const [openTxn, setOpenTxn] = useState<Txn | null>(null);

  usePolling(
    async (signal) => {
      const recent = await postApi<Block[]>("blocksGetRecent", { rpcUrl: config.rpcUrl, count }, signal);
      setBlocks(recent);
      setNow(Date.now());
    },
    5000,
    [config.rpcUrl, count]
  );

  const searchBlock = async (q: string) => {
    const n = Number(q);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Enter a block number");
      return;
    }
    try {
      const block = await postApi<Block | null>("blockGetByNumber", {
        rpcUrl: config.rpcUrl,
        blockNumber: "0x" + n.toString(16),
      });
      if (block) setOpenBlock(block);
      else toast.error(`Block ${n} not found`);
    } catch (e) {
      toast.error("Block lookup failed", { description: errorMessage(e) });
    }
  };

  return (
    <>
      <PageHeader title="Blocks" description="Latest blocks seen by the node." />

      <Card>
        <CardHeader className="border-b max-sm:grid-cols-1">
          <CardTitle>Latest blocks</CardTitle>
          <CardDescription className="flex items-center gap-2 max-sm:col-start-1">
            <BlockCountSelect prefix="Showing the last" value={count} onChange={setCount} />
          </CardDescription>
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-stretch">
            <SearchForm label="Search by block number" placeholder="Block number" onSearch={searchBlock} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {blocks === null ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Txns</TableHead>
                  <TableHead>Proposer</TableHead>
                  <TableHead className="text-right">Gas used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((b) => (
                  <TableRow
                    key={b.hash}
                    tabIndex={0}
                    onClick={() => setOpenBlock(b)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenBlock(b)}
                    className="cursor-pointer outline-none focus-visible:bg-muted/50"
                  >
                    <TableCell className="font-medium tabular-nums text-primary">#{hexToNumber(b.number)}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(b.timestamp, now)}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.transactions.length}</TableCell>
                    <TableCell className="font-mono text-xs" title={b.miner}>
                      {shortenHex(b.miner)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {hexToDecimal(b.gasUsed)} ({gasUsedPercent(b.gasUsed, b.gasLimit).toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BlockDialog block={openBlock} now={now} onClose={() => setOpenBlock(null)} onSelectTxn={setOpenTxn} />
      <TxnDialog txn={openTxn} onClose={() => setOpenTxn(null)} />
    </>
  );
}

export const getServerSideProps = getPageProps;
