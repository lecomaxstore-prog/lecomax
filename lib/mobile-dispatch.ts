import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const hash = (recipient: string) => createHash("sha256").update(recipient).digest("hex");

// Claim before contacting the provider. A crash/timeout remains 'sending' for
// manual reconciliation, rather than resending an ambiguously accepted push.
export async function claimDispatch(campaignId: string, recipient: string) {
  const client = db();
  const key = { campaign_id: campaignId, recipient_hash: hash(recipient) };
  const { data, error } = await client.from("mobile_campaign_dispatches").upsert(key, { onConflict: "campaign_id,recipient_hash", ignoreDuplicates: true }).select("status");
  if (error) throw new Error("DISPATCH_CLAIM_FAILED");
  if (data?.length) return "send" as const;
  const { data: retried, error: retryError } = await client.from("mobile_campaign_dispatches").update({ status: "sending", updated_at: new Date().toISOString() }).match(key).eq("status", "failed").select("status");
  if (retryError) throw new Error("DISPATCH_RETRY_FAILED");
  if (retried?.length) return "send" as const;
  const { data: existing, error: readError } = await client.from("mobile_campaign_dispatches").select("status").match(key).single();
  if (readError) throw new Error("DISPATCH_READ_FAILED");
  return existing.status === "accepted" ? "accepted" as const : "uncertain" as const;
}
export async function finishDispatch(campaignId: string, recipient: string, status: "accepted" | "failed") {
  const { error } = await db().from("mobile_campaign_dispatches").update({ status, updated_at: new Date().toISOString() })
    .eq("campaign_id", campaignId).eq("recipient_hash", hash(recipient));
  if (error) throw new Error("DISPATCH_SAVE_FAILED");
}

export async function claimDispatchBatch(campaignId: string, recipients: string[]) {
  const client = db();
  const hashes = recipients.map(hash);
  const { data: inserted, error } = await client.from("mobile_campaign_dispatches").upsert(
    hashes.map(recipient_hash => ({ campaign_id: campaignId, recipient_hash })),
    { onConflict: "campaign_id,recipient_hash", ignoreDuplicates: true },
  ).select("recipient_hash");
  if (error) throw new Error("DISPATCH_CLAIM_FAILED");
  const { data: retried, error: retryError } = await client.from("mobile_campaign_dispatches").update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("campaign_id", campaignId).in("recipient_hash", hashes).eq("status", "failed").select("recipient_hash");
  if (retryError) throw new Error("DISPATCH_RETRY_FAILED");
  const claimed = new Set([...(inserted ?? []), ...(retried ?? [])].map(row => row.recipient_hash));
  const { data: existing, error: readError } = await client.from("mobile_campaign_dispatches").select("recipient_hash,status").eq("campaign_id", campaignId).in("recipient_hash", hashes);
  if (readError) throw new Error("DISPATCH_READ_FAILED");
  const statuses = new Map(existing?.map(row => [row.recipient_hash, row.status]));
  return recipients.map((recipient, index) => ({ recipient, status: claimed.has(hashes[index]) ? "send" : statuses.get(hashes[index]) === "accepted" ? "accepted" : "uncertain" }));
}
export async function finishDispatchBatch(campaignId: string, recipients: string[], status: "accepted" | "failed") {
  if (!recipients.length) return;
  const { error } = await db().from("mobile_campaign_dispatches").update({ status, updated_at: new Date().toISOString() }).eq("campaign_id", campaignId).in("recipient_hash", recipients.map(hash));
  if (error) throw new Error("DISPATCH_SAVE_FAILED");
}
