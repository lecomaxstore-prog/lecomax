import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://lecomax.com";

const categorySlugs = ["homme", "femme", "chaussures", "accessoires"];

const staticPages = [
  { path: "", priority: 1.0, changeFreq: "daily" as const },
  { path: "/boutique", priority: 0.9, changeFreq: "daily" as const },
  { path: "/nouveautes", priority: 0.8, changeFreq: "weekly" as const },
  { path: "/bestsellers", priority: 0.8, changeFreq: "weekly" as const },
  { path: "/promotions", priority: 0.8, changeFreq: "daily" as const },
  { path: "/guide-des-tailles", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/a-propos", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/aide", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/suivre-commande", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/retours", priority: 0.4, changeFreq: "monthly" as const },
  { path: "/conditions", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/confidentialite", priority: 0.3, changeFreq: "yearly" as const },
  { path: "/cookies", priority: 0.3, changeFreq: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statics = staticPages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFreq,
    priority: p.priority,
  }));

  const categories = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Fetch all active product slugs from database
  let productSlugs: string[] = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (data) {
      productSlugs = data.map((p: { slug: string }) => p.slug).filter(Boolean);
    }
  } catch {
    // Fallback to empty — don't crash the build
  }

  const products = productSlugs.map((slug) => ({
    url: `${SITE_URL}/produit/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...statics, ...categories, ...products];
}
