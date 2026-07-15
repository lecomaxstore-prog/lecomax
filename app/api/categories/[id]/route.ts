import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanUpdate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  if ("slug" in value) {
    const slug = String(value.slug ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
    allowed.slug = slug;
  }
  if ("label" in value) {
    const label = String(value.label ?? "").trim();
    if (label.length < 2 || label.length > 100) return null;
    allowed.label = label;
  }
  for (const key of ["image", "image_mobile"] as const) if (key in value) {
    const url = String(value[key] ?? "").trim();
    if (url && !url.startsWith("/") && !/^https?:\/\//i.test(url)) return null;
    allowed[key] = url ? url.slice(0, 1000) : null;
  }
  for (const key of ["image_position", "image_mobile_position"] as const) if (key in value) {
    allowed[key] = /^\d{1,3}% \d{1,3}%$/.test(String(value[key])) ? String(value[key]) : "50% 50%";
  }
  if ("description" in value) allowed.description = String(value.description ?? "").trim().slice(0, 500) || null;
  if ("active" in value) allowed.active = value.active !== false;
  if ("sort_order" in value) allowed.sort_order = Math.max(0, Math.min(9999, Math.trunc(Number(value.sort_order) || 0)));
  return Object.keys(allowed).length ? allowed : null;
}

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const payload = cleanUpdate(body);
  if (!payload) return NextResponse.json({ error: "Données de catégorie invalides." }, { status: 400 });
  const { data: current } = await supabase.from("categories").select("slug").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Catégorie introuvable." }, { status: 404 });
  const { image_mobile, image_position, image_mobile_position, label, ...legacyValues } = payload;
  const legacyPayload = { ...legacyValues, ...(label !== undefined ? { name: label } : {}) };
  const { data, error } = Object.keys(legacyPayload).length
    ? await supabase.from("categories").update(legacyPayload).eq("id", id).select().single()
    : await supabase.from("categories").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const oldMediaKey = `category_media:${current.slug}`;
  const newSlug = String(data.slug);
  const newMediaKey = `category_media:${newSlug}`;
  if (image_mobile !== undefined || image_position !== undefined || image_mobile_position !== undefined || oldMediaKey !== newMediaKey) {
    const { data: existingMedia } = await supabase.from("settings").select("value").eq("key", oldMediaKey).maybeSingle();
    let previous: Record<string, unknown> = {};
    try { previous = existingMedia?.value ? JSON.parse(existingMedia.value) : {}; } catch { /* ignore */ }
    const media = {
      ...previous,
      ...(image_mobile !== undefined ? { image_mobile } : {}),
      ...(image_position !== undefined ? { image_position } : {}),
      ...(image_mobile_position !== undefined ? { image_mobile_position } : {}),
    };
    const { error: mediaError } = await supabase.from("settings").upsert({ key: newMediaKey, value: JSON.stringify(media), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 500 });
    if (oldMediaKey !== newMediaKey) await supabase.from("settings").delete().eq("key", oldMediaKey);
    Object.assign(data, media);
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ...data, label: data.name });
}

// DELETE /api/categories/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(_req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { data: category } = await supabase.from("categories").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (category?.slug) await supabase.from("settings").delete().eq("key", `category_media:${category.slug}`);
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
