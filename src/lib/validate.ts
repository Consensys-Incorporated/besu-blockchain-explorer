import { isAddress } from "ethers";

export function requireString(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`"${key}" is required`);
  }
  return v;
}

export function requireAddress(body: Record<string, unknown>, key: string): string {
  const v = requireString(body, key);
  if (!isAddress(v)) throw new Error(`"${key}" is not a valid address`);
  return v;
}

export function requireHash(body: Record<string, unknown>, key: string): string {
  const v = requireString(body, key);
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) throw new Error(`"${key}" is not a valid 32-byte hash`);
  return v;
}
