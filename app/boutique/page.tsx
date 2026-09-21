import BoutiqueClient from "./BoutiqueClient";
import { getDbProducts } from "@/lib/db-server";

export const revalidate = 300;

export default async function BoutiquePage() {
  const initialProducts = await getDbProducts({ activeOnly: true });
  return <BoutiqueClient initialProducts={initialProducts} />;
}
