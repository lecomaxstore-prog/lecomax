import { NextRequest, NextResponse } from "next/server";
import { protectAdminRead } from "@/lib/api-security";
import { releaseSupabase } from "@/lib/app-release-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "app-releases:list", limit: 90 });
  if (blocked) return blocked;
  const { data, error } = await releaseSupabase()
    .from("app_releases")
    .select("*")
    .eq("platform", "android")
    .order("version_code", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Impossible de charger les versions Android." }, { status: 500 });
  return NextResponse.json({ releases: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
