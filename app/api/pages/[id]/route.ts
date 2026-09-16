import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { validatePageInput } from "@/lib/site-pages";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from("pages").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = validatePageInput(body, true);
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data: current } = await supabase.from("pages").select("slug").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
  if (parsed.value.slug) {
    const [{ data: duplicate }, { data: category }] = await Promise.all([
      supabase.from("pages").select("id").eq("slug", parsed.value.slug).neq("id", id).maybeSingle(),
      supabase.from("categories").select("id").eq("slug", parsed.value.slug).maybeSingle(),
    ]);
    if (duplicate) return NextResponse.json({ error: "Cette adresse est déjà utilisée par une autre page." }, { status: 409 });
    if (category) return NextResponse.json({ error: "Cette adresse est déjà utilisée par une catégorie." }, { status: 409 });
  }
  const payload = { ...parsed.value, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("pages").update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Cette adresse est déjà utilisée." : error.message }, { status: error.code === "23505" ? 409 : 500 });
  revalidatePath(`/${current.slug}`, "page");
  revalidatePath(`/${data.slug}`, "page");
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { data: current } = await supabase.from("pages").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  if (current?.slug) revalidatePath(`/${current.slug}`, "page");
  return NextResponse.json({ ok: true });
}
