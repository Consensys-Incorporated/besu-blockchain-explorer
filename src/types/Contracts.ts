import type { InterfaceAbi } from "ethers";

export type CompiledContractArtifact = {
  abi: InterfaceAbi;
  bytecode: string;
};

// Keyed by contract name, as returned by /api/contractCompile.
export type CompiledContracts = Record<string, CompiledContractArtifact>;

export type DeployedContract = {
  name: string;
  address: string;
};

export type SolcBuild = {
  path: string;
  version: string;
  longVersion: string;
};

// Target EVM versions offered for compilation. Older Besu networks without
// Shanghai enabled in genesis need "london" or "paris" (no PUSH0 opcode).
export const EVM_VERSIONS = ["london", "paris", "shanghai", "cancun", "prague"];
