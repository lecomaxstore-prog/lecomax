import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BLOCKED_PATTERNS = [
  /^\.env/i,
  /[/\\]\.env/i,
  /\.key$/i,
  /\.pem$/i,
  /\.p12$/i,
  /node_modules/,
  /^\.git[/\\]/,
  /[/\\]\.git[/\\]/,
  /^\.next[/\\]/,
  /^\.vercel[/\\]/,
];

const BINARY_EXTENSIONS = new Set([
  "avif", "webp", "png", "jpg", "jpeg", "gif", "bmp", "ico",
  "woff", "woff2", "ttf", "eot", "otf",
  "mp4", "mp3", "wav", "webm",
  "zip", "tar", "gz",
]);

const MAX_SIZE = 300 * 1024; // 300 KB

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (session !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filePath = (searchParams.get("path") ?? "").replace(/\\/g, "/").replace(/^\//, "");

  // Block path traversal
  if (filePath.includes("..") || filePath.includes("//")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Block sensitive patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(filePath)) {
      return NextResponse.json({ content: "// ⛔ Ce fichier ne peut pas être affiché pour des raisons de sécurité." });
    }
  }

  const root = process.cwd();
  const fullPath = path.resolve(root, ...filePath.split("/"));

  // Prevent escaping project root
  if (!fullPath.startsWith(root)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const ext = path.extname(fullPath).slice(1).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return NextResponse.json({ content: `// 🖼️ Fichier binaire (${ext.toUpperCase()}) — aperçu non disponible.` });
  }

  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return NextResponse.json({ error: "Not a file" }, { status: 400 });
    if (stat.size > MAX_SIZE) {
      return NextResponse.json({
        content: `// ⚠️ Fichier trop volumineux (${Math.round(stat.size / 1024)} KB > 300 KB)\n// Ouvrez-le directement dans VS Code.`,
        size: stat.size,
      });
    }
    const content = fs.readFileSync(fullPath, "utf-8");
    return NextResponse.json({ content, size: stat.size }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
