import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { latestAndroidRelease } from "@/lib/app-release-server";
import { publicRelease } from "@/lib/app-releases";

export const dynamic = "force-dynamic";

function origin(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, "app-releases:latest", 120, 60_000);
  if (limited) return limited;
  try {
    const release = await latestAndroidRelease();
    if (!release) return NextResponse.json({ error: "Aucune version Android publiée." }, { status: 404 });
    return NextResponse.json(publicRelease(release, origin(req)), {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: "Les informations de version sont indisponibles." }, { status: 503 });
  }
}
