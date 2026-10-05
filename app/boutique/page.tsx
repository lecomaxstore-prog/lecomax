import { getStorefrontSettings } from "@/lib/storefront-settings-server";
import BoutiqueClient from "./BoutiqueClient";
import { getDbProducts, getStoreCollection } from "@/lib/db-server";
import { connection } from "next/server";

export const revalidate = 300;

export default async function BoutiquePage() {
  // Render the URL-selected category on the server, before hydration.
  await connection();
  const [initialProducts, initialSettings, promotions] = await Promise.all([getDbProducts({ activeOnly: true }), getStorefrontSettings(), getStoreCollection("promotions")]);
  return <BoutiqueClient initialProducts={initialProducts} initialSettings={initialSettings} initialPromotionSlugs={promotions.map(p => p.slug)} />;
}
