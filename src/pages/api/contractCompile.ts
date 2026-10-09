import solc from "solc";
import { apiRoute } from "@/lib/api.server";
import { requireString } from "@/lib/validate";
import { EVM_VERSIONS, type CompiledContracts } from "@/types/Contracts";

type Solc = { compile: (input: string) => string };

// Compilers are downloaded from binaries.soliditylang.org; keep them in memory.
const compilers = new Map<string, Promise<Solc>>();

function loadCompiler(version: string): Promise<Solc> {
  let compiler = compilers.get(version);
  if (!compiler) {
    compiler = new Promise<Solc>((resolve, reject) =>
      solc.loadRemoteVersion(version, (err: Error | null, snapshot: Solc) =>
        err ? reject(err) : resolve(snapshot)
      )
    );
    compiler.catch(() => compilers.delete(version));
    compilers.set(version, compiler);
  }
  return compiler;
}

type SolcOutput = {
  errors?: { severity: string; formattedMessage: string }[];
  contracts?: Record<string, Record<string, { abi: []; evm: { bytecode: { object: string } } }>>;
};

export default apiRoute<{ contracts: CompiledContracts; errors: string[] }>(async (body) => {
  const content = requireString(body, "content");
  const version = requireString(body, "version");
  if (!/^v\d+\.\d+\.\d+\+commit\.[0-9a-f]{8}$/.test(version)) {
    throw new Error(`Invalid compiler version "${version}"`);
  }
  const evmVersion = typeof body.evmVersion === "string" ? body.evmVersion : undefined;
  if (evmVersion && !EVM_VERSIONS.includes(evmVersion)) {
    throw new Error(`Invalid EVM version "${evmVersion}"`);
  }
  const compiler = await loadCompiler(version);
  const output: SolcOutput = JSON.parse(
    compiler.compile(
      JSON.stringify({
        language: "Solidity",
        sources: { main: { content } },
        settings: {
          ...(evmVersion && { evmVersion }),
          outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
      })
    )
  );
  const errors = (output.errors ?? [])
    .filter((e) => e.severity === "error")
    .map((e) => e.formattedMessage);
  const contracts: CompiledContracts = {};
  for (const [name, c] of Object.entries(output.contracts?.main ?? {})) {
    contracts[name] = { abi: c.abi, bytecode: c.evm.bytecode.object };
  }
  return { contracts, errors };
});
