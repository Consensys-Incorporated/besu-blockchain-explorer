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
import { useSelectedValidator } from "@/lib/nodeContext";
import type { PageProps } from "@/types/Config";
import type { PendingVote, Validator } from "@/types/Validators";

export default function Validators({ config, algorithm }: PageProps) {
  // Voting needs each validator's own RPC endpoint, which only the demo validators file provides.
  const [validator, selectValidator] = useSelectedValidator(config.validators);
  const rpcUrl = validator?.rpcUrl ?? config.rpcUrl;
  const [validators, setValidators] = useState<Validator[] | null>(null);
  const [votes, setVotes] = useState<PendingVote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  usePolling(
    async (signal) => {
      try {
        const [current, pending] = await Promise.all([
          postApi<Validator[]>("validatorsGetCurrent", { rpcUrl }, signal),
          validator
            ? postApi<PendingVote[]>("validatorsGetPendingVotes", { rpcUrl }, signal)
            : null,
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
    [rpcUrl]
  );

  const handleSelect = (name: string) => {
    setValidators(null);
    setVotes(null);
    setError(null);
    selectValidator(name);
  };

  return (
    <>
      <PageHeader
        title="Validators"
        description={`Consensus: ${algorithm?.toUpperCase() ?? "unknown"}`}
        nodes={validator ? config.validators : undefined}
        node={validator}
        onSelectNode={handleSelect}
      />
      <Alert className="mb-6">
        <Info />
        {validator ? (
          <AlertDescription className="space-y-2">
            <p>
              Votes are sent only to the validator selected above. To add or remove a validator,
              select more than half of the current validators one at a time and vote from each.
            </p>
            <p>
              Pending votes aren&apos;t cleared automatically once a change takes effect. Discard
              them from each validator that voted.
            </p>
          </AlertDescription>
        ) : (
          <AlertDescription>
            <p>
              Names come from each node&apos;s <code>--identity</code> and are shown for the node
              and its direct peers. Voting is available on demo networks that provide{" "}
              <code>/config/validators.json</code>.
            </p>
          </AlertDescription>
        )}
      </Alert>
      <div className={validator ? "grid gap-6 lg:grid-cols-2" : undefined}>
        <ValidatorsActive
          rpcUrl={validator ? rpcUrl : null}
          validators={validators}
          error={error}
        />
        {validator && (
          <div className="space-y-6">
            <ValidatorsPropose rpcUrl={rpcUrl} />
            <ValidatorsPending rpcUrl={rpcUrl} votes={votes} />
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps = getPageProps;
