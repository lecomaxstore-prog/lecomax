import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@.][^\s@]*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/;

type CartItemInput = {
  name?: unknown;
  quantity?: unknown;
  price?: unknown;
  size?: unknown;
  color?: unknown;
  slug?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeEmail(value: unknown) {
  const email = cleanText(value, 254).toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  let phone = value.trim().replace(/[\s().-]/g, "");
  if (phone.startsWith("00212")) phone = `0${phone.slice(5)}`;
  else if (phone.startsWith("+212")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("212")) phone = `0${phone.slice(3)}`;
  return /^0[67]\d{8}$/.test(phone) ? phone : null;
}

function sanitizeItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as CartItemInput;
    const name = cleanText(item.name, 180);
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)));
    const price = Number(item.price);
    if (!name || !Number.isFinite(price) || price < 0 || price > 1_000_000) return [];
    return [{
      name,
      quantity,
      price: Math.round(price * 100) / 100,
      size: cleanText(item.size, 60) || undefined,
      color: cleanText(item.color, 60) || undefined,
      slug: cleanText(item.slug, 180) || undefined,
    }];
  });
}

function databaseError(operation: string, error: { message: string; code?: string } | null) {
  console.error(`[abandoned-carts] ${operation} failed`, error);
  return NextResponse.json(
    { error: "Le service des paniers abandonnés est momentanément indisponible.", code: "CART_STORAGE_ERROR" },
    { status: 503 },
  );
}

function needsLegacySchemaFallback(error: { message: string; code?: string } | null) {
  if (!error) return false;
  return (error.code === "42703" || error.code === "PGRST204") &&
    /cart_token|reminded_at/i.test(error.message);
}

// GET /api/abandoned-carts — admin-only list.
export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const requestedLimit = Number.parseInt(req.nextUrl.searchParams.get("limit") || "200", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(500, Math.max(1, requestedLimit)) : 200;
  const { data, error } = await supabase
    .from("abandoned_carts")
    // Keep the admin list compatible with the original table. The token and
    // reminder timestamp are implementation details and are not rendered.
    .select("id,phone,name,email,items,total,reminded,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return databaseError("list", error);
  return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store, max-age=0" } });
}

// POST /api/abandoned-carts — validated storefront upsert by an unguessable cart token.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const cartToken = cleanText(body.cart_token, 36);
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const items = sanitizeItems(body.items);
  if (!UUID_PATTERN.test(cartToken)) return NextResponse.json({ error: "Identifiant panier invalide." }, { status: 400 });
  if (!phone && !email) return NextResponse.json({ error: "Un téléphone ou un e-mail valide est requis." }, { status: 422 });
  if (!items.length) return NextResponse.json({ error: "Le panier ne contient aucun article valide." }, { status: 422 });

  const total = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const now = new Date().toISOString();
  const modernResult = await supabase
    .from("abandoned_carts")
    .upsert({
      cart_token: cartToken,
      phone,
      email,
      name: cleanText(body.name, 160) || null,
      items,
      total,
      reminded: false,
      reminded_at: null,
      updated_at: now,
    }, { onConflict: "cart_token" })
    .select("id,updated_at")
    .single();

  if (!modernResult.error) return NextResponse.json({ ok: true, cart: modernResult.data });
  if (!needsLegacySchemaFallback(modernResult.error)) return databaseError("upsert", modernResult.error);

  // Compatibility path for projects that still have the original table.
  // Match one cart by validated contact data until the idempotent migration
  // adds cart_token and reminded_at.
  let existingId: string | null = null;
  if (phone) {
    const existing = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("phone", phone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) return databaseError("legacy phone lookup", existing.error);
    existingId = existing.data?.id ?? null;
  }
  if (!existingId && email) {
    const existing = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("email", email)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) return databaseError("legacy email lookup", existing.error);
    existingId = existing.data?.id ?? null;
  }

  const legacyPayload = {
    phone,
    email,
    name: cleanText(body.name, 160) || null,
    items,
    total,
    reminded: false,
    updated_at: now,
  };
  const legacyResult = existingId
    ? await supabase.from("abandoned_carts").update(legacyPayload).eq("id", existingId).select("id,updated_at").single()
    : await supabase.from("abandoned_carts").insert(legacyPayload).select("id,updated_at").single();

  if (legacyResult.error) return databaseError("legacy upsert", legacyResult.error);
  return NextResponse.json({ ok: true, cart: legacyResult.data, compatibility_mode: true });
}

// DELETE by id is admin-only. DELETE by random token is checkout completion cleanup.
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (id) {
    if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
    const { error } = await supabase.from("abandoned_carts").delete().eq("id", id);
    if (error) return databaseError("admin delete", error);
    return NextResponse.json({ ok: true });
  }

  if (!token || !UUID_PATTERN.test(token)) return NextResponse.json({ error: "Identifiant panier requis." }, { status: 400 });
  const { error } = await supabase.from("abandoned_carts").delete().eq("cart_token", token);
  if (needsLegacySchemaFallback(error)) {
    // Successful orders remove legacy records by validated customer contact in
    // /api/orders; a token-only cleanup cannot identify an old-schema row.
    return NextResponse.json({ ok: true, compatibility_mode: true });
  }
  if (error) return databaseError("checkout cleanup", error);
  return NextResponse.json({ ok: true });
}
