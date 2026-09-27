import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { getSourceLibrary } from "@/lib/source-library";
import { isLibraryPath } from "@/scripts/source-library.mjs";
import { inspectSourceConnections } from "@/lib/source-connections";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const denied = await protectSourceBrowser(req);
  if (denied) return denied;
  const requested = req.nextUrl.searchParams.get("path") || "";
  if (!isLibraryPath(requested)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const library = await getSourceLibrary();
    const file = library.files.find(item => item.path === requested);
    if (!file) return NextResponse.json({ error: "File unavailable in this source library" }, { status: 404 });
    const requestedLine = Number(req.nextUrl.searchParams.get("line"));
    const line = Number.isInteger(requestedLine) && requestedLine > 0 ? Math.min(requestedLine, file.lines) : 1;
    const connections = req.nextUrl.searchParams.get("connections") === "1" ? inspectSourceConnections(file, library.files, line) : undefined;
    return NextResponse.json({ ...file, generatedAt: library.generatedAt, connections }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Source library unavailable" }, { status: 503 });
  }
}
