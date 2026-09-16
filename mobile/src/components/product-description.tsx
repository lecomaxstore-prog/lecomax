import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { productTranslationOptions } from "@/lib/product-translation-query";
import { AnimatedPressable } from "@/components/animated-pressable";
import { msg, useLocale } from "@/i18n";
import { typography } from "@/constants/theme";

/** Source-keyed cache keeps translations separate across products, edits and languages. */
export function ProductDescription({ slug, name, brand, description }: { slug: string; name: string; brand?: string | null; description: string }) {
  const language = useLocale();
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const source = description.trim();
  const descriptionKey = JSON.stringify([slug, source, language]);
  const showOriginal = originalKey === descriptionKey;
  const translation = useQuery(productTranslationOptions({ slug, name, brand, description }, language));
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
            <AnimatedPressable accessibilityRole="button" onPress={() => setOriginalKey(showOriginal ? null : descriptionKey)} style={styles.action}>
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

