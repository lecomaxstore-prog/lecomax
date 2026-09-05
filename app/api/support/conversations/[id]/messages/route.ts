import { randomUUID } from "node:crypto";
import { sendSupportFile } from '@/lib/support-files-server';
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportDatabase, supportFailure } from "@/lib/support-server";
import { parseSupportMessage, validSupportId } from "@/lib/support-validation";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Non autoris?." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-send:${user.id}`, 20, 60_000);
  if (limited) return limited;
  const { id } = await context.params;
  if (!validSupportId(id)) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  if (req.headers.get('content-type')?.includes('multipart/form-data')) return sendSupportFile(req, id, 'customer', user.id);
  const input = await req.json().catch(() => null) as { body?: unknown; client_message_id?: unknown } | null;
  const parsed = parseSupportMessage(input?.body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (input?.client_message_id !== undefined && !validSupportId(input.client_message_id)) {
    return NextResponse.json({ error: "Identifiant de message invalide." }, { status: 400 });
  }
  const { data, error } = await supportDatabase().rpc("support_send_message", {
    p_conversation_id: id, p_sender: "customer", p_user_id: user.id,
    p_body: parsed.body, p_client_id: input?.client_message_id ?? randomUUID(),
  });
  if (error) return supportFailure(error, "Le message n’a pas pu être envoyé.");
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}
