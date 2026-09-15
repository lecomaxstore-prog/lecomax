import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/categories
export async function GET() {
  const [{ data, error }, { data: mediaRows }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("settings").select("key,value").like("key", "category_media:%"),
  ]);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  const media = new Map((mediaRows ?? []).map((row) => {
    try { return [row.key.slice("category_media:".length), JSON.parse(row.value)]; }
    catch { return [row.key.slice("category_media:".length), {}]; }
  }));
  const enriched = (data ?? []).map((category) => ({ ...category, label: category.name, ...(media.get(category.slug) ?? {}) }));
  return NextResponse.json(enriched, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

function cleanCategory(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const slug = String(value.slug ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  const label = String(value.label ?? "").trim();
  if (!/^[a-z0-9-]{2,80}$/.test(slug) || label.length < 2 || label.length > 100) return null;
  const cleanUrl = (input: unknown) => {
    const url = String(input ?? "").trim();
    return !url ? null : (url.startsWith("/") || /^https?:\/\//i.test(url) ? url.slice(0, 1000) : null);
  };
  const cleanPosition = (input: unknown) => /^\d{1,3}% \d{1,3}%$/.test(String(input ?? "")) ? String(input) : "50% 50%";
  return {
    slug,
    label,
    image: cleanUrl(value.image),
    image_mobile: cleanUrl(value.image_mobile),
    image_position: cleanPosition(value.image_position),
    image_mobile_position: cleanPosition(value.image_mobile_position),
    description: String(value.description ?? "").trim().slice(0, 500) || null,
    active: value.active !== false,
    sort_order: Math.max(0, Math.min(9999, Math.trunc(Number(value.sort_order) || 0))),
  };
}

// POST /api/categories
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const payload = cleanCategory(body);
  if (!payload) return NextResponse.json({ error: "Nom, slug ou données de catégorie invalides." }, { status: 400 });
  const { image_mobile, image_position, image_mobile_position, label, ...legacyValues } = payload;
  const legacyPayload = { ...legacyValues, name: label };
  const { data, error } = await supabase.from("categories").insert(legacyPayload).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Ce slug existe déjà." : error.message }, { status: error.code === "23505" ? 409 : 500 });
  const mediaValue = JSON.stringify({ image_mobile, image_position, image_mobile_position });
  const { error: mediaError } = await supabase.from("settings").upsert({ key: `category_media:${payload.slug}`, value: mediaValue, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (mediaError) {
    await supabase.from("categories").delete().eq("id", data.id);
    return NextResponse.json({ error: `Impossible d'enregistrer les visuels responsifs : ${mediaError.message}` }, { status: 500 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ...data, image_mobile, image_position, image_mobile_position }, { status: 201 });
}
