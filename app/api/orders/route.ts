import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Use service role key server-side so RLS doesn't block order insertion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateOrderNumber(): string {
  return `ECO-${Math.floor(100000 + Math.random() * 900000)}`;
}

// GET /api/orders — list all orders (admin), or GET /api/orders?order_number=ECO-XXXXXX (single order lookup)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const order_number = searchParams.get("order_number");
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");

  // Single order lookup by order_number
  if (order_number) {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, tracking_number, total, created_at, customer, items")
      .eq("order_number", order_number)
      .single();
    if (error || !data) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    return NextResponse.json({ order: data });
  }

  // List all orders
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer, items, total, shipping, payment_method, notes } = body as {
    customer: {
      name: string;
      phone: string;
      email: string;
      city: string;
      address: string;
    };
    items: {
      slug: string;
      name: string;
      price: number;
      qty: number;
      image: string;
      size?: string;
      color?: string;
    }[];
    total: number;
    shipping?: number;
    payment_method: string;
    notes?: string;
  };

  // Basic validation
  if (!customer?.name || !customer?.phone || !customer?.city || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Champs manquants (customer, items)." }, { status: 400 });
  }
  if (typeof total !== "number" || total <= 0) {
    return NextResponse.json({ error: "Total invalide." }, { status: 400 });
  }

  const order_number = generateOrderNumber();
  const isPayPal = typeof payment_method === "string" && payment_method.toLowerCase().startsWith("paypal");

  const { data, error } = await supabase.from("orders").insert({
    order_number,
    customer,
    items,
    total,
    payment_method: payment_method || "Paiement à la livraison",
    status: isPayPal ? "confirmed" : "pending",
    tracking_number: null,
    notes: notes ?? null,
    created_at: new Date().toISOString(),
  }).select("id, order_number").single();

  if (error) {
    console.error("Order insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send confirmation email (non-blocking)
  if (resend && customer.email) {
    const itemsHtml = items
      .map((i) => `<li style="padding:4px 0;color:#374151;">• ${i.name}${i.color ? ` — ${i.color}` : ""}${i.size ? ` (${i.size})` : ""} × ${i.qty} = ${(i.price * i.qty).toFixed(2)} MAD</li>`)
      .join("");

    resend.emails.send({
      from: "LECOMAX <noreply@lecomax.com>",
      to: customer.email,
      subject: `Commande confirmée ${order_number} — L'ecomax`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111;padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:0.1em;">L'ECOMAX</p>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.2em;text-transform:uppercase;">Sport · Style · Performance</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ecfdf5;border-bottom:1px solid #d1fae5;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:26px;">✓</p>
            <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#065f46;">Commande confirmée !</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 14px;font-size:15px;color:#111;">Bonjour <strong>${customer.name}</strong>,</p>
            <p style="margin:0 0 22px;font-size:14px;color:#6b7280;line-height:1.6;">
              Merci pour votre commande ! Nous la préparons avec soin et vous enverrons un suivi dès l'expédition.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:22px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">N° de commande</p>
                  <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#111;letter-spacing:0.05em;">${order_number}</p>
                </td>
                <td style="padding:16px 20px;text-align:right;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Total</p>
                  <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#111;">${total.toFixed(2)} MAD</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Articles</p>
            <ul style="margin:0 0 22px;padding:12px 16px;list-style:none;border:1px solid #e5e7eb;border-radius:10px;">${itemsHtml}</ul>
            <p style="margin:0;font-size:13px;color:#6b7280;">
              Livraison à : <strong>${customer.address}, ${customer.city}</strong><br/>
              Paiement : <strong>${payment_method}</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Des questions ? <a href="mailto:lecomaxstore@gmail.com" style="color:#3ecf4c;text-decoration:none;">lecomaxstore@gmail.com</a></p>
            <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">© ${new Date().getFullYear()} L'ecomax — Maroc</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch((err) => console.error("Email send error:", err));
  }

  // Notify admin of the new order
  if (resend) {
    const adminItemsHtml = items
      .map((i) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;">${i.name}${i.color ? ` — ${i.color}` : ""}${i.size ? ` (${i.size})` : ""}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#6b7280;">×${i.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;font-weight:700;color:#111;">${(i.price * i.qty).toFixed(0)} MAD</td></tr>`)
      .join("");

    resend.emails.send({
      from: "LECOMAX <noreply@lecomax.com>",
      to: "lecomaxstore@gmail.com",
      subject: `🛒 Nouvelle commande ${order_number} — ${total.toFixed(0)} MAD`,
      html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111;padding:20px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.2em;text-transform:uppercase;">LECOMAX — Admin</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#fff;">🛒 Nouvelle commande reçue</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">N° commande</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;">${order_number}</p>
                </td>
                <td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;text-align:right;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Total</p>
                  <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#111;">${total.toFixed(0)} MAD</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 18px;">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Client</p>
                  <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111;">${customer.name}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${customer.phone}${customer.email ? ` · ${customer.email}` : ""}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${customer.address}, ${customer.city}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Paiement : ${payment_method}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Articles</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;overflow:hidden;">${adminItemsHtml}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #f3f4f6;">
            <a href="https://lecomax.com/admin/orders" style="display:inline-block;background:#111;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;letter-spacing:0.05em;">Voir dans l'admin →</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch((err) => console.error("Admin notification error:", err));
  }

  return NextResponse.json({ order_number: data.order_number, id: data.id }, { status: 201 });
}
