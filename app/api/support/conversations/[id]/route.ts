import { NextRequest, NextResponse } from "next/server";
import { presentSupportThread } from '@/lib/support-files-server';
import { enforceRateLimit } from "@/lib/api-security";
import { getCustomerUser } from "@/lib/request-auth";
import { supportDatabase, supportFailure } from "@/lib/support-server";

import { validSupportId } from "@/lib/support-validation";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCustomerUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const limited = enforceRateLimit(req, `support-read:${user.id}`, 120, 60_000);
  if (limited) return limited;
  const { id } = await context.params;
  if (!validSupportId(id)) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  const { data, error } = await supportDatabase().rpc("support_read_conversation", {
    p_conversation_id: id, p_reader: "customer", p_user_id: user.id,
  });
  if (error) return supportFailure(error, "Conversation indisponible.");
  return NextResponse.json(await presentSupportThread(data), { headers: { "Cache-Control": "no-store" } });
}
