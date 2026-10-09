import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { postApi } from "@/lib/api";
import type { BesuNode } from "@/types/Config";

type InjectedProvider = Eip1193Provider & {
  on(event: string, handler: (...args: never[]) => void): void;
  removeListener(event: string, handler: (...args: never[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

function sameChain(a: string, b: string) {
  try {
    return a !== "" && b !== "" && BigInt(a) === BigInt(b);
  } catch {
    return false;
  }
}

// Browser wallet (MetaMask or any EIP-1193 injected provider) state, plus the
// chain id of the selected Besu node so we can tell if they match.
const noopSubscribe = () => () => {};

export function useWallet(node: BesuNode) {
  // false during SSR/hydration, then whether an injected provider exists.
  const installed = useSyncExternalStore(
    noopSubscribe,
    () => !!window.ethereum,
    () => false
  );
  const [account, setAccount] = useState("");
  const [walletChainId, setWalletChainId] = useState("");
  const [nodeChain, setNodeChain] = useState({ rpcUrl: "", chainId: "" });
  const nodeChainId = nodeChain.rpcUrl === node.rpcUrl ? nodeChain.chainId : "";

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    const onAccounts = (accounts: string[]) => setAccount(accounts[0] ?? "");
    const onChain = (chainId: string) => setWalletChainId(chainId);
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(console.error);
    eth.request({ method: "eth_chainId" }).then(onChain).catch(console.error);
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    postApi<{ chainId: string }>("getChainId", { rpcUrl: node.rpcUrl }, controller.signal)
      .then((r) => setNodeChain({ rpcUrl: node.rpcUrl, chainId: r.chainId }))
      .catch((e) => !controller.signal.aborted && console.error(e));
    return () => controller.abort();
  }, [node.rpcUrl]);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("No browser wallet found. Install MetaMask to continue.");
    const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0] ?? "");
  }, []);

  const switchAccount = useCallback(async () => {
    await window.ethereum?.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  }, []);

  // Switch the wallet to the node's chain, adding it first if the wallet doesn't know it.
  const switchNetwork = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth || !nodeChainId) return;
    const chainId = "0x" + BigInt(nodeChainId).toString(16);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (e) {
      if ((e as { code?: number }).code !== 4902) throw e;
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
            chainName: `Besu ${BigInt(nodeChainId).toString()}`,
            rpcUrls: [node.rpcUrl],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          },
        ],
      });
    }
  }, [nodeChainId, node.rpcUrl]);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("No browser wallet found");
    return new BrowserProvider(window.ethereum).getSigner();
  }, []);

  return {
    installed,
    account,
    walletChainId,
    nodeChainId,
    chainMatches: sameChain(walletChainId, nodeChainId),
    connect,
    switchAccount,
    switchNetwork,
    getSigner,
  };
}

export type Wallet = ReturnType<typeof useWallet>;
