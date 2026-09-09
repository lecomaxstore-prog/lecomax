import { PreorderNotice } from "@/components/preorder-notice";
import { orderStatusLabel } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { currentLocale, msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { money } from "@/lib/format";
import { getOrderTracking } from "@/services/orders";
import { useUserStore } from "@/stores/user";

const steps = [
  { icon: "receipt-outline" as const, get title() { return msg("orderTracking.orderReceived"); }, get subtitle() { return msg("orderTracking.yourOrderHasBeenReceived"); } },
  { icon: "cube-outline" as const, get title() { return msg("orderTracking.preparing"); }, get subtitle() { return msg("orderTracking.yourItemsAreBeingPrepared"); } },
  { icon: "car-outline" as const, get title() { return msg("orderTracking.shipped"); }, get subtitle() { return msg("orderTracking.yourParcelIsOnItsWay"); } },
  { icon: "home-outline" as const, get title() { return msg("orderTracking.delivered"); }, get subtitle() { return msg("orderTracking.yourOrderHasBeenDelivered"); } },
];

function normalizeOrderNumber(value: string) {
  const compact = value.trim().toUpperCase().replace(/^#/, "").replace(/\s+/g, "");
  if (/^\d{6}$/.test(compact)) return `ECO-${compact}`;
  return compact.replace(/^ECO(?=\d{6}$)/, "ECO-");
}

export default function OrderTrackingScreen() {
  useLocale();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderNumber?: string; email?: string }>();
  const savedEmail = useUserStore((state) => state.email) ?? "";
  const initialOrder = normalizeOrderNumber(params.orderNumber ?? "");
  const initialEmail = (params.email ?? savedEmail).trim().toLowerCase();
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [email, setEmail] = useState(initialEmail);
  const [formError, setFormError] = useState<string>();
  const [lookup, setLookup] = useState<{ orderNumber: string; email: string } | undefined>(
    initialOrder && initialEmail ? { orderNumber: initialOrder, email: initialEmail } : undefined,
  );

  const query = useQuery({
    queryKey: ["order-tracking", lookup?.orderNumber, lookup?.email],
    queryFn: () => getOrderTracking(lookup!.orderNumber, lookup!.email),
    enabled: Boolean(lookup),
    retry: 1,
  });
  const order = query.data?.order;
  const currentStep = Math.max(0, Math.min(3, order?.step ?? 0));
  const createdAt = order ? new Intl.DateTimeFormat(currentLocale(), { dateStyle: "long" }).format(new Date(order.created_at)) : "";

  const submitLookup = () => {
    const normalizedOrder = normalizeOrderNumber(orderNumber);
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^ECO-\d{6}$/.test(normalizedOrder)) {
      setFormError(msg("orderTracking.enterANumberInTheFormatEcoXxxxxx"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError(msg("orderTracking.enterTheEmailAddressUsedForTheOrder"));
      return;
    }
    setFormError(undefined);
    setOrderNumber(normalizedOrder);
    setEmail(normalizedEmail);
    setLookup({ orderNumber: normalizedOrder, email: normalizedEmail });
  };

  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <AnimatedPressable accessibilityLabel={msg("addresses.back")} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color={palette.ink} name="arrow-back" size={23} />
          </AnimatedPressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{msg("orderTracking.trackMyOrderUppercase")}</Text>
            <Text style={styles.headerSubtitle}>{msg("orderTracking.realTimeUpdates")}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons color={palette.greenDark} name="navigate-outline" size={21} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            order ? (
              <RefreshControl
                colors={[palette.green]}
                onRefresh={() => void query.refetch()}
                refreshing={query.isRefetching}
                tintColor={palette.greenDark}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>{msg("orderTracking.deliveryTrackingUppercase")}</Text>
            <Text style={styles.title}>{msg("orderTracking.whereIsMyOrder")}</Text>
            <Text style={styles.subtitle}>
              {msg("orderTracking.checkItsProgressUsingYourOrderNumberAndEmailAddress")}</Text>
          </View>

          <View style={styles.searchCard}>
            <Text style={styles.fieldLabel}>{msg("orderConfirmation.orderNumberUppercase")}</Text>
            <View style={styles.inputWrap}>
              <Ionicons color={palette.greenDark} name="receipt-outline" size={19} />
              <TextInput
                accessibilityLabel={msg("orderTracking.orderNumber")}
                accessibilityHint={msg("orderTracking.enterTheNumberFromYourOrderConfirmation")}
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={(value) => { setOrderNumber(value); setFormError(undefined); }}
                placeholder="ECO-XXXXXX"
                placeholderTextColor="#969C97"
                returnKeyType="next"
                style={styles.input}
                value={orderNumber}
              />
            </View>
            <Text style={[styles.fieldLabel, styles.emailLabel]}>{msg("orderTracking.emailAddressUppercase")}</Text>
            <View style={styles.inputWrap}>
              <Ionicons color={palette.greenDark} name="mail-outline" size={19} />
              <TextInput
                accessibilityLabel={msg("orderTracking.orderEmailAddress")}
                accessibilityHint={msg("orderTracking.enterTheEmailAddressYouUsedForYourOrder")}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={(value) => { setEmail(value); setFormError(undefined); }}
                onSubmitEditing={submitLookup}
                placeholder={msg("common.emailExample")}
                placeholderTextColor="#969C97"
                returnKeyType="search"
                style={styles.input}
                value={email}
              />
            </View>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            <AnimatedPressable
              accessibilityLabel={msg("orderTracking.findOrder")}
              accessibilityState={{ busy: query.isFetching }}
              disabled={query.isFetching}
              onPress={submitLookup}
              style={styles.searchButton}
            >
              {query.isFetching ? (
                <ActivityIndicator color={palette.white} size="small" />
              ) : (
                <>
                  <Text style={styles.searchButtonText}>{msg("orderTracking.trackOrderUppercase")}</Text>
                  <View style={styles.searchArrow}>
                    <Ionicons color={palette.ink} name="arrow-forward" size={17} />
                  </View>
                </>
              )}
            </AnimatedPressable>
          </View>

          {query.isError ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <Ionicons color="#B52B36" name="alert-circle-outline" size={22} />
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>{msg("orderTracking.orderNotFound")}</Text>
                <Text style={styles.errorMessage}>
                  {query.error instanceof Error ? localizedError(query.error) : msg("orderTracking.checkYourDetailsAndTryAgain")}
                </Text>
              </View>
            </View>
          ) : null}

          {order ? (
            <>
              {order.items.filter(item => item.fulfillment_type === "PREORDER").map((item, index) => (
                <View key={`${item.slug}-${index}`}><Text>{item.name}</Text><PreorderNotice item={item} /></View>
              ))}
              <View style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderLabel}>{msg("orderTracking.orderUppercase")}</Text>
                    <Text selectable style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.orderDate}>{msg("orderTracking.placedOn")}{createdAt}</Text>
                  </View>
                  <View style={[styles.statusBadge, order.status === "cancelled" && styles.cancelledBadge]}>
                    <View style={[styles.statusDot, order.status === "cancelled" && styles.cancelledDot]} />
                    <Text style={[styles.statusText, order.status === "cancelled" && styles.cancelledText]}>
                      {orderStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDivider} />
                <View style={styles.orderMeta}>
                  <View>
                    <Text style={styles.metaLabel}>{msg("orderTracking.totalUppercase")}</Text>
                    <Text style={styles.metaValue}>{money(order.total)}</Text>
                  </View>
                  <View style={styles.metaRight}>
                    <Text style={styles.metaLabel}>{msg("orderTracking.itemsUppercase")}</Text>
                    <Text style={styles.metaValue}>{order.items.length}</Text>
                  </View>
                </View>
                {order.tracking_number ? (
                  <View style={styles.trackingNumber}>
                    <Ionicons color={palette.greenDark} name="barcode-outline" size={20} />
                    <View style={styles.trackingNumberCopy}>
                      <Text style={styles.metaLabel}>{msg("orderTracking.trackingNumberUppercase")}</Text>
                      <Text selectable style={styles.trackingNumberValue}>{order.tracking_number}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.eyebrow}>{msg("orderTracking.progressUppercase")}</Text>
                  <Text style={styles.progressTitle}>{msg("orderTracking.yourDeliveryStatus")}</Text>
                </View>
                <Text style={styles.progressCount}>{currentStep + 1} / 4</Text>
              </View>

              <View style={styles.timeline}>
                {steps.map((item, index) => {
                  const complete = order.status !== "cancelled" && index < currentStep;
                  const active = order.status !== "cancelled" && index === currentStep;
                  return (
                    <View key={item.title} style={styles.timelineRow}>
                      <View style={styles.rail}>
                        {index < steps.length - 1 ? (
                          <View style={[styles.line, index < currentStep && styles.lineComplete]} />
                        ) : null}
                        <View style={[styles.stepIcon, (complete || active) && styles.stepIconActive]}>
                          <Ionicons
                            color={complete || active ? palette.white : "#939994"}
                            name={complete ? "checkmark" : item.icon}
                            size={18}
                          />
                        </View>
                      </View>
                      <View style={styles.stepCopy}>
                        <Text style={[styles.stepTitle, !complete && !active && styles.stepTitlePending]}>
                          {item.title}
                        </Text>
                        <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
                      </View>
                      {active ? <Text style={styles.currentBadge}>{msg("orderConfirmation.inProgressUppercase")}</Text> : null}
                    </View>
                  );
                })}
              </View>

              {order.customer.address ? (
                <View style={styles.deliveryCard}>
                  <View style={styles.deliveryIcon}>
                    <Ionicons color={palette.greenDark} name="location-outline" size={20} />
                  </View>
                  <View style={styles.deliveryCopy}>
                    <Text style={styles.deliveryTitle}>{msg("orderTracking.deliveryAddress")}</Text>
                    <Text style={styles.deliveryText}>{order.customer.address}, {order.customer.city}</Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E0E4E0" },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#DDE2DE", borderRadius: 22, backgroundColor: palette.white },
  headerCopy: { alignItems: "center" },
  headerTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 16, letterSpacing: -0.2 },
  headerSubtitle: { marginTop: 3, color: palette.muted, fontFamily: typography.medium, fontSize: 9 },
  headerIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#EAF8EE" },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 18 },
  intro: { paddingTop: 8, paddingBottom: 20 },
  eyebrow: { color: palette.greenDark, fontFamily: typography.black, fontSize: 8.5, letterSpacing: 1.4 },
  title: { marginTop: 8, color: palette.ink, fontFamily: typography.black, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  subtitle: { maxWidth: 390, marginTop: 7, color: palette.muted, fontFamily: typography.regular, fontSize: 12, lineHeight: 19 },
  searchCard: { padding: 16, borderWidth: 1, borderColor: "#DEE3DF", borderRadius: 18, backgroundColor: "#F8FAF8" },
  fieldLabel: { marginBottom: 7, color: palette.ink, fontFamily: typography.black, fontSize: 8, letterSpacing: 0.9 },
  emailLabel: { marginTop: 14 },
  inputWrap: { minHeight: 52, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D7DDD8", borderRadius: 13, backgroundColor: palette.white },
  input: { minWidth: 0, flex: 1, minHeight: 50, marginLeft: 10, color: palette.ink, fontFamily: typography.semibold, fontSize: 12 },
  errorText: { marginTop: 9, color: "#B52B36", fontFamily: typography.semibold, fontSize: 9.5 },
  searchButton: { minHeight: 56, marginTop: 15, paddingLeft: 17, paddingRight: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, backgroundColor: palette.ink },
  searchButtonText: { color: palette.white, fontFamily: typography.black, fontSize: 10, letterSpacing: 0.3 },
  searchArrow: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: palette.green },
  errorCard: { marginTop: 14, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F1C2C6", borderRadius: 15, backgroundColor: "#FFF5F6" },
  errorCopy: { minWidth: 0, flex: 1, marginLeft: 10 },
  errorTitle: { color: "#992631", fontFamily: typography.black, fontSize: 11 },
  errorMessage: { marginTop: 3, color: "#7F4A50", fontFamily: typography.regular, fontSize: 9.5, lineHeight: 14 },
  orderCard: { marginTop: 18, padding: 17, borderWidth: 1, borderColor: "#DDE4DE", borderRadius: 19, backgroundColor: palette.white },
  orderTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  orderLabel: { color: palette.greenDark, fontFamily: typography.black, fontSize: 8, letterSpacing: 1.1 },
  orderNumber: { marginTop: 5, color: palette.ink, fontFamily: typography.black, fontSize: 19 },
  orderDate: { marginTop: 5, color: palette.muted, fontFamily: typography.medium, fontSize: 9 },
  statusBadge: { minHeight: 27, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", borderRadius: 14, backgroundColor: "#EAF8EE" },
  statusDot: { width: 6, height: 6, marginRight: 6, borderRadius: 3, backgroundColor: palette.green },
  statusText: { color: palette.greenDark, fontFamily: typography.black, fontSize: 7.5, textTransform: "uppercase" },
  cancelledBadge: { backgroundColor: "#FDECEC" },
  cancelledDot: { backgroundColor: "#B52B36" },
  cancelledText: { color: "#B52B36" },
  orderDivider: { height: 1, marginVertical: 15, backgroundColor: "#E8ECE9" },
  orderMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaRight: { alignItems: "flex-end" },
  metaLabel: { color: palette.muted, fontFamily: typography.black, fontSize: 7.5, letterSpacing: 0.8 },
  metaValue: { marginTop: 4, color: palette.ink, fontFamily: typography.black, fontSize: 15 },
  trackingNumber: { marginTop: 15, padding: 12, flexDirection: "row", alignItems: "center", borderRadius: 13, backgroundColor: "#EAF8EE" },
  trackingNumberCopy: { marginLeft: 9 },
  trackingNumberValue: { marginTop: 3, color: palette.greenDark, fontFamily: typography.black, fontSize: 11 },
  progressHeader: { marginTop: 26, marginBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  progressTitle: { marginTop: 5, color: palette.ink, fontFamily: typography.black, fontSize: 18 },
  progressCount: { color: palette.greenDark, fontFamily: typography.black, fontSize: 10 },
  timeline: { paddingHorizontal: 15, paddingVertical: 7, borderWidth: 1, borderColor: "#DEE3DF", borderRadius: 19, backgroundColor: palette.white },
  timelineRow: { minHeight: 76, flexDirection: "row", alignItems: "center" },
  rail: { width: 40, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  line: { position: "absolute", top: "50%", bottom: -1, width: 2, backgroundColor: "#E3E7E4" },
  lineComplete: { backgroundColor: palette.green },
  stepIcon: { zIndex: 1, width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E0E5E1", borderRadius: 18, backgroundColor: "#F3F5F3" },
  stepIconActive: { borderColor: palette.greenDark, backgroundColor: palette.greenDark },
  stepCopy: { minWidth: 0, flex: 1, marginLeft: 10 },
  stepTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 12 },
  stepTitlePending: { color: "#777D78", fontFamily: typography.bold },
  stepSubtitle: { marginTop: 4, color: palette.muted, fontFamily: typography.regular, fontSize: 9, lineHeight: 13 },
  currentBadge: { color: palette.greenDark, fontFamily: typography.black, fontSize: 7, letterSpacing: 0.5 },
  deliveryCard: { marginTop: 14, padding: 14, flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: "#F3F8F4" },
  deliveryIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: palette.white },
  deliveryCopy: { minWidth: 0, flex: 1, marginLeft: 11 },
  deliveryTitle: { color: palette.ink, fontFamily: typography.bold, fontSize: 10.5 },
  deliveryText: { marginTop: 4, color: palette.muted, fontFamily: typography.regular, fontSize: 9.5, lineHeight: 14 },
});
