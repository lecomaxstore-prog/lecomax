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

export async function GET(req: NextRequest) {
  const admin = await isAdminRequest(req);
  let query = supabase
    .from("pages")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (!admin) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = validatePageInput(body);
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data: duplicate } = await supabase.from("pages").select("id").eq("slug", parsed.value.slug!).maybeSingle();
  if (duplicate) return NextResponse.json({ error: "Cette adresse est déjà utilisée par une autre page." }, { status: 409 });
  const { data: category } = await supabase.from("categories").select("id").eq("slug", parsed.value.slug!).maybeSingle();
  if (category) return NextResponse.json({ error: "Cette adresse est déjà utilisée par une catégorie." }, { status: 409 });
  const payload = { ...parsed.value, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("pages").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Cette adresse est déjà utilisée." : error.message }, { status: error.code === "23505" ? 409 : 500 });
  revalidatePath(`/${data.slug}`, "page");
  return NextResponse.json(data, { status: 201 });
}
