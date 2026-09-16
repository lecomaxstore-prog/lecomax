import { publicDatabaseError } from "@/lib/public-error";
import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminRequest } from "@/lib/request-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await readJsonLimited(req); } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
  }
  const update: { status?: string; notes?: string | null } = {};
  if ("status" in body) {
    if (typeof body.status !== "string" || !["pending", "approved", "rejected", "completed"].includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }
    update.status = body.status;
  }
  if ("notes" in body) update.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });
  const { data, error } = await supabase
    .from("returns")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("returns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: publicDatabaseError(error) }, { status: 400 });
  return NextResponse.json({ ok: true });
}
