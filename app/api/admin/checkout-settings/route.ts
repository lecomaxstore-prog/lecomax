import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireSettingsPermission } from "@/lib/admin-settings-access";
import { validateStoreSettings, STORE_SETTING_KEYS } from "@/lib/store-settings";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { CHECKOUT_SETTING_KEYS, checkoutSettingsFromRows, normalizeCheckoutSettings } from "@/lib/checkout-settings";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(req: NextRequest) {
  const blocked = await protectAdminRead(req, { key: "checkout-settings:read", limit: 120 });
  if (blocked) return blocked;
  const { data, error } = await supabase.from("settings").select("key,value,updated_at").in("key", CHECKOUT_SETTING_KEYS);
  if (error) return NextResponse.json({ error: "Impossible de charger le checkout." }, { status: 500, headers: noStore });
  const updatedAt = (data ?? []).map((row) => row.updated_at).filter(Boolean).sort().at(-1) ?? null;
  return NextResponse.json({ settings: checkoutSettingsFromRows(data), updatedAt }, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  const denied = await requireSettingsPermission(req);
  if (denied) return denied;
  const blocked = await protectAdminMutation(req, { key: "checkout-settings:update", limit: 20 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const normalized = normalizeCheckoutSettings(body);
  if (!normalized.settings) return NextResponse.json({ error: normalized.error }, { status: 400, headers: noStore });
  const previous = await supabase.from("settings").select("key,value").in("key", STORE_SETTING_KEYS);
  if (previous.error) return NextResponse.json({ error: "Paramètres indisponibles." }, { status: 503 });
  const invalid = validateStoreSettings({ ...Object.fromEntries((previous.data ?? []).map(row => [row.key, row.value])), ...normalized.settings });
  if (invalid) return NextResponse.json({ error: invalid, code: "VALIDATION_ERROR" }, { status: 400 });
  const updatedAt = new Date().toISOString();
  const rows = Object.entries(normalized.settings).map(([key, value]) => ({ key, value, updated_at: updatedAt }));
  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "Impossible d'enregistrer le checkout." }, { status: 500, headers: noStore });
  revalidatePath("/checkout");
  revalidatePath("/", "layout");
  revalidateTag("store-settings");
  return NextResponse.json({ success: true, settings: normalized.settings, updatedAt }, { headers: noStore });
}
