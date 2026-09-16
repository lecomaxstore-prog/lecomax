import { NextRequest, NextResponse } from "next/server";
import { protectAdminRead } from "@/lib/api-security";
import { isMobileAudience, isMobileNotificationCategory } from "@/lib/mobile-campaign-policy";
import { resolveMobileAudience } from "@/lib/mobile-campaigns";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "mobile-audience:read" });
  if (blocked) return blocked;
  const audience = req.nextUrl.searchParams.get("audience") ?? "all";
  const category = req.nextUrl.searchParams.get("category") ?? "general";
  if (!isMobileAudience(audience) || !isMobileNotificationCategory(category)) {
    return NextResponse.json({ error: "Ciblage invalide." }, { status: 400 });
  }
  const userIds = [...new Set((req.nextUrl.searchParams.get("userIds") ?? "").split(",").filter((id) => UUID.test(id)))].slice(0, 5000);
  try {
    const result = await resolveMobileAudience(audience, userIds, category);
    return NextResponse.json({ count: result.count, android: result.android, ios: result.ios });
  } catch {
    return NextResponse.json({ error: "Aperçu de l’audience indisponible." }, { status: 500 });
  }
}
