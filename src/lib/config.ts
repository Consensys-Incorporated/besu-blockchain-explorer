import fs from "fs/promises";
import type { ExplorerConfig, ValidatorNode } from "@/types/Config";

const DEFAULT_VALIDATORS_PATH = "/config/validators.json";

// Server-side only. The explorer reads from a single node, BE_RPC_URL.
// A validators file optionally lists each validator's own RPC endpoint so the
// validators page can cast votes; it's meant for demo networks only.
export async function loadConfig(): Promise<ExplorerConfig> {
  const rpcUrl = process.env.BE_RPC_URL;
  if (!rpcUrl) {
    throw new Error("BE_RPC_URL must be set to a Besu node's HTTP JSON-RPC endpoint");
  }
  return {
    rpcUrl,
    publicRpcUrl: process.env.BE_PUBLIC_RPC_URL || rpcUrl,
    validators: await loadValidators(),
  };
}

// Reads BE_VALIDATORS_CONFIG_PATH, or /config/validators.json when it's unset.
// A missing default file just means voting is off; a missing explicit one is an error.
async function loadValidators(): Promise<ValidatorNode[]> {
  const explicitPath = process.env.BE_VALIDATORS_CONFIG_PATH;
  let text: string;
  try {
    text = await fs.readFile(explicitPath || DEFAULT_VALIDATORS_PATH, "utf8");
  } catch (e) {
    if (!explicitPath && (e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  return parseValidators(JSON.parse(text));
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
