export type Txn = {
  blockHash: string;
  blockNumber: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: string;
  to: string | null;
  transactionIndex: string;
  value: string;
  type?: string;
};

export type Block = {
  number: string;
  hash: string;
  parentHash: string;
  stateRoot: string;
  receiptsRoot: string;
  transactionsRoot: string;
  miner: string;
  size: string;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;
  timestamp: string;
  transactions: Txn[];
};

export type TokenType = "ERC-20" | "ERC-721" | "ERC-1155";

// Fields a token contract answered; any of them can be missing.
export type TokenInfo = {
  type?: TokenType;
  name?: string;
  symbol?: string;
  decimals?: number;
  // Decimal string in the token's smallest unit.
  totalSupply?: string;
};

export type ContractSummary = {
  address: string;
  creator: string;
  txHash: string;
  blockNumber: string;
  timestamp: string;
};

export type TokenSummary = TokenInfo & {
  address: string;
  type: TokenType;
  // Transfer events in the scanned blocks.
  transfers: number;
  lastBlock: string;
};

export type ContractDetails = {
  address: string;
  isContract: boolean;
  codeSize: number;
  // Hex wei.
  balance: string;
  token: TokenInfo | null;
};
