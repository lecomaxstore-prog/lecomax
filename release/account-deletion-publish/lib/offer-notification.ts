import "server-only";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deliverMobileCampaign } from "@/lib/mobile-campaigns";

/** Delivery runs after the API response; the transactionally queued row survives failures. */
export function publishOfferNotification(id: string, kind: "promotion" | "product") {
  after(async () => {
    try {
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data, error } = await db.from("mobile_notification_campaigns").select("id")
        .eq(kind === "promotion" ? "source_promotion_id" : "source_offer_product_id", id)
        .eq("status", "scheduled").lte("scheduled_at", new Date().toISOString());
      if (error) throw new Error(error.message);
      for (const campaign of data ?? []) await deliverMobileCampaign(campaign.id, "system:new-offer");
    } catch (error) { console.error("Offer notification delivery failed", error); }
  });
}
