import fs from "fs/promises";
import defaultConfig from "@/config/config.json";
import {
  CONSENSUS_ALGORITHMS,
  type ConsensusAlgorithm,
  type ExplorerConfig,
} from "@/types/Config";

// Server-side only: reads the node config from QE_CONFIG_PATH (or the bundled
// default) and returns a validated copy containing only the fields we use, so
// nothing unexpected in the file is ever shipped to the browser.
export async function loadConfig(): Promise<ExplorerConfig> {
  const raw = process.env.QE_CONFIG_PATH
    ? JSON.parse(await fs.readFile(process.env.QE_CONFIG_PATH, "utf8"))
    : defaultConfig;
  return parseConfig(raw);
}

function parseConfig(raw: unknown): ExplorerConfig {
  const cfg = raw as { algorithm?: unknown; nodes?: unknown };
  const algorithm = String(cfg?.algorithm ?? "").toLowerCase();
  if (!CONSENSUS_ALGORITHMS.includes(algorithm as ConsensusAlgorithm)) {
    throw new Error(
      `Unsupported consensus algorithm "${cfg?.algorithm}". Expected one of: ${CONSENSUS_ALGORITHMS.join(", ")}`
    );
  }
  if (!Array.isArray(cfg.nodes) || cfg.nodes.length === 0) {
    throw new Error("Config must contain at least one node");
  }
  const nodes = cfg.nodes.map((n: { name?: unknown; rpcUrl?: unknown }, i) => {
    if (typeof n?.name !== "string" || typeof n?.rpcUrl !== "string") {
      throw new Error(`Node at index ${i} must have a string "name" and "rpcUrl"`);
    }
    return { name: n.name, rpcUrl: n.rpcUrl };
  });
  return { algorithm: algorithm as ConsensusAlgorithm, nodes };
}
