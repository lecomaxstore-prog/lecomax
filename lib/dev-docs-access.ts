import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "./admin-access";
import { verifySessionToken } from "./admin-session";

export async function protectSourceBrowser(req: NextRequest) {
  const access = await getAdminAccess(req);
  if (!access?.owner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const token = req.cookies.get("how_built_access")?.value;
  if (!token || (await verifySessionToken(token, 8 * 60 * 60 * 1000)) !== "how-built-pin@lecomax.local") {
    return NextResponse.json({ error: "Unlock required" }, { status: 403 });
  }
  return null;
}

const ROOTS = new Set(["app", "components", "lib", "scripts", "docs", "public", "supabase"]);
const EXTENSIONS = /\.(?:tsx?|jsx?|mjs|cjs|css|json|md|sql|txt|svg)$/i;
export function allowedSourcePath(value: string) {
  const parts = value.replace(/\\/g, "/").split("/");
  if (!value || parts.some(part => !part || part.startsWith(".") || /[:\u0000-\u001f]/.test(part))) return false;
  if (parts.length > 1 && !ROOTS.has(parts[0])) return false;
  return EXTENSIONS.test(value) && !/(?:credential|secret|private.?key|service.?account|backup)/i.test(parts.at(-1)!);
}
