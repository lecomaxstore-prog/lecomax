import PromotionsClient from "./PromotionsClient";
import { getStoreCollection } from "@/lib/db-server";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  return <PromotionsClient initialProducts={await getStoreCollection("promotions")} />;
}
