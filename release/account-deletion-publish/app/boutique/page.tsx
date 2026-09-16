import BoutiqueClient from "./BoutiqueClient";
import { apiToCard, type CardProduct } from "@/lib/products";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const revalidate = 300;

export default async function BoutiquePage() {
  let initialProducts: CardProduct[] = [];
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("products").select("*")
      .eq("active", true).order("created_at", { ascending: false });
    // Render live products in HTML for customers and crawlers alike.
    // A successful empty result must not resurrect the bundled catalogue.
    if (!error && data) initialProducts = data.map(apiToCard);
  } catch {
    // Never resurrect deleted or hidden bundled products.
  }
  return <BoutiqueClient initialProducts={initialProducts} />;
}
