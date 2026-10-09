// [address, true = vote to add | false = vote to remove]
export type PendingVote = [string, boolean];

export type ValidatorsResponse = {
  ok: boolean;
  validators: string[];
};

export type PendingVotesResponse = {
  ok: boolean;
  votes: PendingVote[];
};
