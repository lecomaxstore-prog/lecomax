import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports: Record<string, any> = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../../lib/request-body.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports, Uint8Array, TextDecoder, Response, Error,
  require: (name: string) => { if (name === "server-only") return {}; throw new Error(name); },
});

// Older domain tests model requests as { json() }. Adapt their input into a real
// stream and run the production parser; do not disable limits to pass tests.
export function securityIo(name: string) {
  if (name === "@/lib/request-body") return {
    ...exports,
    readJsonLimited: async (req: any, maxBytes?: number) => exports.readJsonLimited(
      "body" in req ? req : new Request("https://test.invalid", { method: "POST", body: JSON.stringify(await req.json()) }), maxBytes,
    ),
  };
  if (name === "@/lib/public-error") return { publicDatabaseError: () => "Service momentanément indisponible. Veuillez réessayer." };
  if (name === "server-only") return {};
  return undefined;
}
