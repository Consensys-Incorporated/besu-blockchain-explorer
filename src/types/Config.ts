export type ConsensusAlgorithm = "qbft" | "ibft" | "clique";

export const CONSENSUS_ALGORITHMS: ConsensusAlgorithm[] = ["qbft", "ibft", "clique"];

export type BesuNode = {
  name: string;
  rpcUrl: string;
};

export type ExplorerConfig = {
  algorithm: ConsensusAlgorithm;
  nodes: BesuNode[];
};

export type PageProps = {
  config: ExplorerConfig;
  disableAuth: boolean;
};
