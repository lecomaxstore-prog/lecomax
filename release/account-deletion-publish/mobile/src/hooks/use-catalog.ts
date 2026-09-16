import { LIVE_QUERY_OPTIONS } from "@/lib/store-sync";
import { useQuery } from "@tanstack/react-query";
import {
  getBanners,
  getCategories,
  getProduct,
  getProducts,
  getPromotions,
  getRecommendationSlugs,
  getReviews,
  getSettings,
} from "@/services/catalog";

const liveQueryOptions = LIVE_QUERY_OPTIONS;

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => getProducts(signal),
    ...liveQueryOptions,
  });
export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ["products", slug],
    queryFn: ({ signal }) => getProduct(slug, signal),
    enabled: Boolean(slug),
    ...liveQueryOptions,
  });
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(signal),
    ...liveQueryOptions,
  });
export const usePromotions = () =>
  useQuery({
    queryKey: ["promotions"],
    queryFn: ({ signal }) => getPromotions(signal),
    ...liveQueryOptions,
  });
export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: ({ signal }) => getSettings(signal),
    ...liveQueryOptions,
  });
export const useRecommendationSlugs = (enabled = true) =>
  useQuery({
    queryKey: ["recommendations", "wishlist"],
    queryFn: ({ signal }) => getRecommendationSlugs(12, signal),
    enabled,
    ...liveQueryOptions,
  });
export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: ({ signal }) => getBanners(signal),
    ...liveQueryOptions,
  });
export const useReviews = (slug: string) =>
  useQuery({
    queryKey: ["reviews", slug],
    queryFn: ({ signal }) => getReviews(slug, signal),
    enabled: Boolean(slug),
    ...liveQueryOptions,
  });
