import { readJsonLimited } from "@/lib/request-body";
import { NextRequest, NextResponse } from "next/server";
import { presentSupportThread } from '@/lib/support-files-server';
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { supportDatabase, supportFailure } from "@/lib/support-server";
import { validSupportId, validSupportStatus } from "@/lib/support-validation";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await protectAdminRead(req, { key: "admin-support-read" });
  if (denied) return denied;
  const { id } = await context.params;
  if (!validSupportId(id)) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  const { data, error } = await supportDatabase().rpc("support_read_conversation", {
    p_conversation_id: id, p_reader: "support", p_user_id: null,
  });
  if (error) return supportFailure(error, "Conversation indisponible.");
  return NextResponse.json(await presentSupportThread(data), { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await protectAdminMutation(req, { key: "admin-support-status" });
  if (denied) return denied;
  const { id } = await context.params;
  const input = await readJsonLimited(req).catch(() => null) as { status?: unknown } | null;
  if (!validSupportStatus(input?.status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  const { data, error } = await supportDatabase().from("support_conversations").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
  return error || !data ? NextResponse.json({ error: "Conversation introuvable." }, { status: 404 }) : NextResponse.json({ conversation: data });
}
