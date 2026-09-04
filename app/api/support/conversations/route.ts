import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportCustomerName, supportDatabase } from "@/lib/support-server";
import { parseSupportConversation } from "@/lib/support-validation";

export async function GET(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour accéder à l’assistance." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-list:${user.id}`, 90, 60_000);
  if (limited) return limited;
  const db = supportDatabase();
  const { data, error } = await db.from("support_conversations")
    .select("id,subject,order_number,status,last_message,last_message_at,customer_unread,created_at,updated_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(50);
  return error
    ? NextResponse.json({ error: "Impossible de charger vos conversations." }, { status: 500 })
    : NextResponse.json({ conversations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour contacter l’assistance." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-start:${user.id}`, 5, 10 * 60_000);
  if (limited) return limited;
  const parsed = parseSupportConversation(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const db = supportDatabase();
  const now = new Date().toISOString();
  const { data: conversation, error } = await db.from("support_conversations").insert({
    user_id: user.id,
    customer_name: supportCustomerName(user),
    customer_email: user.email ?? "compte-client@lecomax.invalid",
    subject: parsed.subject,
    order_number: parsed.orderNumber,
    status: "open",
    last_message: parsed.message,
    last_message_at: now,
    admin_unread: 1,
  }).select("*").single();
  if (error || !conversation) return NextResponse.json({ error: "La conversation n’a pas pu être créée." }, { status: 500 });
  const { data: message, error: messageError } = await db.from("support_messages").insert({
    conversation_id: conversation.id,
    sender_type: "customer",
    sender_user_id: user.id,
    body: parsed.message,
  }).select("*").single();
  if (messageError) {
    await db.from("support_conversations").delete().eq("id", conversation.id);
    return NextResponse.json({ error: "Le message n’a pas pu être envoyé." }, { status: 500 });
  }
  return NextResponse.json({ conversation, message }, { status: 201 });
}
