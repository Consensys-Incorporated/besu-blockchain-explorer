export type ConsensusAlgorithm = "qbft" | "ibft" | "clique";

export const CONSENSUS_ALGORITHMS: ConsensusAlgorithm[] = ["qbft", "ibft", "clique"];

// A validator's own RPC endpoint, from the optional demo validators file.
export type ValidatorNode = {
  name: string;
  rpcUrl: string;
};

export type ExplorerConfig = {
  // The node every page reads from.
  rpcUrl: string;
  // The RPC URL handed to the browser wallet when it adds the network.
  publicRpcUrl: string;
  // Demo only: empty unless a validators file is present. Enables voting.
  validators: ValidatorNode[];
};

export type PageProps = {
  config: ExplorerConfig;
  // Detected from the node; null when it can't be reached or has no consensus API enabled.
  algorithm: ConsensusAlgorithm | null;
  disableAuth: boolean;
};
