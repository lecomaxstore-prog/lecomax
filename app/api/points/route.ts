import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCustomerUser, isAdminRequest } from "@/lib/request-auth";
import { loyaltyTierForPoints } from "@/lib/loyalty";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/points?email=xxx
export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  const user = admin ? null : await getCustomerUser(req);
  if (!admin && !user?.email) return NextResponse.json({ error: "Session expirée ou non autorisée." }, { status: 401 });
  const requestedEmail = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
  const email = admin ? requestedEmail : user!.email!.toLowerCase();
  if (!admin && requestedEmail && requestedEmail !== email) return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const [balanceResult, pendingResult] = await Promise.all([
    supabase.from("user_points").select("points").eq("email", email).maybeSingle(),
    supabase.from("loyalty_transactions").select("points").eq("email", email).eq("status", "pending"),
  ]);

  if (balanceResult.error) {
    return NextResponse.json({ error: balanceResult.error.message }, { status: 500 });
  }

  const points = Number(balanceResult.data?.points ?? 0);
  const pending = (pendingResult.data ?? []).reduce((sum, transaction) => sum + Number(transaction.points || 0), 0);
  const tier = loyaltyTierForPoints(points);

  return NextResponse.json(
    {
      points,
      pending,
      tier: tier.name,
      tierMin: tier.min,
      next: tier.next,
      nextLabel: tier.nextLabel,
      progress: tier.progress,
      remaining: tier.remaining,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

// POST /api/points — administrator adjustment with idempotency support.
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  let body: { email?: string; amount?: number; request_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, amount = 50 } = body;
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1000000) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  const requestId = typeof body.request_id === "string" && /^[a-zA-Z0-9_-]{8,120}$/.test(body.request_id)
    ? body.request_id
    : crypto.randomUUID();
  const { data, error } = await supabase.rpc("add_loyalty_points", {
    p_email: email.trim().toLowerCase(),
    p_amount: amount,
    p_reference: `admin:${requestId}`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = data as { balance?: number; awarded?: number } | null;
  const tier = loyaltyTierForPoints(Number(result?.balance ?? 0));
  return NextResponse.json({
    points: Number(result?.balance ?? 0),
    awarded: Number(result?.awarded ?? 0),
    tier: tier.name,
    next: tier.next,
    nextLabel: tier.nextLabel,
  });
}
