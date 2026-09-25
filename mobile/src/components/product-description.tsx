import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text } from "react-native";
import { productTranslationOptions } from "@/lib/product-translation-query";
import { useLocale } from "@/i18n";
import { typography } from "@/constants/theme";

/** Source-keyed cache keeps translations separate across products, edits and languages. */
export function ProductDescription({ slug, name, brand, description }: { slug: string; name: string; brand?: string | null; description: string }) {
  const language = useLocale();
  const source = description.trim();
  const translation = useQuery(productTranslationOptions({ slug, name, brand, description }, language));
  return (
    <Text selectable style={styles.description}>{translation.data ?? source}</Text>
  );
}

const styles = StyleSheet.create({
  description: { color: "#6F7568", fontFamily: typography.regular, fontSize: 13, lineHeight: 23 },
});

