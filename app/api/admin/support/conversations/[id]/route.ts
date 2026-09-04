import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation, protectAdminRead } from "@/lib/api-security";
import { supportDatabase } from "@/lib/support-server";
import { validSupportStatus } from "@/lib/support-validation";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await protectAdminRead(req, { key: "admin-support-read" });
  if (denied) return denied;
  const { id } = await context.params;
  const db = supportDatabase();
  const { data: conversation } = await db.from("support_conversations").select("*").eq("id", id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  const { data: messages, error } = await db.from("support_messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Messages indisponibles." }, { status: 500 });
  const now = new Date().toISOString();
  await Promise.all([
    db.from("support_conversations").update({ admin_unread: 0, updated_at: now }).eq("id", id),
    db.from("support_messages").update({ read_at: now }).eq("conversation_id", id).eq("sender_type", "customer").is("read_at", null),
  ]);
  return NextResponse.json({ conversation: { ...conversation, admin_unread: 0 }, messages: messages ?? [] });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await protectAdminMutation(req, { key: "admin-support-status" });
  if (denied) return denied;
  const { id } = await context.params;
  const input = await req.json().catch(() => null) as { status?: unknown } | null;
  if (!validSupportStatus(input?.status)) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  const { data, error } = await supportDatabase().from("support_conversations").update({ status: input.status, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
  return error || !data ? NextResponse.json({ error: "Conversation introuvable." }, { status: 404 }) : NextResponse.json({ conversation: data });
}
