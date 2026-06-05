import { MetadataRoute } from "next";

const SITE_URL = "https://lecomax.com";

const productSlugs = [
  "c-baasploa-course-homme",
  "a-sac-bandouliere-antivol-code",
  "a-sac-banane-pu-polyvalent",
  "a-lenovo-k3-pro-enceinte",
  "a-manette-sans-fil-rgb-v2",
  "a-genai-tws-hd",
];

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  const products = productSlugs.map((slug) => ({
    url: `${SITE_URL}/produit/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...statics, ...categories, ...products];
}
