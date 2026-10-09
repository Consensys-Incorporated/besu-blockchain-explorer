import { formatEther } from "ethers";

export function hexToNumber(hex?: string | null): number {
  return hex ? Number(BigInt(hex)) : 0;
}

export function hexToDecimal(hex?: string | null): string {
  return hex ? BigInt(hex).toString() : "0";
}

export function hexToEther(hex?: string | null): string {
  return formatEther(hex ? BigInt(hex) : BigInt(0));
}

export function shortenHex(s: string, head = 10, tail = 6): string {
  return s.length <= head + tail + 3 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// Block timestamps are hex seconds since epoch.
export function timeAgo(timestampHex: string, now = Date.now()): string {
  const secs = Math.max(0, Math.floor(now / 1000) - hexToNumber(timestampHex));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function formatTimestamp(timestampHex: string): string {
  return new Date(hexToNumber(timestampHex) * 1000).toLocaleString();
}
