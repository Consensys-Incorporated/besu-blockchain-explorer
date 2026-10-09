export type NodeDetails = {
  online: boolean;
  nodeId: string;
  nodeName: string;
  enode: string;
  ip: string;
  blocks: number;
  peers: number;
  pendingTxns: number;
};

export type Peer = {
  id: string;
  name: string;
  enode: string;
  localAddress: string;
  remoteAddress: string;
};
