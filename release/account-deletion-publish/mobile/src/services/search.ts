import { apiRequest } from "@/lib/api-client";

type SearchResponse = {
  results?: { slug?: unknown }[];
  suggestions?: string[];
  total?: number;
};

export async function searchCatalogue(query: string) {
  const value = query.trim().slice(0, 80);
  if (!value) return { slugs: [] as string[], suggestions: [] as string[], total: 0 };
  const response = await apiRequest<SearchResponse>(
    `/api/search?q=${encodeURIComponent(value)}&limit=24`,
  );
  return {
    slugs: (response.results ?? [])
      .map((product) => product.slug)
      .filter((slug): slug is string => typeof slug === "string" && Boolean(slug)),
    suggestions: Array.isArray(response.suggestions) ? response.suggestions.filter(Boolean) : [],
    total: Number(response.total) || 0,
  };
}
