import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

// Map DB status → tracking step index (0-based)
const STATUS_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  preparing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

function cleanDisplayText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ").trim();
}

// GET /api/tracking?order=ECO-XXXXXX&email=xxx@xxx.com
export async function GET(req: NextRequest) {
  const rawOrderNumber = req.nextUrl.searchParams.get("order") ?? "";
  const compactOrderNumber = rawOrderNumber.normalize("NFKC").trim().toUpperCase().replace(/^#/, "").replace(/\s+/g, "");
  const order_number = /^\d{6}$/.test(compactOrderNumber)
    ? `ECO-${compactOrderNumber}`
    : compactOrderNumber.replace(/^ECO(?=\d{6}$)/, "ECO-");
  const email = (req.nextUrl.searchParams.get("email") ?? "").normalize("NFKC").trim().toLowerCase();

  if (!order_number || !email) {
    return NextResponse.json(
      { error: "Paramètres manquants : order et email sont requis." },
      { status: 400 }
    );
  }
  if (!/^ECO-\d{6}$/.test(order_number) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Format invalide. Utilisez un numéro ECO-XXXXXX et l'adresse e-mail de la commande." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, tracking_number, total, created_at, customer, items, payment_method")
    .eq("order_number", order_number)
    .maybeSingle();

  if (error) {
    console.error("Tracking lookup failed:", { code: error.code, message: error.message });
    return NextResponse.json(
      { error: "Le service de suivi est momentanément indisponible. Veuillez réessayer dans quelques instants." },
      { status: 503 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Commande introuvable. Vérifiez le numéro et l'adresse e-mail." },
      { status: 404 }
    );
  }

  // Verify email matches (case-insensitive)
  const orderEmail = String(data.customer?.email ?? "").normalize("NFKC").toLowerCase().trim();
  if (orderEmail !== email) {
    return NextResponse.json(
      { error: "Commande introuvable. Vérifiez le numéro et l'adresse e-mail." },
      { status: 404 }
    );
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const itemSubtotal = items.reduce((sum: number, item: { price?: unknown; qty?: unknown; quantity?: unknown }) => {
    const price = Number(item?.price);
    const quantity = Number(item?.qty ?? item?.quantity ?? 1);
    return sum + (Number.isFinite(price) && Number.isFinite(quantity) ? price * quantity : 0);
  }, 0);
  const orderTotal = Number(data.total) || 0;
  // Orders store a final total but no separate shipping column. Derive the
  // delivery charge without making the tracking query depend on a missing field.
  const shipping = Math.max(0, Math.round((orderTotal - itemSubtotal) * 100) / 100);

  return NextResponse.json({
    order: {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      status_label: STATUS_LABELS[data.status] ?? data.status,
      step: STATUS_STEP[data.status] ?? 0,
      tracking_number: data.tracking_number ?? null,
      total: orderTotal,
      shipping,
      payment_method: data.payment_method,
      created_at: data.created_at,
      customer: {
        name: cleanDisplayText(data.customer?.name),
        city: cleanDisplayText(data.customer?.city),
        address: cleanDisplayText(data.customer?.address),
      },
      items,
    },
  });
}
