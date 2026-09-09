import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ reviews: [] }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST() {
  return NextResponse.json({ error: "Les avis Trustpilot sont affiches directement depuis Trustpilot." }, { status: 410 });
}
