import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError, apiRequestValidated } from "@/lib/api-client";
const responseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ready"), locale: z.enum(["en", "fr"]), source_description: z.string(), description: z.string().trim().min(1).max(24000) }),
  z.object({ status: z.enum(["missing", "pending", "unavailable"]), retry_after: z.string().optional() }),
]);

class TranslationPending extends Error {}

export function productTranslationOptions({ slug, name, brand, description }: { slug: string; name: string; brand?: string | null; description: string }, language: "en" | "fr") {
  const source = description.trim();
  return queryOptions({
    queryKey: ["product-translations", "v2", slug, name, brand || "", source, language],
    enabled: Boolean(source),
    staleTime: Infinity,
    gcTime: 86400000,
    queryFn: async ({ signal }) => {
      const path = `/api/product-translations?slug=${encodeURIComponent(slug)}&locale=${language}`;
      const result = await apiRequestValidated(path, responseSchema, { method: "POST", signal, retries: 0, timeoutMs: 55000 });
      if (result.status === "pending") throw new TranslationPending();
      if (result.status === "unavailable" && result.retry_after) throw new TranslationPending();
      if (result.status !== "ready" || result.locale !== language || result.source_description !== source) throw new Error("Translation unavailable for this description");
      return result.description;
    },
    retry: (count, error) => error instanceof TranslationPending ? count < 24 : error instanceof ApiError && (error.status === 0 || error.status >= 500) && count < 2,
    retryDelay: (count, error) => error instanceof TranslationPending ? Math.min(2000, 750 + count * 250) : Math.min(10000, 2000 * 2 ** count),
  });
}
