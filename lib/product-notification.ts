import "server-only";
import { createClient } from "@supabase/supabase-js";
import { deliverMobileCampaign } from "@/lib/mobile-campaigns";

/** The database trigger creates one campaign per first publication, atomically. */
export async function deliverProductNotification(productId: string) {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await db.from("mobile_notification_campaigns").select("id").eq("source_product_id", productId).eq("status", "scheduled").maybeSingle();
  if (error) throw new Error("PRODUCT_NOTIFICATION_QUEUE_UNAVAILABLE");
  if (data) await deliverMobileCampaign(data.id, "system:new-product");
}
