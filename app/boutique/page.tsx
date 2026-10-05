import BoutiqueClient from "./BoutiqueClient";
import { getDbProducts } from "@/lib/db-server";
import { connection } from "next/server";

export const revalidate = 300;

export default async function BoutiquePage() {
  // Render the URL-selected category on the server, before hydration.
  await connection();
  const initialProducts = await getDbProducts({ activeOnly: true });
  return <BoutiqueClient initialProducts={initialProducts} />;
}
