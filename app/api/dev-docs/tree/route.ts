import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { protectSourceBrowser, allowedSourcePath } from "@/lib/dev-docs-access";

// ── Security: folders/files that must never appear in the tree ──────────────
const BLOCKED_NAMES = new Set([
  "node_modules", ".git", ".next", ".vercel", "dist", "build", ".turbo",
  ".DS_Store", "Thumbs.db",
]);
const BLOCKED_PREFIXES = [".env"];
const BLOCKED_EXTENSIONS = new Set([".key", ".pem", ".p12", ".pfx", ".cert", ".crt"]);
const BINARY_EXTENSIONS = new Set([
  "avif", "webp", "png", "jpg", "jpeg", "gif", "bmp", "ico",
  "woff", "woff2", "ttf", "eot", "otf",
  "mp4", "mp3", "wav", "webm", "ogg",
  "zip", "tar", "gz", "rar", "7z",
  "exe", "dll", "so", "bin",
]);

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "dir";
  ext?: string;
  size?: number;
  binary?: boolean;
  children?: FileNode[];
};

function shouldBlock(name: string): boolean {
  if (BLOCKED_NAMES.has(name)) return true;
  for (const prefix of BLOCKED_PREFIXES) {
    if (name.startsWith(prefix)) return true;
  }
  const ext = path.extname(name).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) return true;
  return false;
}

function buildTree(dirPath: string, relPath: string = "", depth = 0): FileNode[] {
  if (depth > 8) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const nodes: FileNode[] = [];
  for (const entry of entries) {
    if (shouldBlock(entry.name) || entry.name.startsWith(".") || entry.isSymbolicLink()) continue;
    const nodePath = relPath ? `${relPath}/${entry.name}` : entry.name;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: nodePath,
        type: "dir",
        children: buildTree(fullPath, nodePath, depth + 1),
      });
    } else if (entry.isFile()) {
      if (!allowedSourcePath(nodePath)) continue;
      const ext = path.extname(entry.name).slice(1).toLowerCase();
      const isBinary = BINARY_EXTENSIONS.has(ext);
      let size = 0;
      try { size = fs.statSync(fullPath).size; } catch { /* ignore */ }
      nodes.push({ name: entry.name, path: nodePath, type: "file", ext, size, binary: isBinary || undefined });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: NextRequest) {
  const denied = await protectSourceBrowser(req);
  if (denied) return denied;
  const tree = buildTree(process.cwd());
  return NextResponse.json(tree, { headers: { "Cache-Control": "no-store" } });
}
