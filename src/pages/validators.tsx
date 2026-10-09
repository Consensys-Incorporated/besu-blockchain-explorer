import { useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ValidatorsActive } from "@/components/Validators/ValidatorsActive";
import { ValidatorsPending } from "@/components/Validators/ValidatorsPending";
import { ValidatorsPropose } from "@/components/Validators/ValidatorsPropose";
import { getPageProps } from "@/lib/api.server";
import { errorMessage, postApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { useSelectedNode } from "@/lib/nodeContext";
import type { PageProps } from "@/types/Config";
import type { PendingVote } from "@/types/Validators";

export default function Validators({ config }: PageProps) {
  const [node, selectNode] = useSelectedNode(config);
  const [validators, setValidators] = useState<string[] | null>(null);
  const [votes, setVotes] = useState<PendingVote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(
    async (signal) => {
      try {
        const [current, pending] = await Promise.all([
          postApi<string[]>("validatorsGetCurrent", { rpcUrl: node.rpcUrl }, signal),
          postApi<PendingVote[]>("validatorsGetPendingVotes", { rpcUrl: node.rpcUrl }, signal),
        ]);
        setValidators(current);
        setVotes(pending);
        setError(null);
      } catch (e) {
        if (signal.aborted) return;
        setValidators([]);
        setVotes([]);
        setError(errorMessage(e));
      }
    },
    3000,
    [node.rpcUrl]
  );

  const handleSelect = (name: string) => {
    setValidators(null);
    setVotes(null);
    setError(null);
    selectNode(name);
  };

  return (
    <>
      <PageHeader
        title="Validators"
        description={`Consensus: ${config.algorithm.toUpperCase()}`}
        config={config}
        node={node}
        onSelectNode={handleSelect}
      />
      <Alert className="mb-6">
        <Info />
        <AlertDescription className="space-y-2">
          <p>
            Votes are sent only to the node selected above. To add or remove a validator, select
            more than half of the current validators one at a time and vote from each. Votes from
            non-validator nodes have no effect on consensus.
          </p>
          <p>
            Pending votes aren&apos;t cleared automatically once a change takes effect. Discard them
            from each node that voted.
          </p>
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <ValidatorsActive rpcUrl={node.rpcUrl} validators={validators} error={error} />
        <div className="space-y-6">
          <ValidatorsPropose rpcUrl={node.rpcUrl} />
          <ValidatorsPending rpcUrl={node.rpcUrl} votes={votes} />
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = getPageProps;
