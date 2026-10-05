import BestsellersClient from "./BestsellersClient";
import { getStoreCollection } from "@/lib/db-server";

export const dynamic = "force-dynamic";

export default async function BestsellersPage() {
  return <BestsellersClient initialProducts={await getStoreCollection("bestsellers")} />;
}
