import type { Category } from "@/types/commerce";

export const categoryCampaignImages = {
  homme: require("../../assets/images/categories/generated/homme-campaign-v2.webp"),
  femme: require("../../assets/images/categories/generated/femme-campaign-v2.webp"),
  chaussures: require("../../assets/images/categories/generated/chaussures-campaign-v2.webp"),
  accessoires: require("../../assets/images/categories/generated/accessoires-campaign-v2.webp"),
} as const;

export function categoryCampaignImage(
  category: Pick<Category, "slug" | "label">,
): number | null {
  const value = `${category.slug} ${category.label}`.toLowerCase();
  if (/chauss|shoe|basket/.test(value)) return categoryCampaignImages.chaussures;
  if (/access|sac|bag/.test(value)) return categoryCampaignImages.accessoires;
  if (/homme|men/.test(value)) return categoryCampaignImages.homme;
  if (/femme|women/.test(value)) return categoryCampaignImages.femme;
  return null;
}
