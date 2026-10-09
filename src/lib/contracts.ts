import { encodeBytes32String, type ParamType } from "ethers";

// Converts a form string into the value ethers expects for an ABI parameter.
export function parseArg(param: ParamType, raw: string): unknown {
  const value = raw.trim();
  if (param.isArray() || param.isTuple()) return JSON.parse(value);
  if (param.type === "bool") return value === "true" || value === "1";
  if (param.type === "bytes32" && !value.startsWith("0x")) return encodeBytes32String(value);
  return value;
}

export function placeholderFor(param: ParamType): string {
  if (param.isArray()) return "[…] JSON array";
  if (param.isTuple()) return "[…] JSON tuple";
  if (param.type === "bool") return "true / false";
  if (param.type === "address") return "0x…";
  if (param.type.startsWith("uint") || param.type.startsWith("int")) return "0";
  if (param.type === "bytes32") return "0x… or short text";
  if (param.type.startsWith("bytes")) return "0x…";
  return param.type;
}

// JSON.stringify that copes with the bigints ethers returns.
export function stringifyResult(value: unknown): string {
  const s = JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
  return s === undefined ? String(value) : s.replace(/^"(.*)"$/, "$1");
}
