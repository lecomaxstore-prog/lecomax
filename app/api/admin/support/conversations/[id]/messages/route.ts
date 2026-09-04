import { NextRequest, NextResponse } from "next/server";
import { protectAdminMutation } from "@/lib/api-security";
import { supportDatabase } from "@/lib/support-server";
import { parseSupportMessage } from "@/lib/support-validation";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await protectAdminMutation(req, { key: "admin-support-reply", limit: 30 });
  if (denied) return denied;
  const { id } = await context.params;
  const input = await req.json().catch(() => null) as { body?: unknown; client_message_id?: unknown } | null;
  const parsed = parseSupportMessage(input?.body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const clientMessageId = typeof input?.client_message_id === "string" && /^[0-9a-f-]{36}$/i.test(input.client_message_id) ? input.client_message_id : null;
  const db = supportDatabase();
  const { data: conversation } = await db.from("support_conversations").select("id,customer_unread").eq("id", id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  if (clientMessageId) {
    const { data: existing } = await db.from("support_messages").select("*").eq("conversation_id", id).eq("client_message_id", clientMessageId).maybeSingle();
    if (existing) return NextResponse.json({ message: existing });
  }
  const now = new Date().toISOString();
  const { data: message, error } = await db.from("support_messages").insert({
    conversation_id: id, sender_type: "support", body: parsed.body, client_message_id: clientMessageId,
  }).select("*").single();
  if (error || !message) return NextResponse.json({ error: "Réponse non envoyée." }, { status: 500 });
  await db.from("support_conversations").update({
    status: "waiting", last_message: parsed.body, last_message_at: now, updated_at: now,
    customer_unread: Number(conversation.customer_unread ?? 0) + 1, admin_unread: 0,
  }).eq("id", id);
  return NextResponse.json({ message }, { status: 201 });
}
