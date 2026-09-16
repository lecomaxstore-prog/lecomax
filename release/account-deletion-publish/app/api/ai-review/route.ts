import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Seuls les clients peuvent publier un avis depuis leur commande." }, { status: 410 });
}
