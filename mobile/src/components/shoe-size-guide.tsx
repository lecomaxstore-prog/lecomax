import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { typography } from "@/constants/theme";
import { apiRequest } from "@/lib/api-client";
import { normalizeSize, sizeGuideRows, usesClothingSizes, type SizeGuideData } from "@/lib/size-guide";

export function ShoeSizeGuide({ open, onClose, availableSizes, productSizes, selectedSize, onSelectSize }: {
  open: boolean;
  onClose: () => void;
  availableSizes: string[];
  productSizes: string[];
  selectedSize?: string;
  onSelectSize: (size: string) => void;
}) {
  useLocale();
  const { contentWidth } = useAppViewport();
  const clothing = usesClothingSizes(productSizes);
  const [data, setData] = useState<SizeGuideData>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const rows = sizeGuideRows(data, clothing, productSizes);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus("loading");
    void apiRequest<SizeGuideData>("/api/size-guide").then((result) => {
      if (!active) return;
      if (!(clothing ? result.clothing : result.shoes)?.length) throw new Error(msg("shoeSizeGuide.emptyGuide"));
      setData(result);
      setStatus("ready");
    }).catch(() => {
      if (active) setStatus("error");
    });
    return () => { active = false; };
  }, [open, clothing, attempt]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop} edges={["top", "bottom"]}>
        <Pressable accessibilityRole="button" accessibilityLabel={msg("shoeSizeGuide.closeGuide")} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.sheet, { width: contentWidth }]}>
          <View style={styles.handleArea}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.brand}>{msg("shoeSizeGuide.lEcomaxTheRightFitUppercase")}</Text>
              <Text accessibilityRole="header" style={styles.title}>{clothing ? msg("shoeSizeGuide.sizeGuide") : msg("shoeSizeGuide.shoeSizeGuide")}</Text>
            </View>
            <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("shoeSizeGuide.closeGuide")} onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={21} color="#33473B" />
            </AnimatedPressable>
          </View>
          <ScrollView key={open ? "open" : "closed"} style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.intro}>{clothing ? msg("shoeSizeGuide.aGuideToChoosingTheRightSizeForYou") : msg("shoeSizeGuide.findTheRightShoeSizeForYourFoot")}</Text>
            <View style={styles.tableCaption}>
              <Text style={styles.caption}>{clothing ? msg("shoeSizeGuide.measurementsInCmUppercase") : msg("shoeSizeGuide.sizeConversionsUppercase")}</Text>
              {selectedSize ? (
                <View style={styles.selection}>
                  <Ionicons name="checkmark" size={13} color="#294E3A" />
                  <Text style={styles.selectionText}>{clothing ? msg("shoeSizeGuide.size") : "EU"} {selectedSize} {msg("shoeSizeGuide.selected")}</Text>
                </View>
              ) : null}
            </View>
            {status === "loading" ? (
              <View style={styles.state} accessibilityLabel={msg("shoeSizeGuide.loadingSizeGuide")}>
                <ActivityIndicator color="#294E3A" />
                <Text style={styles.description}>{msg("shoeSizeGuide.loadingGuide")}</Text>
              </View>
            ) : status === "error" ? (
              <View style={styles.state} accessibilityLiveRegion="polite">
                <Ionicons name="cloud-offline-outline" size={26} color="#647267" />
                <Text style={styles.helpTitle}>{msg("shoeSizeGuide.guideTemporarilyUnavailable")}</Text>
                <AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("shoeSizeGuide.tryLoadingTheGuideAgain")} onPress={() => setAttempt((value) => value + 1)} style={styles.retry}>
                  <Text style={styles.retryText}>{msg("support.tryAgain")}</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  {(clothing ? [msg("shoeSizeGuide.size"), "FR", msg("shoeSizeGuide.chest"), msg("shoeSizeGuide.waistMeasurement")] : ["EU", "US", "UK", "CM"]).map((heading) => (
                    <Text key={heading} style={styles.columnHeading}>{heading}</Text>
                  ))}
                </View>
                {rows.map((row) => {
                  const productSize = availableSizes.find((size) => normalizeSize(size) === normalizeSize(row.size));
                  const available = productSize !== undefined;
                  const selected = !!selectedSize && normalizeSize(selectedSize) === normalizeSize(row.size);
                  return (
                    <Pressable
                      key={row.size}
                      accessibilityRole="button"
                      accessibilityLabel={`${clothing ? msg("shoeSizeGuide.size") : msg("shoeSizeGuide.euSize")} ${row.size}, ${row.values.join(", ")}${selected ? msg("shoeSizeGuide.selectedText") : ""}${available ? msg("shoeSizeGuide.available") : msg("shoeSizeGuide.unavailable")}`}
                      accessibilityState={{ selected, disabled: !available }}
                      disabled={!available}
                      onPress={() => { onSelectSize(productSize ?? row.size); onClose(); }}
                      style={({ pressed }) => [styles.row, selected && styles.selectedRow, pressed && styles.pressedRow]}
                    >
                      <View style={styles.labelCell}>
                        {selected ? <View style={styles.selectionMark} /> : null}
                        <View style={[styles.sizeBadge, selected && styles.selectedBadge]}>
                          <Text style={[styles.sizeLabel, selected && styles.selectedLabel]}>{row.size}</Text>
                        </View>
                        {available ? <View style={styles.availableDot} /> : null}
                      </View>
                      {row.values.map((value, index) => (
                        <Text key={index} style={[styles.measurement, selected && styles.selectedMeasurement]}>{value}</Text>
                      ))}
                    </Pressable>
                  );
                })}
              </View>
            )}
            {status === "ready" ? (
              <View style={styles.legend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>{msg("shoeSizeGuide.availableForThisProductTapASizeToChooseIt")}</Text>
              </View>
            ) : null}
            <View style={styles.help}>
              <Ionicons name={clothing ? "shirt-outline" : "footsteps-outline"} size={21} color="#647267" />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>{clothing ? msg("shoeSizeGuide.howToTakeYourMeasurements") : msg("shoeSizeGuide.howToMeasureYourFoot")}</Text>
                <Text style={styles.description}>{clothing ? msg("shoeSizeGuide.measureAroundTheFullestPartOfYourChestThenAroundYourWaist") : msg("shoeSizeGuide.placeYourFootOnASheetOfPaperAndMeasureFromYour")}</Text>
                <Text style={styles.note}>{msg("shoeSizeGuide.measurementsAreApproximateFitMayVaryByStyle")}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "flex-end", backgroundColor: "rgba(20,29,23,0.4)" },
  sheet: { height: "88%", maxHeight: 780, overflow: "hidden", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#FFFEFB" },
  handleArea: { alignItems: "center", paddingTop: 11, paddingBottom: 8, flexShrink: 0 },
  handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: "#D9DDD5" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: "#EEEDE7" },
  heading: { flex: 1 },
  brand: { fontFamily: typography.medium, fontSize: 8, letterSpacing: 1.5, color: "#78816F" },
  title: { marginTop: 9, fontFamily: typography.semibold, fontSize: 24, letterSpacing: -0.8, color: "#24382C" },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E6E8DF", alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1, minHeight: 0 },
  content: { padding: 20, paddingBottom: 30 },
  intro: { fontFamily: typography.regular, fontSize: 12, lineHeight: 20, color: "#73796E" },
  tableCaption: { marginTop: 22, marginBottom: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 },
  caption: { fontFamily: typography.medium, fontSize: 9, letterSpacing: 1.2, color: "#777F70" },
  selection: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#EDF2E9" },
  selectionText: { fontFamily: typography.medium, fontSize: 10, color: "#294E3A" },
  table: { borderWidth: 1, borderColor: "#E4E7DE", borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF" },
  tableHeader: { minHeight: 48, paddingVertical: 10, flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4EE" },
  columnHeading: { flex: 1, paddingHorizontal: 3, fontFamily: typography.medium, fontSize: 10, lineHeight: 14, textAlign: "center", color: "#66715F" },
  row: { minHeight: 49, paddingVertical: 8, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEEFE9" },
  selectedRow: { backgroundColor: "#EDF3E9" },
  pressedRow: { backgroundColor: "#E7EEE2" },
  labelCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  selectionMark: { position: "absolute", left: 0, top: 0, bottom: 0, width: 2, borderRadius: 1, backgroundColor: "#31553D" },
  sizeBadge: { minWidth: 32, minHeight: 30, paddingHorizontal: 5, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  selectedBadge: { backgroundColor: "#294E3A" },
  sizeLabel: { fontFamily: typography.medium, fontSize: 12, color: "#505B4B" },
  selectedLabel: { color: "#FFFEF8", fontFamily: typography.semibold },
  availableDot: { position: "absolute", right: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: "#4E7552" },
  measurement: { flex: 1, paddingHorizontal: 2, fontFamily: typography.regular, fontSize: 12, fontVariant: ["tabular-nums"], color: "#667060", textAlign: "center" },
  selectedMeasurement: { fontFamily: typography.semibold, color: "#294E3A" },
  legend: { marginTop: 12, flexDirection: "row", gap: 7, alignItems: "center" },
  legendDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#4E7552" },
  legendText: { flex: 1, fontFamily: typography.regular, fontSize: 9, lineHeight: 15, color: "#777F70" },
  help: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#E7E9DF", flexDirection: "row", gap: 12 },
  helpContent: { flex: 1, gap: 7 },
  helpTitle: { fontFamily: typography.medium, fontSize: 12, color: "#384B3B" },
  description: { fontFamily: typography.regular, fontSize: 11, lineHeight: 19, color: "#70786A" },
  note: { fontFamily: typography.regular, fontSize: 10, lineHeight: 17, color: "#858B7D" },
  state: { minHeight: 200, alignItems: "center", justifyContent: "center", gap: 14 },
  retry: { minHeight: 44, paddingHorizontal: 22, borderRadius: 12, backgroundColor: "#294E3A", alignItems: "center", justifyContent: "center" },
  retryText: { fontFamily: typography.medium, fontSize: 12, color: "#FFFFFF" },
});
