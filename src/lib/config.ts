import fs from "fs/promises";
import type { ExplorerConfig, ValidatorNode } from "@/types/Config";

// Server-side only. The explorer reads from a single node, QE_RPC_URL.
// QE_VALIDATORS_CONFIG_PATH optionally lists each validator's own RPC endpoint
// so the validators page can cast votes; it's meant for demo networks only.
export async function loadConfig(): Promise<ExplorerConfig> {
  const rpcUrl = process.env.QE_RPC_URL;
  if (!rpcUrl) {
    throw new Error("QE_RPC_URL must be set to a Besu node's HTTP JSON-RPC endpoint");
  }
  const validatorsPath = process.env.QE_VALIDATORS_CONFIG_PATH;
  return {
    rpcUrl,
    publicRpcUrl: process.env.QE_PUBLIC_RPC_URL || rpcUrl,
    validators: validatorsPath
      ? parseValidators(JSON.parse(await fs.readFile(validatorsPath, "utf8")))
      : [],
  };
}

// Returns a validated copy containing only the fields we use, so nothing
// unexpected in the file is ever shipped to the browser.
function parseValidators(raw: unknown): ValidatorNode[] {
  const list = (raw as { validators?: unknown })?.validators;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Validators config must contain at least one validator");
  }
  const names = new Set<string>();
  return list.map((v: { name?: unknown; rpcUrl?: unknown }, i) => {
    if (typeof v?.rpcUrl !== "string" || (v.name !== undefined && typeof v.name !== "string")) {
      throw new Error(`Validator at index ${i} must have a string "rpcUrl" and optional string "name"`);
    }
    const name = v.name || new URL(v.rpcUrl).host;
    if (names.has(name)) throw new Error(`Duplicate validator name "${name}"`);
    names.add(name);
    return { name, rpcUrl: v.rpcUrl };
  });
}
