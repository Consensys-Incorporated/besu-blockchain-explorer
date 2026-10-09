import { useMemo, useState } from "react";
import { FileCode2, Send } from "lucide-react";
import { toast } from "sonner";
import { BlockDialog } from "@/components/Explorer/BlockDialog";
import { SearchForm } from "@/components/Explorer/SearchForm";
import { TxnDialog } from "@/components/Explorer/TxnDialog";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { hexToEther, hexToNumber, shortenHex, timeAgo } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import { useSelectedNode } from "@/lib/nodeContext";
import type { PageProps } from "@/types/Config";
import type { Block, Txn } from "@/types/Explorer";

const LOOKBACK_OPTIONS = [10, 20, 30, 50];
const BLOCK_CARDS = 8;

export default function Explorer({ config }: PageProps) {
  const [node, selectNode] = useSelectedNode(config);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [lookback, setLookback] = useState(10);
  const [now, setNow] = useState(() => Date.now());
  const [openBlock, setOpenBlock] = useState<Block | null>(null);
  const [openTxn, setOpenTxn] = useState<Txn | null>(null);

  usePolling(
    async (signal) => {
      const recent = await postApi<Block[]>(
        "blocksGetRecent",
        { rpcUrl: node.rpcUrl, count: lookback },
        signal
      );
      setBlocks(recent);
      setNow(Date.now());
    },
    5000,
    [node.rpcUrl, lookback]
  );

  const txns = useMemo(() => (blocks ?? []).flatMap((b) => b.transactions), [blocks]);

  const searchBlock = async (q: string) => {
    const n = Number(q);
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Enter a block number");
      return;
    }
    try {
      const block = await postApi<Block | null>("blockGetByNumber", {
        rpcUrl: node.rpcUrl,
        blockNumber: "0x" + n.toString(16),
      });
      if (block) setOpenBlock(block);
      else toast.error(`Block ${n} not found`);
    } catch (e) {
      toast.error("Block lookup failed", { description: errorMessage(e) });
    }
  };

  const searchTxn = async (hash: string) => {
    try {
      const txn = await postApi<Txn | null>("txnGetByHash", { rpcUrl: node.rpcUrl, hash });
      if (txn) setOpenTxn(txn);
      else toast.error("Transaction not found");
    } catch (e) {
      toast.error("Transaction lookup failed", { description: errorMessage(e) });
    }
  };

  return (
    <>
      <PageHeader
        title="Explorer"
        description="Latest blocks and transactions seen by the selected node."
        config={config}
        node={node}
        onSelectNode={(name) => {
          setBlocks(null);
          selectNode(name);
        }}
      />

      <Card>
        <CardHeader className="border-b max-sm:grid-cols-1">
          <CardTitle>Latest blocks</CardTitle>
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-auto max-sm:justify-self-stretch">
            <SearchForm label="Search by block number" placeholder="Block number" onSearch={searchBlock} />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {blocks === null
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            : blocks.slice(0, BLOCK_CARDS).map((b, i) => (
                <button
                  key={b.hash}
                  onClick={() => setOpenBlock(b)}
                  data-extra={i >= 4}
                  className="data-[extra=true]:max-sm:hidden rounded-lg border p-4 text-left transition-colors outline-none hover:border-primary hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold tabular-nums">#{hexToNumber(b.number)}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(b.timestamp, now)}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {b.transactions.length} txn{b.transactions.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">by {shortenHex(b.miner)}</p>
                </button>
              ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="border-b max-sm:grid-cols-1">
          <CardTitle>Recent transactions</CardTitle>
          <CardDescription className="flex items-center gap-2 max-sm:col-start-1">
            From the last
            <Select value={String(lookback)} onValueChange={(v) => setLookback(Number(v))}>
              <SelectTrigger size="sm" aria-label="Number of blocks to scan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOOKBACK_OPTIONS.map((o) => (
                  <SelectItem key={o} value={String(o)}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            blocks
          </CardDescription>
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-stretch">
            <SearchForm label="Search by transaction hash" placeholder="Transaction hash (0x…)" onSearch={searchTxn} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {blocks === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : txns.length === 0 ? (
            <EmptyState>No transactions in the last {lookback} blocks.</EmptyState>
          ) : (
            <ul className="-mx-(--card-spacing) divide-y">
              {txns.map((t) => (
                <li key={t.hash}>
                  <button
                    onClick={() => setOpenTxn(t)}
                    className="grid w-full gap-2 px-(--card-spacing) py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted/50 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-4"
                  >
                    {t.to === null ? (
                      <StatusBadge tone="warning">
                        <FileCode2 /> Deploy
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="info">
                        <Send /> Txn
                      </StatusBadge>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[13px]">{t.hash}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {shortenHex(t.from)} → {t.to ? shortenHex(t.to) : "new contract"}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-right">
                      <p>Block #{hexToNumber(t.blockNumber)}</p>
                      <p>{hexToEther(t.value)} ETH</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <BlockDialog block={openBlock} onClose={() => setOpenBlock(null)} />
      <TxnDialog txn={openTxn} onClose={() => setOpenTxn(null)} />
    </>
  );
}

export const getServerSideProps = getPageProps;
