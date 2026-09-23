import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { collectSourceLibrary } from "@/scripts/source-library.mjs";
export type LibraryFile = { path: string; size: number; lines: number; content: string };
export type SourceLibrary = { version: number; generatedAt: string; omitted: number; files: LibraryFile[] };
let pending: Promise<SourceLibrary> | undefined;
let expires = 0;
export function getSourceLibrary(): Promise<SourceLibrary> {
  if (!pending || Date.now() >= expires) {
    expires = process.env.NODE_ENV === "development" ? Date.now() + 15_000 : Infinity;
    pending = (process.env.NODE_ENV === "development"
      ? collectSourceLibrary(process.cwd())
      : readFile(path.join(process.cwd(), ".source-library", "catalog.json"), "utf8").then(value => {
        const parsed = JSON.parse(value) as SourceLibrary;
        if (parsed.version !== 1 || !Array.isArray(parsed.files)) throw new Error("Invalid source library");
        return parsed;
      })).catch(error => { pending = undefined; throw error; });
  }
  return pending!;
}
