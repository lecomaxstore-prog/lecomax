import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { BrandLogo } from "@/components/brand-logo";
import { palette, typography } from "@/constants/theme";
import { money } from "@/lib/format";
import { useUserStore } from "@/stores/user";

const TRACKING_STEPS = [
  {
    icon: "checkmark" as const,
    title: "Commande confirmée",
    subtitle: "Votre commande a été enregistrée",
    active: true,
  },
  {
    icon: "cube-outline" as const,
    title: "Préparation",
    subtitle: "Notre équipe prépare vos articles",
    active: false,
  },
  {
    icon: "car-outline" as const,
    title: "Expédition",
    subtitle: "Vous recevrez votre numéro de suivi",
    active: false,
  },
];

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    orderNumber?: string;
    total?: string;
    payment?: "cod" | "paypal";
    email?: string;
    estimatedDays?: string;
  }>();
  const customerName = useUserStore((state) => state.name);
  const successScale = useSharedValue(0);

  useEffect(() => {
    successScale.set(
      withDelay(
        100,
        withSequence(
          withSpring(1.1, { damping: 10, stiffness: 190 }),
          withSpring(1, { damping: 14, stiffness: 220 }),
        ),
      ),
    );
  }, [successScale]);

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const total = Number(params.total || 0);
  const orderNumber = params.orderNumber || "LECOMAX";
  const firstName = customerName?.trim().split(/\s+/)[0];
  const isPayOnDelivery = params.payment !== "paypal";

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <AnimatedPressable
          accessibilityLabel="Retour à l’accueil"
          onPress={() => router.replace("/")}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={21} color={palette.ink} />
        </AnimatedPressable>
        <BrandLogo header />
        <View style={styles.secureHeaderIcon}>
          <Ionicons name="shield-checkmark-outline" size={20} color={palette.greenDark} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 116 + Math.max(insets.bottom, 12) },
        ]}
      >
        <Animated.View entering={FadeIn.duration(320)} style={styles.hero}>
          <View style={styles.heroArtwork}>
            <Image
              accessibilityLabel="Un sac et un colis premium dans une cour marocaine lumineuse"
              contentFit="cover"
              contentPosition="center"
              source={require("../../assets/images/order-confirmation/merci-confirmation-v4.webp")}
              style={styles.heroImage}
              transition={300}
            />
            <LinearGradient
              colors={["rgba(12,28,17,0)", "rgba(12,28,17,0.16)"]}
              locations={[0.48, 1]}
              pointerEvents="none"
              style={styles.heroImageTint}
            />
            <View pointerEvents="none" style={styles.heroImageBorder} />
            <Animated.View style={[styles.successIconOuter, successStyle]}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={31} color={palette.white} />
              </View>
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInUp.delay(180).duration(360)} style={styles.eyebrow}>
            COMMANDE VALIDÉE
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(230).duration(360)} style={styles.heroTitle}>
            Merci{firstName ? `, ${firstName}` : ""} !
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(280).duration(360)} style={styles.heroSubtitle}>
            Votre commande est confirmée. Nous vous tiendrons informé à chaque étape.
          </Animated.Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(420)} style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <View style={styles.orderNumberBlock}>
              <Text style={styles.label}>NUMÉRO DE COMMANDE</Text>
              <Text selectable style={styles.orderNumber}>
                {orderNumber}
              </Text>
            </View>
            <View style={styles.confirmedPill}>
              <View style={styles.confirmedDot} />
              <Text style={styles.confirmedPillText}>CONFIRMÉE</Text>
            </View>
          </View>

          <View style={styles.summaryBody}>
            <SummaryRow
              icon="wallet-outline"
              label="Mode de paiement"
              value={isPayOnDelivery ? "À la livraison" : "PayPal"}
            />
            <SummaryRow
              icon="calendar-outline"
              label="Livraison estimée"
              value={params.estimatedDays || "2–5 jours ouvrables"}
            />
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>
                  {isPayOnDelivery ? "Total à payer" : "Total payé"}
                </Text>
                <Text style={styles.totalNote}>
                  Taxes et frais de livraison inclus
                </Text>
              </View>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>
        </Animated.View>

        {params.email ? (
          <Animated.View entering={FadeInDown.delay(390).duration(420)} style={styles.emailCard}>
            <View style={styles.emailIcon}>
              <Ionicons name="mail-outline" size={19} color={palette.greenDark} />
            </View>
            <View style={styles.emailCopy}>
              <Text style={styles.emailTitle}>Confirmation envoyée</Text>
              <Text numberOfLines={1} style={styles.emailAddress}>
                {params.email}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={palette.greenDark} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(460).duration(420)} style={styles.trackingSection}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.label}>SUIVI DE LA COMMANDE</Text>
              <Text style={styles.sectionTitle}>Prochaine étape : préparation</Text>
            </View>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>1 / 3</Text>
            </View>
          </View>

          <View style={styles.timelineCard}>
            {TRACKING_STEPS.map((item, index) => (
              <View key={item.title} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  {index < TRACKING_STEPS.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                  <View style={[styles.timelineIcon, item.active && styles.timelineIconActive]}>
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={item.active ? palette.white : "#8A918C"}
                    />
                  </View>
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={[styles.timelineTitle, !item.active && styles.timelineTitlePending]}>
                    {item.title}
                  </Text>
                  <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                </View>
                {item.active ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentText}>EN COURS</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(530).duration(420)}>
          <AnimatedPressable
            accessibilityLabel="Contacter l’assistance au sujet de cette commande"
            onPress={() =>
              void Linking.openURL(
                `mailto:contact@lecomax.com?subject=${encodeURIComponent(`Question sur la commande ${orderNumber}`)}`,
              )
            }
            style={styles.helpRow}
          >
            <View style={styles.helpIcon}>
              <Ionicons name="headset-outline" size={20} color={palette.greenDark} />
            </View>
            <View style={styles.helpCopy}>
              <Text style={styles.helpTitle}>Besoin d’aide ?</Text>
              <Text style={styles.helpText}>Notre équipe vous accompagne pour cette commande.</Text>
            </View>
            <View style={styles.helpArrow}>
              <Ionicons name="arrow-forward" size={16} color={palette.white} />
            </View>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <AnimatedPressable
          accessibilityLabel="Retour à l’accueil"
          onPress={() => router.replace("/")}
          style={styles.homeButton}
        >
          <Ionicons name="home-outline" size={18} color={palette.ink} />
          <Text style={styles.homeButtonText}>Accueil</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityLabel="Suivre ma commande"
          onPress={() =>
            router.push({
              pathname: "/order-tracking",
              params: {
                orderNumber,
                ...(params.email ? { email: params.email } : {}),
              },
            })
          }
          style={styles.trackButton}
        >
          <Text style={styles.trackButtonText}>Suivre ma commande</Text>
          <View style={styles.trackArrow}>
            <Ionicons name="arrow-forward" size={17} color={palette.ink} />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={17} color={palette.greenDark} />
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAF8" },
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E9E7",
    backgroundColor: palette.white,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6E9E7",
    borderRadius: 21,
    backgroundColor: palette.white,
  },
  secureHeaderIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9EFDE",
    borderRadius: 21,
    backgroundColor: "#F0FAF3",
  },
  scrollContent: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  hero: { alignItems: "center" },
  heroArtwork: {
    width: "100%",
    aspectRatio: 3 / 2,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 7,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    backgroundColor: "#EEE6DA",
  },
  heroImageBorder: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: "rgba(20, 44, 28, 0.13)",
    borderRadius: 22,
  },
  heroImageTint: {
    position: "absolute",
    inset: 0,
    borderRadius: 22,
  },
  successIconOuter: {
    position: "absolute",
    bottom: -25,
    left: "50%",
    width: 64,
    height: 64,
    marginLeft: -32,
    padding: 5,
    borderWidth: 4,
    borderColor: palette.white,
    borderRadius: 32,
    backgroundColor: "#DDF7E1",
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 7,
  },
  successIconInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: palette.green,
  },
  eyebrow: {
    marginTop: 39,
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  heroTitle: {
    marginTop: 8,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
  },
  heroSubtitle: {
    maxWidth: 340,
    marginTop: 8,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
  },
  orderCard: {
    marginTop: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DFE4E0",
    borderRadius: 22,
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  orderCardHeader: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2F0E5",
    backgroundColor: "#F0FAF3",
  },
  orderNumberBlock: { flex: 1 },
  label: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.25,
  },
  orderNumber: {
    marginTop: 5,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 19,
    letterSpacing: 0.25,
  },
  confirmedPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8EACF",
    borderRadius: 20,
    backgroundColor: palette.white,
  },
  confirmedDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
    backgroundColor: palette.green,
  },
  confirmedPillText: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.7,
  },
  summaryBody: { paddingHorizontal: 18, paddingVertical: 17 },
  summaryRow: { marginBottom: 13, flexDirection: "row", alignItems: "center" },
  summaryIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F6F3",
  },
  summaryCopy: { marginLeft: 11, flex: 1 },
  summaryLabel: {
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  summaryValue: {
    marginTop: 3,
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  divider: { height: 1, marginVertical: 5, marginBottom: 16, backgroundColor: "#E9ECEA" },
  totalRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  totalLabel: { color: palette.ink, fontFamily: typography.black, fontSize: 15 },
  totalNote: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  totalValue: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 25,
    letterSpacing: -0.6,
  },
  emailCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDEFE1",
    borderRadius: 17,
    backgroundColor: "#F0FAF3",
  },
  emailIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: palette.white,
  },
  emailCopy: { marginHorizontal: 11, flex: 1 },
  emailTitle: {
    color: palette.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  emailAddress: {
    marginTop: 3,
    color: palette.ink,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  trackingSection: { marginTop: 26 },
  sectionHeading: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    marginTop: 5,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 15,
  },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#EAF7ED",
  },
  progressText: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 9,
  },
  timelineCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#DFE4E0",
    borderRadius: 20,
    backgroundColor: palette.white,
  },
  timelineRow: { minHeight: 72, flexDirection: "row", alignItems: "center" },
  timelineRail: {
    width: 40,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    position: "absolute",
    top: "50%",
    bottom: -1,
    width: 2,
    backgroundColor: "#E1E6E2",
  },
  timelineIcon: {
    width: 34,
    height: 34,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E9E6",
    borderRadius: 17,
    backgroundColor: "#F3F5F4",
  },
  timelineIconActive: { borderColor: palette.green, backgroundColor: palette.green },
  timelineCopy: { marginLeft: 10, flex: 1 },
  timelineTitle: { color: palette.ink, fontFamily: typography.black, fontSize: 12 },
  timelineTitlePending: { color: "#727773", fontFamily: typography.bold },
  timelineSubtitle: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  currentPill: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#EAF7ED",
  },
  currentText: {
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.55,
  },
  helpRow: {
    marginTop: 16,
    minHeight: 76,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE5DE",
    borderRadius: 18,
    backgroundColor: palette.white,
  },
  helpIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#EAF8EE",
  },
  helpCopy: { minWidth: 0, flex: 1, marginHorizontal: 12 },
  helpTitle: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
  },
  helpText: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9.5,
    lineHeight: 14,
  },
  helpArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: palette.ink,
  },
  bottomBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: "#E1E5E2",
    backgroundColor: palette.white,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: -7 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 16,
  },
  homeButton: {
    height: 56,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCE1DD",
    borderRadius: 17,
    backgroundColor: palette.white,
  },
  homeButtonText: {
    marginLeft: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10.5,
  },
  trackButton: {
    height: 56,
    flex: 1,
    paddingLeft: 18,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 17,
    backgroundColor: palette.green,
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  trackButtonText: {
    marginLeft: 5,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10.5,
  },
  trackArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.74)",
  },
});
