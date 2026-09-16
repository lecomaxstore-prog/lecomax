import { readJsonLimited } from "@/lib/request-body";
﻿import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { calculateCart, CommerceError } from "@/lib/commerce-server";

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, "checkout:quote", 60, 60_000);
  if (blocked) return blocked;
  const body = await readJsonLimited(request).catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Panier invalide.", code: "INVALID_CHECKOUT" }, { status: 400 });
  try {
    const { quote } = await calculateCart(request, body);
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const known = error instanceof CommerceError;
    return NextResponse.json({ error: known ? error.message : "Calcul indisponible.", code: known ? error.code : "QUOTE_UNAVAILABLE", details: known ? error.details : undefined }, { status: known ? error.status : 503, headers: { "Cache-Control": "no-store" } });
  }
}
