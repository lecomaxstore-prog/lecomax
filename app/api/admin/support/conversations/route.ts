import { NextRequest, NextResponse } from "next/server";
import { protectAdminRead } from "@/lib/api-security";
import { supportDatabase } from "@/lib/support-server";
import { validSupportStatus } from "@/lib/support-validation";

export async function GET(req: NextRequest) {
  const denied = await protectAdminRead(req, { key: "admin-support-list" });
  if (denied) return denied;
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search")?.trim().slice(0, 80);
  let query = supportDatabase().from("support_conversations").select("*").order("admin_unread", { ascending: false }).order("last_message_at", { ascending: false }).limit(200);
  if (status && validSupportStatus(status)) query = query.eq("status", status);
  if (search) query = query.or(`customer_name.ilike.%${search.replace(/[%_,()]/g, "")}%,customer_email.ilike.%${search.replace(/[%_,()]/g, "")}%,subject.ilike.%${search.replace(/[%_,()]/g, "")}%`);
  const { data, error } = await query;
  return error ? NextResponse.json({ error: "Inbox indisponible." }, { status: 500 }) : NextResponse.json({ conversations: data ?? [] });
}
