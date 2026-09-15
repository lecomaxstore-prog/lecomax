import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionToken, verifySessionToken } from "./admin-session";
import { getAdminAccess } from "./admin-access";
import { hasAdminPermission } from "./admin-policy";
import { sameRequestOrigin } from "./request-origin";

export const CHAT_VISITOR_COOKIE = "chat_visitor";
const cookies = (req: Request) => ({ get(name: string) {
  const part = (req.headers.get("cookie") || "").split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return part ? { value: part.slice(name.length + 1) } : undefined;
} });

export async function chatVisitor(req: Request) {
  const token = cookies(req).get(CHAT_VISITOR_COOKIE)?.value;
  const identity = token ? await verifySessionToken(token) : null;
  return identity?.startsWith("chat-visitor:") ? identity.slice("chat-visitor:".length) : null;
}

export function chatVisitorToken(visitor: string) {
  return createSessionToken(`chat-visitor:${visitor}`, 30 * 86_400_000);
}

export async function ownsChat(req: Request, db: SupabaseClient, id: unknown) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  if (!["GET", "HEAD"].includes(req.method) && !sameRequestOrigin(req)) return false;
  const visitor = await chatVisitor(req);
  if (visitor) {
    const { data, error } = await db.from("chat_sessions").select("visitor_id").eq("id", id).maybeSingle();
    if (!error && data?.visitor_id === visitor) return true;
  }
  const access = await getAdminAccess({ cookies: cookies(req) });
  return hasAdminPermission(access, req.method === "GET" ? "messages.view" : "messages.reply");
}
