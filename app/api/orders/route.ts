import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getCustomerUser, isAdminRequest } from "@/lib/request-auth";
import { products as catalogProducts } from "@/lib/products";
import { broadcastAdminPushNotification } from "@/lib/push-notifications";

// Use service role key server-side so RLS doesn't block order insertion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lecomax.com";
const EMAIL_LOGO_URL = `${SITE_URL}/images/email%20image/email%20image.png`;
const EMAIL_LOGO_CONTENT_ID = "lecomax-store-logo";

function generateOrderNumber(): string {
  return `ECO-${Math.floor(100000 + Math.random() * 900000)}`;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[<>\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : "";
}

// GET /api/orders — list all orders (admin), or GET /api/orders?order_number=ECO-XXXXXX (single order lookup)
export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  const user = admin ? null : await getCustomerUser(req);
  if (!admin && !user?.email) return NextResponse.json({ error: "Session expirée ou non autorisée." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const order_number = searchParams.get("order_number");
  const email = searchParams.get("email");
  const status = searchParams.get("status");
  const limit = searchParams.get("limit");

  // Single order lookup by order_number
  if (order_number) {
    if (!admin) return NextResponse.json({ error: "Utilisez le suivi de commande avec votre numéro et votre e-mail." }, { status: 403 });
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, tracking_number, total, created_at, customer, items")
      .eq("order_number", order_number)
      .single();
    if (error || !data) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    return NextResponse.json({ order: data });
  }

  // List orders filtered by customer email (for client dashboard)
  let query = supabase.from("orders").select("id, order_number, status, total, created_at, customer, items").order("created_at", { ascending: false });
  const safeEmail = admin ? email : user!.email!;
  if (safeEmail) query = query.eq("customer->>email", safeEmail.toLowerCase());
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

  const { customer, items, total, shipping, payment_method, coupon_id, discount, notes } = body as {
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
    coupon_id?: string | null;
    discount?: number;
    notes?: string;
  };

  // Validate and normalize all browser-provided order data.
  if (!customer?.name || !customer?.phone || !customer?.city || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Champs manquants (customer, items)." }, { status: 400 });
  }
  if (!Number.isFinite(total) || total <= 0 || total > 1_000_000) {
    return NextResponse.json({ error: "Total invalide." }, { status: 400 });
  }
  if (items.length > 50 || items.some((item) =>
    !item || !cleanText(item.slug, 160) || !cleanText(item.name, 200) ||
    !Number.isFinite(item.price) || item.price <= 0 || item.price > 1_000_000 ||
    !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20
  )) {
    return NextResponse.json({ error: "Un ou plusieurs articles sont invalides." }, { status: 400 });
  }

  customer.name = cleanText(customer.name, 100);
  customer.phone = cleanText(customer.phone, 30);
  customer.email = cleanText(customer.email, 254).toLowerCase();
  customer.city = cleanText(customer.city, 100);
  customer.address = cleanText(customer.address, 300);
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  for (const item of items) {
    item.slug = cleanText(item.slug, 160);
    item.name = cleanText(item.name, 200);
    item.image = cleanText(item.image, 500);
    item.size = cleanText(item.size, 50) || undefined;
    item.color = cleanText(item.color, 50) || undefined;
  }

  // Re-read products server-side. Prices and stock sent by a browser are never authoritative.
  const slugs = [...new Set(items.map((item) => item.slug))];
  const { data: databaseProducts, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("slug", slugs);
  if (productsError) {
    console.error("Order product verification error:", productsError);
    return NextResponse.json({ error: "Impossible de vérifier les articles pour le moment." }, { status: 503 });
  }
  const productBySlug = new Map<string, Record<string, unknown>>();
  for (const product of catalogProducts) productBySlug.set(product.slug, product as unknown as Record<string, unknown>);
  for (const product of databaseProducts ?? []) productBySlug.set(String(product.slug), product as Record<string, unknown>);

  for (const item of items) {
    const product = productBySlug.get(item.slug);
    const authoritativePrice = Number(product?.price);
    if (!product || !Number.isFinite(authoritativePrice) || authoritativePrice <= 0) {
      return NextResponse.json({ error: `L'article « ${item.name} » n'est plus disponible.` }, { status: 409 });
    }
    const stock = Number(product.stock);
    if (Number.isFinite(stock) && stock >= 0 && item.qty > stock) {
      return NextResponse.json({ error: `Stock insuffisant pour « ${item.name} ».` }, { status: 409 });
    }
    item.price = authoritativePrice;
    item.name = cleanText(product.name, 200) || item.name;
    const serverImage = cleanText(product.image, 500) || (Array.isArray(product.images) ? cleanText(product.images[0], 500) : "");
    if (serverImage) item.image = serverImage;
  }

  const safeNotes = cleanText(notes, 1000) || null;
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const { data: featureRows } = await supabase
    .from("settings")
    .select("key,value")
    .in("key", ["enable_coupons", "enable_ecoclub"]);
  const featureSettings = Object.fromEntries((featureRows ?? []).map((row) => [row.key, String(row.value ?? "")]));

  let couponDiscount = 0;
  if (coupon_id) {
    if (featureSettings.enable_coupons === "false") {
      return NextResponse.json({ error: "Les codes promotionnels sont désactivés." }, { status: 409 });
    }
    const { data: coupon } = await supabase.from("coupons").select("*").eq("id", coupon_id).eq("active", true).single();
    const couponValid = coupon &&
      (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
      (coupon.min_order === null || calculatedSubtotal >= Number(coupon.min_order));
    if (!couponValid) return NextResponse.json({ error: "Le code promotionnel n'est plus valide." }, { status: 409 });
    couponDiscount = coupon.type === "percent"
      ? Math.round(calculatedSubtotal * Number(coupon.value) / 100)
      : Math.min(Number(coupon.value), calculatedSubtotal);
  }

  let loyaltyPercent = 0;
  const customerUser = await getCustomerUser(req);
  if (featureSettings.enable_ecoclub !== "false" && customerUser?.email?.toLowerCase() === customer.email) {
    const { data: pointRecord } = await supabase.from("user_points").select("points").eq("email", customer.email).single();
    const points = Number(pointRecord?.points ?? 0);
    loyaltyPercent = points >= 1000 ? 50 : points >= 500 ? 30 : 0;
  }
  const loyaltyDiscount = Math.round((calculatedSubtotal - couponDiscount) * loyaltyPercent / 100);
  const safeDiscount = couponDiscount + loyaltyDiscount;

  const [{ data: zones }, { data: settingRows }] = await Promise.all([
    supabase.from("shipping_zones").select("base_rate, rate, free_above, min_order").order("sort_order").limit(1),
    supabase.from("settings").select("key, value").in("key", ["shipping_cost", "free_shipping_threshold"]),
  ]);
  const settings = Object.fromEntries((settingRows ?? []).map((row) => [row.key, row.value]));
  const zone = zones?.[0];
  // Global Settings are authoritative. Shipping zones are retained only as a
  // fallback for stores that have not configured the global values yet.
  const shippingRate = Number(settings.shipping_cost ?? zone?.base_rate ?? zone?.rate ?? 35);
  const freeAbove = Number(settings.free_shipping_threshold ?? zone?.free_above ?? zone?.min_order ?? 500);
  const isLocalDelivery = customer.city.toLowerCase().replace(/[-\s]/g, "") === "sidibennour";
  const safeShipping = isLocalDelivery || calculatedSubtotal >= freeAbove ? 0 : shippingRate;

  if (Math.abs(Number(shipping ?? 0) - safeShipping) > 0.01 || Math.abs(Number(discount ?? 0) - safeDiscount) > 0.01) {
    return NextResponse.json({ error: "Les frais ou la remise ont changé. Actualisez la page puis réessayez." }, { status: 409 });
  }
  const expectedTotal = Math.max(0, calculatedSubtotal + safeShipping - safeDiscount);
  if (Math.abs(expectedTotal - total) > 0.01) {
    return NextResponse.json({ error: "Le total de la commande a changé. Actualisez la page puis réessayez." }, { status: 409 });
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
    notes: safeNotes,
    created_at: new Date().toISOString(),
  }).select("id, order_number").single();

  if (error) {
    console.error("Order insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await broadcastAdminPushNotification({
    eventKey: `order:${data.id}`,
    title: `Nouvelle commande · ${order_number}`,
    body: `${customer.name} · ${total.toFixed(0)} MAD · ${items.length} article${items.length > 1 ? "s" : ""}`,
    url: "/admin/orders/",
    tag: `admin-order-${data.id}`,
    requireInteraction: true,
  }).catch((pushError) => console.error("Admin order push failed:", pushError));

  // Decrement stock for each ordered item (non-blocking, best-effort)
  for (const item of items) {
    if (item.slug) {
      supabase
        .from("products")
        .select("stock, color_stock, slug")
        .eq("slug", item.slug)
        .single()
        .then(({ data: prod }) => {
          if (prod && typeof prod.stock === "number") {
            const newStock = Math.max(0, prod.stock - item.qty);
            const updates: Record<string, unknown> = { stock: newStock };

            // Also decrement color-specific stock if applicable
            if (item.color && prod.color_stock && typeof prod.color_stock === "object") {
              const cs = prod.color_stock as Record<string, number>;
              if (typeof cs[item.color] === "number") {
                const newColorStock = { ...cs, [item.color]: Math.max(0, cs[item.color] - item.qty) };
                updates.color_stock = newColorStock;
              }
            }

            supabase.from("products").update(updates).eq("slug", item.slug).then(() => {});
          }
        });
    }
  }

  // Increment coupon used_count (non-blocking)
  if (coupon_id) {
    supabase.from("coupons").select("used_count").eq("id", coupon_id).single().then(({ data: c }) => {
      if (c) supabase.from("coupons").update({ used_count: c.used_count + 1 }).eq("id", coupon_id).then(() => {});
    });
  }

  // NOTE: EcoClub points (50 pts) are awarded when the order is marked as "delivered".
  // See /api/orders/[id]/route.ts PUT handler.

  if (resend && customer.email) {
    const invoiceNumber = `FAC-${order_number}`;
    const invoiceDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = parseFloat(Math.max(0, total - itemsTotal).toFixed(2));

    const itemRowsHtml = items.map((i, idx) => {
      const imgSrc = i.image?.startsWith("http") ? i.image : `https://lecomax.com${i.image}`;
      const lineTotal = (i.price * i.qty).toFixed(2);
      const rowBg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
      const pills = [i.size, i.color].filter(Boolean).map(p =>
        `<span style="display:inline-block;font-size:11px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px;margin-right:4px;">${p}</span>`
      ).join("");
      return `
      <tr style="background:${rowBg};">
        <td style="padding:14px 12px;color:#d1d5db;font-weight:700;font-size:11px;border-bottom:1px solid #f3f4f6;width:28px;">${String(idx + 1).padStart(2, "0")}</td>
        <td style="padding:14px 12px;border-bottom:1px solid #f3f4f6;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:44px;vertical-align:top;">
              <img src="${imgSrc}" alt="${i.name}" width="44" height="44" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid #f3f4f6;background:#f9fafb;display:block;" />
            </td>
            <td style="padding-left:12px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;line-height:1.3;">${i.name}</p>
              ${pills}
            </td>
          </tr></table>
        </td>
        <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${i.qty}</td>
        <td style="padding:14px 12px;text-align:right;font-size:12px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">${i.price.toFixed(2)} MAD</td>
        <td style="padding:14px 12px;text-align:right;font-weight:700;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${lineTotal} MAD</td>
      </tr>`;
    }).join("");

    resend.emails.send({
      from: "L'ecomax <noreply@lecomax.com>",
      replyTo: "contact@lecomax.com",
      to: customer.email,
      subject: `🧾 Votre facture ${invoiceNumber} — L'ecomax`,
      attachments: [
        {
          path: EMAIL_LOGO_URL,
          filename: "lecomax-store-logo.png",
          contentId: EMAIL_LOGO_CONTENT_ID,
        },
      ],
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Facture ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0ee;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0ee;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- TOP ACCENT BAR -->
  <tr><td style="height:4px;background:linear-gradient(90deg,#166534,#16a34a,#3ecf4c,#4ade80);border-radius:8px 8px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- STORE LOGO -->
  <tr><td style="background:#0c1a12;padding:24px 44px 0;text-align:center;">
    <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;">
      <img src="cid:${EMAIL_LOGO_CONTENT_ID}" alt="L'ecomax" width="88" height="88" style="display:block;width:88px;height:88px;border:0;border-radius:20px;object-fit:cover;" />
    </a>
  </td></tr>

  <!-- DARK HEADER -->
  <tr><td style="background:#0c1a12;padding:20px 44px 32px;border-radius:0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;">
        <!-- Logo text -->
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:28px;font-weight:900;color:#4ade80;letter-spacing:-1px;line-height:1;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:6px 0 0;font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:2px;text-transform:uppercase;">BOUTIQUE EN LIGNE · MAROC</p>
        <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.8;">contact@lecomax.com<br>lecomax.com<br>Maroc</p>
      </td>
      <td style="vertical-align:top;text-align:right;">
        <span style="display:inline-block;padding:4px 12px;border:1px solid rgba(74,222,128,0.3);border-radius:5px;font-size:9px;font-weight:700;color:#4ade80;letter-spacing:3px;background:rgba(74,222,128,0.08);">&#9679; FACTURE</span>
        <p style="margin:14px 0 0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;line-height:1;">${invoiceNumber}</p>
        <p style="margin:10px 0 0;font-size:11px;color:rgba(255,255,255,0.4);line-height:2;">
          Date : <span style="color:rgba(255,255,255,0.7);font-weight:500;">${invoiceDate}</span><br>
          Commande : <span style="color:rgba(255,255,255,0.7);font-weight:500;">#${order_number}</span>
        </p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="height:1px;background:linear-gradient(90deg,rgba(74,222,128,0.6),rgba(74,222,128,0.05));font-size:0;">&nbsp;</td></tr></table>
  </td></tr>

  <!-- PARTIES: DE / FACTURÉ À -->
  <tr><td style="background:#fff;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:24px 44px;width:50%;border-right:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;vertical-align:top;border-left:3px solid #3ecf4c;">
        <p style="margin:0 0 12px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">DE</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:16px;font-weight:900;color:#111827;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:16px;font-weight:900;color:#3ecf4c;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:10px 0 0;font-size:12px;color:#6b7280;line-height:1.9;">contact@lecomax.com<br>lecomax.com<br>Maroc</p>
      </td>
      <td style="padding:24px 44px;width:50%;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 12px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">FACTUR&#201; &#192;</p>
        <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#111827;text-transform:capitalize;">${customer.name}</p>
        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.9;">${customer.phone}<br>${customer.email}<br>${customer.address}<br>${customer.city}, Maroc</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- META: STATUT / PAIEMENT / LIVRAISON -->
  <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:18px 44px;width:33%;border-right:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">STATUT</p>
        <span style="display:inline-block;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">&#9679; En attente</span>
      </td>
      <td style="padding:18px 44px;width:33%;border-right:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">PAIEMENT</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#111827;">${payment_method || "Paiement à la livraison"}</p>
      </td>
      <td style="padding:18px 44px;width:33%;vertical-align:top;">
        <p style="margin:0 0 8px;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">LIVRAISON</p>
        <p style="margin:0;font-size:12px;font-weight:600;color:#111827;">Partout au Maroc</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- ARTICLES TABLE -->
  <tr><td style="background:#fff;padding:28px 44px 0;">
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
      <td style="font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2.5px;text-transform:uppercase;">ARTICLES COMMAND&#201;S</td>
      <td style="padding-left:8px;"><span style="display:inline-block;font-size:9px;font-weight:700;color:#fff;background:#3ecf4c;border-radius:99px;padding:1px 7px;">${items.length}</span></td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:28px;">#</th>
          <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;">Produit</th>
          <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:30px;">Qt&#233;</th>
          <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:90px;">Prix unit.</th>
          <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;width:90px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRowsHtml}</tbody>
    </table>
  </td></tr>

  <!-- TOTALS -->
  <tr><td style="background:#fff;padding:20px 44px 28px;">
    <table cellpadding="0" cellspacing="0" style="margin-left:auto;width:280px;">
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Sous-total articles</td>
        <td style="padding:6px 0;font-size:12px;font-weight:500;color:#374151;text-align:right;border-bottom:1px dashed #f3f4f6;">${itemsTotal.toFixed(2)} MAD</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:12px;color:#9ca3af;border-bottom:1px dashed #f3f4f6;">Frais de livraison</td>
        <td style="padding:6px 0;font-size:12px;font-weight:500;color:${deliveryFee === 0 ? "#16a34a" : "#374151"};text-align:right;border-bottom:1px dashed #f3f4f6;">${deliveryFee === 0 ? "Gratuit" : deliveryFee.toFixed(2) + " MAD"}</td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1a12;border-radius:10px;border:1px solid rgba(74,222,128,0.15);">
          <tr>
            <td style="padding:16px 18px;vertical-align:middle;">
              <p style="margin:0;font-size:8px;color:rgba(255,255,255,0.35);letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">TOTAL &#192; PAYER</p>
              <p style="margin:3px 0 0;font-size:9px;color:rgba(255,255,255,0.35);">Toutes taxes comprises</p>
            </td>
            <td style="padding:16px 18px;text-align:right;vertical-align:middle;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#4ade80;letter-spacing:-0.5px;line-height:1;">${total.toFixed(2)} MAD</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:22px 44px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:14px;font-weight:900;color:#111827;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">L&apos;eco</td>
          <td style="font-size:14px;font-weight:900;color:#3ecf4c;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">max</td>
        </tr></table>
        <p style="margin:3px 0 0;font-size:10px;color:#9ca3af;">contact@lecomax.com · lecomax.com</p>
      </td>
      <td style="text-align:center;vertical-align:middle;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;">Merci pour votre confiance !</p>
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <p style="margin:0;font-size:10px;color:#9ca3af;">&#201;mise le ${invoiceDate}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#9ca3af;">R&#233;f : ${invoiceNumber}</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e5e7eb;padding-top:14px;"><tr>
      <td style="font-size:10px;color:#9ca3af;">&#10003; Retours accept&#233;s sous 30 jours</td>
      <td style="font-size:10px;color:#9ca3af;text-align:center;">&#10003; Livraison ${shippingRate.toFixed(0)} MAD partout au Maroc</td>
      <td style="font-size:10px;color:#9ca3af;text-align:right;">&#10003; Paiement s&#233;curis&#233;</td>
    </tr></table>
  </td></tr>

  <!-- BOTTOM BAR -->
  <tr><td style="background:#0c1a12;padding:12px 44px;border-radius:0 0 8px 8px;text-align:center;">
    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.3);">Document g&#233;n&#233;r&#233; automatiquement · L&apos;ecomax &copy; ${new Date().getFullYear()} · Maroc</p>
  </td></tr>

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
      replyTo: "contact@lecomax.com",
      to: process.env.ADMIN_EMAIL || "contact@lecomax.com",
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
