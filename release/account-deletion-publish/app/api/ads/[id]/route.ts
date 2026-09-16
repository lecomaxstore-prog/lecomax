import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";
import { protectAdminMutation } from "@/lib/api-security";
import { parseAdInput } from "@/lib/ad-validation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const { data, error } = await supabase.from("ads").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "ads:update", limit: 40 });
  if (blocked) return blocked;
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseAdInput(body, true);
  if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data, error } = await supabase.from("ads").update(parsed.value).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await protectAdminMutation(req, { key: "ads:delete", limit: 20 });
  if (blocked) return blocked;
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
