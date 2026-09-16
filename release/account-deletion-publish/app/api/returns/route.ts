import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  let query = supabase.from("returns").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
  }
  const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const payload = {
    order_number: clean(body.order_number, 80),
    customer_name: clean(body.customer_name, 160),
    customer_email: clean(body.customer_email, 254).toLowerCase() || null,
    product_name: clean(body.product_name, 240),
    reason: clean(body.reason, 1000),
    status: "pending",
  };
  if (!payload.order_number || !payload.customer_name || !payload.product_name || !payload.reason) {
    return NextResponse.json({ error: "Commande, client, produit et motif sont obligatoires." }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("returns")
    .insert(payload)
    .select()
    .single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
