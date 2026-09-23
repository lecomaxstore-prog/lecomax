import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { getSourceLibrary } from "@/lib/source-library";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type FileNode = { name: string; path: string; type: "file" | "dir"; ext?: string; size?: number; children?: FileNode[] };
export async function GET(req: NextRequest) {
  const denied = await protectSourceBrowser(req);
  if (denied) return denied;
  try {
    const tree: FileNode[] = [];
    for (const file of (await getSourceLibrary()).files) {
      let nodes = tree;
      const parts = file.path.split("/");
      parts.forEach((name, index) => {
        const nodePath = parts.slice(0, index + 1).join("/");
        if (index === parts.length - 1) nodes.push({ name, path: nodePath, type: "file", ext: name.split(".").at(-1), size: file.size });
        else {
          let folder = nodes.find(node => node.path === nodePath);
          if (!folder) { folder = { name, path: nodePath, type: "dir", children: [] }; nodes.push(folder); }
          nodes = folder.children!;
        }
      });
    }
    return NextResponse.json(tree, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Source library unavailable" }, { status: 503 }); }
}
