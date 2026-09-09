import { Text, View } from "react-native";
import { msg, useLocale, currentLocale } from "@/i18n";
import type { PreorderSnapshot } from "@/lib/purchasability";

export function PreorderNotice({ item }: { item: PreorderSnapshot }) {
  useLocale();
  if (item.fulfillment_type !== "PREORDER") return null;
  const estimated = item.preorder_estimated_at ? new Date(item.preorder_estimated_at) : null;
  return <View accessibilityRole="text" style={{ marginVertical: 8, padding: 10, borderRadius: 10, backgroundColor: "#FFF5DD", borderWidth: 1, borderColor: "#E7CD8F" }}>
    <Text style={{ fontWeight: "700", color: "#68470A" }}>{msg("preorder.badge")}</Text>
    <Text style={{ color: "#68470A", marginTop: 4 }}>{msg("preorder.explanation")}</Text>
    {estimated && Number.isFinite(estimated.getTime()) ? <Text style={{ color: "#68470A" }}>{msg("preorder.estimated")}: {new Intl.DateTimeFormat(currentLocale(), { dateStyle: "long", timeZone: "UTC" }).format(estimated)}</Text> : null}
    {item.preorder_message ? <Text style={{ color: "#68470A" }}>{item.preorder_message}</Text> : null}
  </View>;
}
