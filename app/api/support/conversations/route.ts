import { randomUUID } from "node:crypto";
import { supportPreview } from '@/lib/support-attachments';
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportCustomerName, supportDatabase, supportFailure } from "@/lib/support-server";
import { parseSupportConversation, validSupportId } from "@/lib/support-validation";

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
    ? supportFailure(error, "Impossible de charger vos conversations.")
    : NextResponse.json({ conversations: (data ?? []).map(item => ({ ...item, last_message: supportPreview(item.last_message) })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour contacter l’assistance." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-start:${user.id}`, 5, 10 * 60_000);
  if (limited) return limited;
  const input = await req.json().catch(() => null);
  const parsed = parseSupportConversation(input);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (input?.client_message_id !== undefined && !validSupportId(input.client_message_id)) {
    return NextResponse.json({ error: "Identifiant de message invalide." }, { status: 400 });
  }
  const { data, error } = await supportDatabase().rpc("support_start_conversation", {
    p_user_id: user.id, p_name: supportCustomerName(user),
    p_email: user.email ?? "compte-client@lecomax.invalid", p_subject: parsed.subject,
    p_order_number: parsed.orderNumber, p_body: parsed.message,
    p_client_id: input?.client_message_id ?? randomUUID(),
  });
  if (error) return supportFailure(error, "La conversation n’a pas pu être créée.");
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}
