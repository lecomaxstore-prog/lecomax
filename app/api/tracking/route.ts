import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

// Map DB status → tracking step index (0-based)
const STATUS_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

// GET /api/tracking?order=ECO-XXXXXX&email=xxx@xxx.com
export async function GET(req: NextRequest) {
  const order_number = req.nextUrl.searchParams.get("order")?.trim().toUpperCase();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!order_number || !email) {
    return NextResponse.json(
      { error: "Paramètres manquants : order et email sont requis." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, tracking_number, total, created_at, customer, items, shipping, payment_method")
    .eq("order_number", order_number)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Commande introuvable. Vérifiez le numéro et l'adresse e-mail." },
      { status: 404 }
    );
  }

  // Verify email matches (case-insensitive)
  const orderEmail = (data.customer?.email ?? "").toLowerCase().trim();
  if (orderEmail !== email) {
    return NextResponse.json(
      { error: "Commande introuvable. Vérifiez le numéro et l'adresse e-mail." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    order: {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      status_label: STATUS_LABELS[data.status] ?? data.status,
      step: STATUS_STEP[data.status] ?? 0,
      tracking_number: data.tracking_number ?? null,
      total: data.total,
      shipping: data.shipping ?? 0,
      payment_method: data.payment_method,
      created_at: data.created_at,
      customer: {
        name: data.customer?.name,
        city: data.customer?.city,
        address: data.customer?.address,
      },
      items: data.items ?? [],
    },
  });
}
