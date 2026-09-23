import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { getSourceLibrary } from "@/lib/source-library";
import { isLibraryPath } from "@/scripts/source-library.mjs";
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
    return NextResponse.json({ ...file, generatedAt: library.generatedAt }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Source library unavailable" }, { status: 503 });
  }
}
