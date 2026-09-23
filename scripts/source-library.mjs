import { readdir, readFile, lstat, realpath, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const SOURCE_ROOTS = ["app", "components", "lib", "scripts", "docs", "supabase", "mobile/src", "tests"];
const ROOT_FILES = new Set(["package.json", "next.config.js", "tsconfig.json", "tailwind.config.js", "postcss.config.js", "middleware.ts", "README.md", "vercel.json", "mobile/package.json", "mobile/app.config.ts", "mobile/app.base.json", "mobile/tsconfig.json"]);
const SKIP = /^(?:node_modules|dist|build|out|coverage|release|backups?|fixtures|generated|\.\S*)$/i;
const SENSITIVE_NAME = /(?:credential|secret|private.?key|service.?account|backup|google-services|attached element|customer.?data|database.?dump)/i;
const EXTENSIONS = /\.(?:tsx?|jsx?|mjs|cjs|css|json|md|sql)$/i;
export function isLibraryPath(value) {
  if (typeof value !== "string" || value.length > 600 || value.includes("\\")) return false;
  const parts = value.split("/");
  if (parts.some(part => !part || part.startsWith(".") || SKIP.test(part) || /[:\u0000-\u001f]/.test(part))) return false;
  if (!EXTENSIONS.test(value) || SENSITIVE_NAME.test(parts.at(-1)) || /(?:^|[-_.])lock\./i.test(parts.at(-1))) return false;
  return ROOT_FILES.has(value) || SOURCE_ROOTS.some(root => value.startsWith(root + "/"));
}
export function containsEmbeddedSecret(content) {
  return /-----BEGIN (?:[A-Z ]*PRIVATE KEY|CERTIFICATE)-----/.test(content)
    || /\b(?:sk_(?:live|test)_[A-Za-z0-9]{16,}|sk-proj-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16})\b/.test(content)
    || /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{15,}\b/.test(content)
    || /(?:password|api[_-]?key|access[_-]?token|service[_-]?role[_-]?key|client[_-]?secret)\s*["']?\s*[:=]\s*["'][^"'\r\n]{16,}["']/i.test(content);
}
export async function collectSourceLibrary(root) {
  const base = await realpath(root);
  const files = [];
  const seen = new Set();
  let bytes = 0;
  let omitted = 0;
  async function visit(relative) {
    const parts = relative.split("/");
    if (parts.some(part => SKIP.test(part))) return;
    const fullPath = path.join(base, ...parts);
    let stat;
    try { stat = await lstat(fullPath); } catch (error) { if (error.code === "ENOENT") return; throw error; }
    if (stat.isSymbolicLink()) return;
    const resolved = await realpath(fullPath);
    if (!resolved.startsWith(base + path.sep)) return;
    if (stat.isDirectory()) {
      for (const entry of (await readdir(fullPath)).sort()) await visit(relative + "/" + entry);
      return;
    }
    if (!stat.isFile() || !isLibraryPath(relative) || seen.has(relative)) return;
    seen.add(relative);
    if (stat.size > 2 * 1024 * 1024) { omitted++; return; }
    const content = await readFile(resolved, "utf8");
    if (content.includes("\0") || containsEmbeddedSecret(content)) { omitted++; return; }
    bytes += Buffer.byteLength(content);
    if (bytes > 48 * 1024 * 1024) throw new Error("Source library exceeds its size budget; narrow the included folders.");
    files.push({ path: relative, size: Buffer.byteLength(content), lines: content.split("\n").length, content });
  }
  for (const rootPath of [...SOURCE_ROOTS, ...ROOT_FILES]) await visit(rootPath);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { version: 1, generatedAt: new Date().toISOString(), omitted, files };
}
export function searchLibrary(library, query = "", scope = "all", offset = 0, limit = 60) {
  const needle = query.trim().toLowerCase().slice(0, 120);
  const results = [];
  let total = 0;
  for (const file of library.files) {
    if (scope !== "all" && !file.path.startsWith(scope + "/")) continue;
    const pathMatch = !needle || file.path.toLowerCase().includes(needle);
    const contentIndex = needle ? file.content.toLowerCase().indexOf(needle) : -1;
    if (!pathMatch && contentIndex < 0) continue;
    total++;
    if (total <= offset || results.length >= limit) continue;
    const line = contentIndex >= 0 ? file.content.slice(0, contentIndex).split("\n").length : 1;
    const snippet = contentIndex >= 0 ? file.content.split("\n")[line - 1].slice(0, 240) : "";
    results.push({ path: file.path, size: file.size, lines: file.lines, line, snippet });
  }
  return { results, total, generatedAt: library.generatedAt, fileCount: library.files.length, omitted: library.omitted, nextOffset: offset + results.length < total ? offset + results.length : null };
}
export async function writeSourceLibrary(root) {
  const library = await collectSourceLibrary(root);
  const directory = path.join(root, ".source-library");
  await mkdir(directory, { recursive: true });
  const temporary = path.join(directory, `catalog-${process.pid}.tmp`);
  await writeFile(temporary, JSON.stringify(library), "utf8");
  await rename(temporary, path.join(directory, "catalog.json"));
  return library;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const library = await writeSourceLibrary(process.cwd());
  console.log(`Private source library prepared: ${library.files.length} files; ${library.omitted} files omitted by content/size checks.`);
}
