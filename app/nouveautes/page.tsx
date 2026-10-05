import NouveautesClient from "./NouveautesClient";
import { getStoreCollection } from "@/lib/db-server";

export const dynamic = "force-dynamic";

export default async function NouveautesPage() {
  return <NouveautesClient initialProducts={await getStoreCollection("nouveautes")} />;
}
