import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { AnimatedPressable } from "@/components/animated-pressable";
import { msg, useLocale } from "@/i18n";
import { ApiError, apiRequestValidated } from "@/lib/api-client";
import { typography } from "@/constants/theme";

const responseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ready"), locale: z.enum(["en", "fr"]), source_description: z.string(), description: z.string().trim().min(1).max(24000) }),
  z.object({ status: z.enum(["missing", "pending", "unavailable"]), retry_after: z.string().optional() }),
]);

class TranslationPending extends Error {}

/** Source-keyed cache keeps translations separate across products, edits and languages. */
export function ProductDescription({ slug, name, brand, description }: { slug: string; name: string; brand?: string | null; description: string }) {
  const language = useLocale();
  const [showOriginal, setShowOriginal] = useState(false);
  const source = description.trim();
  useEffect(() => setShowOriginal(false), [slug, source, language]);
  const translation = useQuery({
    queryKey: ["product-translations", "v2", slug, name, brand || "", source, language],
    enabled: Boolean(source),
    staleTime: Infinity,
    gcTime: 86400000,
    queryFn: async ({ signal }) => {
      const path = `/api/product-translations?slug=${encodeURIComponent(slug)}&locale=${language}`;
      let result = await apiRequestValidated(path, responseSchema, { signal, retries: 0 });
      if (result.status === "missing") {
        result = await apiRequestValidated(path, responseSchema, { method: "POST", signal, retries: 0, timeoutMs: 55000 });
      }
      if (result.status === "pending") throw new TranslationPending();
      if (result.status === "unavailable" && result.retry_after) throw new TranslationPending();
      if (result.status !== "ready" || result.locale !== language || result.source_description !== source) throw new Error("Translation unavailable for this description");
      return result.description;
    },
    retry: (count, error) => error instanceof TranslationPending ? count < 24 : error instanceof ApiError && (error.status === 0 || error.status >= 500) && count < 2,
    retryDelay: (count, error) => error instanceof TranslationPending ? 4000 : Math.min(10000, 2000 * 2 ** count),
  });
  const translated = translation.data;
  const busy = translation.isFetching;
  return (
    <View>
      {source && translated !== source ? (
        <View style={styles.translationRow}>
          <View style={styles.status}>
            {busy && !translated ? <ActivityIndicator size="small" color="#667363" /> : null}
            <Text style={styles.caption}>
              {translated ? msg(showOriginal ? "translation.original" : "translation.translated") : msg(busy ? "translation.loading" : "translation.unavailable")}
            </Text>
          </View>
          {translated ? (
            <AnimatedPressable accessibilityRole="button" onPress={() => setShowOriginal((value) => !value)} style={styles.action}>
              <Text style={styles.actionText}>{msg(showOriginal ? "translation.showTranslated" : "translation.showOriginal")}</Text>
            </AnimatedPressable>
          ) : !busy ? (
            <AnimatedPressable accessibilityRole="button" onPress={() => void translation.refetch()} style={styles.action}>
              <Text style={styles.actionText}>{msg("translation.retry")}</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      ) : null}
      <Text selectable style={styles.description}>{translated && !showOriginal ? translated : source}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  translationRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 10 },
  status: { flex: 1, minWidth: 110, flexDirection: "row", alignItems: "center", gap: 6 },
  caption: { flexShrink: 1, color: "#777C76", fontFamily: typography.regular, fontSize: 10, lineHeight: 15 },
  action: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  actionText: { color: "#203D2C", fontFamily: typography.medium, fontSize: 11 },
  description: { color: "#6F7568", fontFamily: typography.regular, fontSize: 13, lineHeight: 23 },
});
