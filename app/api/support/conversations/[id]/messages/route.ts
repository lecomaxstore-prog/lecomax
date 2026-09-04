import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportDatabase } from "@/lib/support-server";
import { parseSupportMessage } from "@/lib/support-validation";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-send:${user.id}`, 20, 60_000);
  if (limited) return limited;
  const { id } = await context.params;
  const input = await req.json().catch(() => null) as { body?: unknown; client_message_id?: unknown } | null;
  const parsed = parseSupportMessage(input?.body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const clientMessageId = typeof input?.client_message_id === "string" && /^[0-9a-f-]{36}$/i.test(input.client_message_id) ? input.client_message_id : null;
  const db = supportDatabase();
  const { data: conversation } = await db.from("support_conversations").select("id,admin_unread").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  if (clientMessageId) {
    const { data: existing } = await db.from("support_messages").select("*").eq("conversation_id", id).eq("client_message_id", clientMessageId).maybeSingle();
    if (existing) return NextResponse.json({ message: existing });
  }
  const now = new Date().toISOString();
  const { data: message, error } = await db.from("support_messages").insert({
    conversation_id: id, sender_type: "customer", sender_user_id: user.id,
    body: parsed.body, client_message_id: clientMessageId,
  }).select("*").single();
  if (error || !message) return NextResponse.json({ error: "Le message n’a pas pu être envoyé." }, { status: 500 });
  await db.from("support_conversations").update({
    status: "open", last_message: parsed.body, last_message_at: now, updated_at: now,
    admin_unread: Number(conversation.admin_unread ?? 0) + 1,
  }).eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ message }, { status: 201 });
}
