import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser } from "@/lib/request-auth";
import { enforceRateLimit } from "@/lib/api-security";
import { resolveReviewPurchase, type ReviewProof } from "@/lib/review-purchase";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
async function check(req: NextRequest, slug: string, proof: ReviewProof = {}) {
  const limited = enforceRateLimit(req, "review-check", 20, 15 * 60_000);
  if (limited) return limited;
  if (!slug || slug.length > 160)
    return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  try {
    const result = await resolveReviewPurchase(
      supabase,
      slug,
      await getCustomerUser(req),
      proof,
    );
    return NextResponse.json(
      { canReview: Boolean(result.order), reason: result.reason },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Vérification indisponible. Réessayez." },
      { status: 503 },
    );
  }
}
export async function GET(req: NextRequest) {
  return check(req, req.nextUrl.searchParams.get("slug")?.trim() ?? "");
}
export async function POST(req: NextRequest) {
  try {
    const input = await readJsonLimited(req);
    if (!input || typeof input !== "object") throw new Error("invalid");
    return check(
      req,
      typeof input.product_slug === "string" ? input.product_slug.trim() : "",
      input,
    );
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
