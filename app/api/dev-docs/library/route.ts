import { NextRequest, NextResponse } from "next/server";
import { protectSourceBrowser } from "@/lib/dev-docs-access";
import { getSourceLibrary } from "@/lib/source-library";
import { searchLibrary } from "@/scripts/source-library.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const denied = await protectSourceBrowser(req);
  if (denied) return denied;
  const params = req.nextUrl.searchParams;
  const offset = Math.max(0, Math.min(100000, Number(params.get("offset")) || 0));
  const scope = params.get("scope") || "all";
  if (!["all", "app", "components", "lib", "scripts", "docs", "supabase", "mobile", "tests"].includes(scope)) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  try {
    return NextResponse.json(searchLibrary(await getSourceLibrary(), params.get("q") || "", scope, Math.floor(offset)), { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Source library unavailable. Rebuild this deployment." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
