import Ionicons from "@expo/vector-icons/Ionicons";
import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { BrandLogo } from "@/components/brand-logo";
import { palette, typography } from "@/constants/theme";
import { useProducts } from "@/hooks/use-catalog";
import { triggerSuccessHaptic, triggerWarningHaptic } from "@/services/haptics";
import type { Product } from "@/types/commerce";

type ScanFeedback = {
  type: "error" | "success";
  title: string;
  message: string;
  code?: string;
};

function normalizeCode(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function productSlugFromLecomaxUrl(value: string) {
  try {
    const url = new URL(value);
    if (!/(^|\.)lecomax\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) || null;
  } catch {
    const deepLink = value.match(/^lecomax:\/\/(?:product\/)?([^/?#]+)/i);
    return deepLink?.[1] || null;
  }
}

function findProductByCode(products: Product[], rawCode: string) {
  const code = normalizeCode(rawCode);
  return products.find((product) => {
    const identifiers = [
      product.barcode,
      product.sku,
      product.id,
      product.slug,
      ...(product.tags ?? [])
        .filter((tag) => /^(?:barcode|ean|upc|sku):/i.test(tag))
        .map((tag) => tag.split(":").slice(1).join(":")),
    ]
      .filter((value): value is string => Boolean(value))
      .map(normalizeCode);
    return identifiers.includes(code);
  });
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback>();

  const resetScanner = useCallback(() => {
    setFeedback(undefined);
    setScanned(false);
  }, []);

  const handleBarcode = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);
      void triggerSuccessHaptic();

      const urlSlug = productSlugFromLecomaxUrl(data);
      if (urlSlug) {
        setFeedback({
          type: "success",
          title: "Produit reconnu",
          message: "Ouverture de la fiche produit…",
        });
        router.replace({
          pathname: "/product/[slug]",
          params: { slug: urlSlug, origin: "scanner" },
        });
        return;
      }

      const matchedProduct = findProductByCode(products, data);
      if (matchedProduct) {
        setFeedback({
          type: "success",
          title: "Produit trouvé",
          message: matchedProduct.name,
        });
        router.replace({
          pathname: "/product/[slug]",
          params: {
            slug: matchedProduct.slug,
            origin: "scanner",
            parentCategory: matchedProduct.category,
          },
        });
        return;
      }

      void triggerWarningHaptic();
      setFeedback({
        type: "error",
        title: "Code non reconnu",
        message: productsLoading
          ? "Le catalogue est encore en cours de chargement. Réessayez dans un instant."
          : "Ce code ne correspond pas encore à un produit Lecomax.",
        code: data,
      });
    },
    [products, productsLoading, scanned],
  );

  if (!permission) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={palette.green} size="large" />
        <Text style={styles.loadingText}>Préparation du scanner…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.permissionScreen,
          { paddingTop: Math.max(insets.top, 18) },
        ]}
      >
        <View style={styles.permissionHeader}>
          <View style={styles.permissionHeaderSpacer} />
          <BrandLogo header />
          <AnimatedPressable
            accessibilityLabel="Fermer"
            onPress={() => router.back()}
            style={styles.topButton}
          >
            <Ionicons name="close" size={22} color={palette.ink} />
          </AnimatedPressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.permissionScroll}
        >
          <Animated.View
            entering={FadeInUp.duration(380)}
            style={styles.permissionContent}
          >
            <View style={styles.scannerVisual}>
              <View style={styles.scannerVisualRing} />
              <View style={styles.permissionIconOuter}>
                <View style={styles.permissionIcon}>
                  <Ionicons name="scan-outline" size={35} color={palette.ink} />
                </View>
              </View>
              <View style={styles.visualBadge}>
                <Ionicons name="sparkles" size={12} color={palette.ink} />
              </View>
            </View>
            <Text style={styles.permissionEyebrow}>SCANNER LECOMAX</Text>
            <Text style={styles.permissionTitle}>
              Trouvez un produit en un scan.
            </Text>
            <Text style={styles.permissionText}>
              Pointez la caméra vers un code-barres ou un QR code pour ouvrir
              immédiatement sa fiche.
            </Text>

            <View style={styles.permissionBenefits}>
              <View style={styles.permissionBenefit}>
                <View style={styles.benefitIcon}>
                  <Ionicons
                    name="flash-outline"
                    size={17}
                    color={palette.greenDark}
                  />
                </View>
                <View style={styles.benefitCopy}>
                  <Text style={styles.benefitTitle}>
                    Reconnaissance instantanée
                  </Text>
                  <Text style={styles.benefitText}>
                    QR, EAN, UPC et Code 128
                  </Text>
                </View>
              </View>
              <View style={styles.benefitDivider} />
              <View style={styles.permissionBenefit}>
                <View style={styles.benefitIcon}>
                  <Ionicons
                    name="eye-off-outline"
                    size={17}
                    color={palette.greenDark}
                  />
                </View>
                <View style={styles.benefitCopy}>
                  <Text style={styles.benefitTitle}>
                    Respect de votre vie privée
                  </Text>
                  <Text style={styles.benefitText}>
                    Aucune photo n’est enregistrée
                  </Text>
                </View>
              </View>
            </View>

            <AnimatedPressable
              accessibilityLabel={
                permission.canAskAgain
                  ? "Autoriser la caméra"
                  : "Ouvrir les réglages"
              }
              onPress={() => {
                if (permission.canAskAgain) void requestPermission();
                else void Linking.openSettings();
              }}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>
                {permission.canAskAgain
                  ? "AUTORISER LA CAMÉRA"
                  : "OUVRIR LES RÉGLAGES"}
              </Text>
              <View style={styles.permissionButtonArrow}>
                <Ionicons name="arrow-forward" size={18} color={palette.ink} />
              </View>
            </AnimatedPressable>
            <View style={styles.privacyNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={palette.greenDark}
              />
              <Text style={styles.privacyText}>
                Autorisation modifiable à tout moment dans vos réglages.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      <CameraView
        facing="back"
        enableTorch={torchEnabled}
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        onMountError={({ message }) => {
          setScanned(true);
          setFeedback({
            type: "error",
            title: "Caméra indisponible",
            message: message || "Impossible de démarrer la caméra.",
          });
        }}
      />

      <View style={styles.cameraShade} pointerEvents="box-none">
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={[
            styles.cameraHeader,
            { paddingTop: Math.max(insets.top, 14) },
          ]}
        >
          <AnimatedPressable
            accessibilityLabel="Fermer"
            onPress={() => router.back()}
            style={styles.cameraButton}
          >
            <Ionicons name="close" size={22} color={palette.white} />
          </AnimatedPressable>
          <View style={styles.cameraHeading}>
            <Text style={styles.cameraEyebrow}>LECOMAX</Text>
            <Text style={styles.cameraTitle}>Scanner un produit</Text>
          </View>
          <AnimatedPressable
            accessibilityLabel={
              torchEnabled ? "Éteindre la lampe" : "Allumer la lampe"
            }
            onPress={() => setTorchEnabled((enabled) => !enabled)}
            style={[
              styles.cameraButton,
              torchEnabled && styles.cameraButtonActive,
            ]}
          >
            <Ionicons
              name={torchEnabled ? "flash" : "flash-outline"}
              size={21}
              color={torchEnabled ? palette.ink : palette.white}
            />
          </AnimatedPressable>
        </Animated.View>

        <View style={styles.scanArea}>
          <Animated.View
            entering={FadeIn.delay(140).duration(400)}
            style={styles.frame}
          >
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            {!scanned ? <Animated.View style={styles.scanLine} /> : null}
          </Animated.View>
          {!feedback ? (
            <View style={styles.instructionPill}>
              <Ionicons
                name="barcode-outline"
                size={16}
                color={palette.white}
              />
              <Text style={styles.instructionText}>
                Placez le code au centre du cadre
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.bottomArea,
            { paddingBottom: Math.max(insets.bottom, 18) },
          ]}
        >
          {feedback ? (
            <Animated.View
              entering={FadeInUp.duration(300)}
              style={styles.feedbackCard}
            >
              <View
                style={[
                  styles.feedbackIcon,
                  feedback.type === "error" && styles.feedbackIconError,
                ]}
              >
                <Ionicons
                  name={
                    feedback.type === "error" ? "alert-outline" : "checkmark"
                  }
                  size={21}
                  color={feedback.type === "error" ? palette.red : palette.ink}
                />
              </View>
              <View style={styles.feedbackCopy}>
                <Text style={styles.feedbackTitle}>{feedback.title}</Text>
                <Text numberOfLines={2} style={styles.feedbackMessage}>
                  {feedback.message}
                </Text>
              </View>
              {feedback.type === "error" ? (
                <AnimatedPressable
                  accessibilityLabel="Scanner à nouveau"
                  onPress={resetScanner}
                  style={styles.retryIcon}
                >
                  <Ionicons name="refresh" size={19} color={palette.ink} />
                </AnimatedPressable>
              ) : (
                <ActivityIndicator color={palette.greenDark} />
              )}
            </Animated.View>
          ) : (
            <View style={styles.supportedRow}>
              <Text style={styles.supportedText}>QR</Text>
              <View style={styles.supportedDot} />
              <Text style={styles.supportedText}>EAN</Text>
              <View style={styles.supportedDot} />
              <Text style={styles.supportedText}>UPC</Text>
              <View style={styles.supportedDot} />
              <Text style={styles.supportedText}>CODE 128</Text>
            </View>
          )}

          {feedback?.type === "error" && feedback.code ? (
            <AnimatedPressable
              accessibilityLabel="Rechercher ce code"
              onPress={() =>
                router.replace({
                  pathname: "/search",
                  params: { scanned: feedback.code },
                })
              }
              style={styles.searchCodeButton}
            >
              <Text style={styles.searchCodeText}>RECHERCHER CE CODE</Text>
              <Ionicons name="search-outline" size={17} color={palette.white} />
            </AnimatedPressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.ink,
  },
  loadingText: {
    marginTop: 14,
    color: "#AEB2AF",
    fontFamily: typography.medium,
    fontSize: 11,
  },
  permissionScreen: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: palette.white,
  },
  permissionHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  permissionHeaderSpacer: { width: 44 },
  permissionScroll: { flexGrow: 1, paddingBottom: 30 },
  topButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E1E5E2",
    borderRadius: 22,
    backgroundColor: "#F7F8F7",
  },
  permissionContent: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 42,
  },
  scannerVisual: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 38,
    backgroundColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  scannerVisualRing: {
    position: "absolute",
    top: -32,
    right: -27,
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: "rgba(62,207,76,0.34)",
    borderRadius: 50,
    backgroundColor: "rgba(62,207,76,0.09)",
  },
  permissionIconOuter: {
    width: 88,
    height: 88,
    padding: 7,
    borderRadius: 28,
    backgroundColor: "rgba(62,207,76,0.18)",
  },
  permissionIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: palette.green,
  },
  visualBadge: {
    position: "absolute",
    right: 21,
    bottom: 20,
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: palette.ink,
    borderRadius: 14,
    backgroundColor: palette.white,
  },
  permissionEyebrow: {
    marginTop: 27,
    color: palette.greenDark,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  permissionTitle: {
    maxWidth: 350,
    marginTop: 9,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  permissionText: {
    maxWidth: 340,
    marginTop: 10,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  permissionBenefits: {
    width: "100%",
    marginTop: 25,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E0E5E1",
    borderRadius: 17,
    backgroundColor: "#FAFBFA",
  },
  permissionBenefit: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },
  benefitDivider: { height: 1, marginLeft: 47, backgroundColor: "#E6E9E7" },
  benefitIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#EAF7ED",
  },
  benefitCopy: { marginLeft: 11, flex: 1 },
  benefitTitle: {
    color: palette.ink,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  benefitText: {
    marginTop: 3,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  permissionButton: {
    width: "100%",
    height: 56,
    marginTop: 18,
    paddingLeft: 20,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    backgroundColor: palette.green,
    shadowColor: palette.greenDark,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 13,
    elevation: 5,
  },
  permissionButtonText: {
    marginLeft: 7,
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 1,
  },
  permissionButtonArrow: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.78)",
  },
  privacyNote: { marginTop: 16, flexDirection: "row", alignItems: "center" },
  privacyText: {
    marginLeft: 7,
    color: palette.muted,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  cameraScreen: { flex: 1, overflow: "hidden", backgroundColor: palette.ink },
  cameraShade: { flex: 1, backgroundColor: "rgba(0,0,0,0.30)" },
  cameraHeader: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  cameraButtonActive: {
    borderColor: palette.green,
    backgroundColor: palette.green,
  },
  cameraHeading: { alignItems: "center" },
  cameraEyebrow: {
    color: palette.green,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.6,
  },
  cameraTitle: {
    marginTop: 3,
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 14,
  },
  scanArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: {
    width: 274,
    height: 274,
    overflow: "hidden",
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  corner: {
    position: "absolute",
    width: 52,
    height: 52,
    borderColor: palette.green,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 28,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 28,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 28,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 28,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    right: 18,
    left: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: palette.green,
    shadowColor: palette.green,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  instructionPill: {
    marginTop: 24,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  instructionText: {
    marginLeft: 8,
    color: palette.white,
    fontFamily: typography.semibold,
    fontSize: 10,
  },
  bottomArea: { minHeight: 118, paddingHorizontal: 18, paddingTop: 12 },
  supportedRow: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  supportedText: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: typography.bold,
    fontSize: 8,
    letterSpacing: 0.7,
  },
  supportedDot: {
    width: 3,
    height: 3,
    marginHorizontal: 8,
    borderRadius: 2,
    backgroundColor: palette.green,
  },
  feedbackCard: {
    minHeight: 72,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: palette.white,
  },
  feedbackIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: palette.green,
  },
  feedbackIconError: { backgroundColor: "#FFF0F0" },
  feedbackCopy: { marginHorizontal: 11, flex: 1 },
  feedbackTitle: {
    color: palette.ink,
    fontFamily: typography.black,
    fontSize: 12,
  },
  feedbackMessage: {
    marginTop: 4,
    color: palette.muted,
    fontFamily: typography.regular,
    fontSize: 9,
    lineHeight: 13,
  },
  retryIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F3F1",
  },
  searchCodeButton: {
    height: 50,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 14,
    backgroundColor: palette.ink,
  },
  searchCodeText: {
    color: palette.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.9,
  },
});
