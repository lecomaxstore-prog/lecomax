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

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => getProducts(signal),
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnReconnect: true,
  });
export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ["products", slug],
    queryFn: ({ signal }) => getProduct(slug, signal),
    enabled: Boolean(slug),
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnReconnect: true,
  });
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 10 * 60_000,
    refetchInterval: 30_000,
  });
export const usePromotions = () =>
  useQuery({
    queryKey: ["promotions"],
    queryFn: ({ signal }) => getPromotions(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 30_000,
  });
export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: ({ signal }) => getSettings(signal),
    staleTime: 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
export const useRecommendationSlugs = (enabled = true) =>
  useQuery({
    queryKey: ["recommendations", "wishlist"],
    queryFn: ({ signal }) => getRecommendationSlugs(12, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: ({ signal }) => getBanners(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 30_000,
  });
export const useReviews = (slug: string) =>
  useQuery({
    queryKey: ["reviews", slug],
    queryFn: ({ signal }) => getReviews(slug, signal),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
