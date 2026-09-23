import { getSourceLibrary } from "./source-library";
import { isLibraryPath, containsEmbeddedSecret } from "../scripts/source-library.mjs";

export async function getLearningSourceContext(sourcePath?: string, sourceLine = 1) {
  if (!sourcePath) return { text: "No source file selected.", sources: [] };
  if (!isLibraryPath(sourcePath)) throw new Error("INVALID_SOURCE");
  const library = await getSourceLibrary();
  const file = library.files.find(item => item.path === sourcePath);
  if (!file || containsEmbeddedSecret(file.content)) throw new Error("SOURCE_UNAVAILABLE");
  const lines = file.content.split("\n");
  const start = Math.max(0, Math.min(sourceLine - 1, lines.length - 1) - 15);
  const excerpt: string[] = [];
  let length = 0;
  for (let i = start; i < Math.min(lines.length, start + 120); i++) {
    const row = String(i + 1) + ": " + lines[i].slice(0, 1500);
    if (length + row.length > 12000) break;
    excerpt.push(row); length += row.length;
  }
  const source = { path: file.path, startLine: start + 1, endLine: start + excerpt.length, generatedAt: library.generatedAt };
  return { text: JSON.stringify({ ...source, totalLines: lines.length, excerpt: excerpt.join("\n"), note: "Partial deployment source snapshot; not a live database or filesystem." }), sources: [source] };
}
