import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Expo acceptance is not device delivery; check provider receipts separately. */
export async function checkMobilePushReceipts() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await db.from("mobile_push_receipts").select("ticket_id,token,created_at").eq("status", "pending")
    .lte("created_at", new Date(Date.now() - 15 * 60000).toISOString()).order("created_at").limit(1000);
  if (error) throw new Error("EXPO_RECEIPTS_UNAVAILABLE");
  if (!data?.length) return { checked: 0, errors: 0, pending: 0 };
  const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST", headers: { "Content-Type": "application/json", ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
    body: JSON.stringify({ ids: data.map(row => row.ticket_id) }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`EXPO_RECEIPTS_${response.status}`);
  const payload = await response.json() as { data?: Record<string, { status?: string; details?: { error?: string } }> };
  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) throw new Error("EXPO_INVALID_RECEIPTS");
  let checked = 0, errors = 0, pending = 0;
  for (const row of data) {
    const receipt = payload.data[row.ticket_id];
    const expired = Date.parse(row.created_at) < Date.now() - 23 * 3600000;
    if (!receipt && !expired) { pending++; continue; }
    if (receipt && receipt.status !== "ok" && receipt.status !== "error") throw new Error("EXPO_INVALID_RECEIPT_STATUS");
    const status = receipt?.status ?? "missing";
    const errorCode = receipt?.details?.error ?? (expired && !receipt ? "RECEIPT_EXPIRED" : null);
    if (status !== "ok") errors++;
    if (errorCode === "DeviceNotRegistered") {
      const { error } = await db.from("mobile_push_tokens").update({ active: false, updated_at: new Date().toISOString() }).eq("token", row.token);
      if (error) throw new Error("EXPO_TOKEN_CLEANUP_FAILED");
    }
    const { error } = await db.from("mobile_push_receipts").update({ status, error_code: errorCode, checked_at: new Date().toISOString() }).eq("ticket_id", row.ticket_id);
    if (error) throw new Error("EXPO_RECEIPT_UPDATE_FAILED");
    checked++;
  }
  return { checked, errors, pending };
}
