import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { triggerErrorHaptic, triggerSuccessHaptic, triggerWarningHaptic } from "@/services/haptics";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextStyle,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAndroidBackInterceptor } from "@/components/android-back-controller";
import { CheckoutProgress } from "@/components/checkout-progress";
import { typography } from "@/constants/theme";
import { ApiError, apiRequest } from "@/lib/api-client";
import { imageUrl, money } from "@/lib/format";
import { getSettings } from "@/services/catalog";
import { validateCoupon, type AppliedCoupon } from "@/services/coupons";
import {
  capturePayPalCheckout,
  createCheckoutRequestId,
  createOrder,
  createPayPalCheckout,
  getCheckoutQuote,
  getPaymentMethods,
  getShippingQuote,
  type CheckoutQuote,
  type PaymentMethod,
  type PayPalCapture,
  type ShippingQuote,
} from "@/services/orders";
import { useCommerceStore } from "@/stores/commerce";
import { useUserStore } from "@/stores/user";
import type { CartLine } from "@/types/commerce";

const C = {
  white: "#FFFFFF",
  ink: "#080808",
  green: "#12B83F",
  greenDark: "#0B7E2B",
  soft: "#F5F6F4",
  border: "#DEDFDC",
  muted: "#686D68",
  red: "#E32636",
  redSoft: "#FFF3F4",
  greenSoft: "#EFFAF2",
  amber: "#8B6310",
  amberSoft: "#FFF8E8",
  disabled: "#E2E3E1",
  disabledText: "#676B67",
} as const;

const MAX_WIDTH = 680;

const emailDomainSuggestions: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "yahoo.co": "yahoo.com",
};

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "L’adresse email est obligatoire")
  .email("Saisissez une adresse email valide, par exemple nom@gmail.com")
  .superRefine((value, context) => {
    const domain = value.split("@")[1]?.toLowerCase();
    const suggestion = domain ? emailDomainSuggestions[domain] : undefined;
    if (!suggestion) return;
    context.addIssue({
      code: "custom",
      message: `Vérifiez le domaine : vouliez-vous écrire @${suggestion} ?`,
    });
  });

const schema = z.object({
  name: z.string().trim().min(2, "Saisissez votre nom complet"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire")
    .refine(
      (value) => /^(?:212|0)[67]\d{8}$/.test(value.replace(/\D/g, "")),
      {
        message:
          "Utilisez un numéro marocain valide : 06, 07, +212 6 ou +212 7",
      },
    ),
  city: z.string().trim().min(2, "Saisissez votre ville"),
  address: z.string().trim().min(8, "Saisissez votre adresse complète"),
  notes: z.string().optional(),
  payment: z.enum(["cod", "paypal"]),
});

type FormData = z.infer<typeof schema>;
type InputName = "name" | "email" | "phone" | "city" | "address";
type StockProblem = {
  slug?: string;
  productName: string;
  explanation: string;
  requestedQuantity?: number;
  availableQuantity?: number;
  color?: string;
};

const deliveryFields: {
  name: InputName;
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "email-address" | "phone-pad";
}[] = [
  {
    name: "name",
    label: "NOM COMPLET",
    placeholder: "Ex. Zakaria Zemzami",
    icon: "person-outline",
  },
  {
    name: "email",
    label: "ADRESSE EMAIL",
    placeholder: "nom@exemple.com",
    icon: "mail-outline",
    keyboardType: "email-address",
  },
  {
    name: "phone",
    label: "TÉLÉPHONE",
    placeholder: "+212 6 00 00 00 00",
    icon: "call-outline",
    keyboardType: "phone-pad",
  },
  {
    name: "city",
    label: "VILLE",
    placeholder: "Ex. Casablanca",
    icon: "business-outline",
  },
  {
    name: "address",
    label: "ADRESSE COMPLÈTE",
    placeholder: "Rue, quartier et code postal",
    icon: "location-outline",
  },
];

function CheckoutHeader({
  paymentStep,
  compact,
  topInset,
  onBack,
}: {
  paymentStep: boolean;
  compact: boolean;
  topInset: number;
  onBack: () => void;
}) {
  return (
    <View style={[styles.header, { paddingTop: Math.max(topInset, 8) }]}>
      <View style={styles.headerRow}>
        <AnimatedPressable
          accessibilityLabel={
            paymentStep ? "Retour à la livraison" : "Retour au panier"
          }
          onPress={onBack}
          style={styles.headerIconButton}
        >
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </AnimatedPressable>
        <View style={styles.headerTitleWrap}>
          <Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={1}
            style={[styles.headerTitle, compact && styles.headerTitleCompact]}
          >
            FINALISER LA COMMANDE
          </Text>
          <View style={styles.headerSecurity}>
            <Ionicons name="lock-closed" size={11} color={C.greenDark} />
            <Text maxFontSizeMultiplier={1.15} style={styles.headerSecurityText}>
              {paymentStep ? "PAIEMENT SÉCURISÉ" : "LIVRAISON SÉCURISÉE"}
            </Text>
          </View>
        </View>
        <View
          accessibilityLabel="Commande protégée"
          style={styles.headerShield}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color={C.green}
          />
        </View>
      </View>
    </View>
  );
}

function SkeletonRows() {
  return (
    <View
      accessibilityLabel="Chargement des moyens de paiement"
      style={styles.skeletonGroup}
    >
      {[0, 1].map((item) => (
        <View key={item} style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonCopy}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
          </View>
          <View style={styles.skeletonRadio} />
        </View>
      ))}
    </View>
  );
}

function StatusBanner({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: "error" | "warning" | "success" | "neutral";
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const icon =
    tone === "error"
      ? "alert-circle"
      : tone === "warning"
        ? "warning"
        : tone === "success"
          ? "checkmark-circle"
          : "information-circle";
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "error" ? "alert" : undefined}
      style={[
        styles.statusBanner,
        tone === "error" && styles.statusError,
        tone === "warning" && styles.statusWarning,
        tone === "success" && styles.statusSuccess,
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={
          tone === "error"
            ? C.red
            : tone === "warning"
              ? C.amber
              : C.greenDark
        }
      />
      <View style={styles.statusCopy}>
        {title ? (
          <Text maxFontSizeMultiplier={1.25} style={styles.statusTitle}>
            {title}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={1.35} style={styles.statusMessage}>
          {message}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <AnimatedPressable
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={styles.statusAction}
        >
          <Text style={styles.statusActionText}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

function StockProblemCard({
  problem,
  onEdit,
  onRemove,
}: {
  problem: StockProblem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View accessibilityRole="alert" style={styles.stockCard}>
      <View style={styles.stockHeadingRow}>
        <View style={styles.stockIcon}>
          <Ionicons name="warning" size={20} color={C.white} />
        </View>
        <View style={styles.stockHeadingCopy}>
          <Text style={styles.stockEyebrow}>ACTION REQUISE</Text>
          <Text style={styles.stockTitle}>STOCK INSUFFISANT</Text>
        </View>
      </View>
      <Text style={styles.stockProduct}>{problem.productName}</Text>
      <Text style={styles.stockExplanation}>{problem.explanation}</Text>
      {problem.availableQuantity !== undefined ? (
        <View style={styles.stockAvailability}>
          <Text style={styles.stockAvailabilityLabel}>QUANTITÉ DISPONIBLE</Text>
          <Text style={styles.stockAvailabilityValue}>
            {problem.availableQuantity}
          </Text>
        </View>
      ) : null}
      <AnimatedPressable
        accessibilityLabel="Modifier le panier"
        onPress={onEdit}
        style={styles.stockPrimary}
      >
        <Ionicons name="create-outline" size={17} color={C.white} />
        <Text style={styles.stockPrimaryText}>MODIFIER LE PANIER</Text>
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityLabel={`Supprimer ${problem.productName} du panier`}
        onPress={onRemove}
        style={styles.stockSecondary}
      >
        <Ionicons name="trash-outline" size={16} color={C.red} />
        <Text style={styles.stockSecondaryText}>SUPPRIMER L’ARTICLE</Text>
      </AnimatedPressable>
    </View>
  );
}

function OrderSummary({
  cart,
  itemCount,
  total,
  expanded,
  quoteLoading,
  quoteReady,
  stockProblem,
  reduceMotion,
  onToggle,
  onEdit,
}: {
  cart: CartLine[];
  itemCount: number;
  total: number;
  expanded: boolean;
  quoteLoading: boolean;
  quoteReady: boolean;
  stockProblem?: StockProblem;
  reduceMotion: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={styles.orderBlock}>
      <View style={styles.orderMetaRow}>
        <View style={styles.orderMetaTitle}>
          <View style={styles.orderBagIcon}>
            <Ionicons name="bag-handle-outline" size={15} color={C.greenDark} />
          </View>
          <Text style={styles.eyebrow}>RÉCAPITULATIF</Text>
        </View>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCount}>
            {itemCount} article{itemCount > 1 ? "s" : ""}
          </Text>
        </View>
      </View>
      <View style={styles.orderTop}>
        <View style={styles.orderTotalCopy}>
          <Text style={styles.orderAmountLabel}>Total à payer</Text>
          <Text
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={styles.orderTotal}
          >
            {money(total)}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityLabel={
            expanded
              ? "Masquer le détail de la commande"
              : "Voir le détail de la commande"
          }
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.orderToggle}
        >
          <Text style={styles.orderToggleText}>
            {expanded ? "MASQUER" : "VOIR LE DÉTAIL"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={C.greenDark}
          />
        </AnimatedPressable>
      </View>

      <View style={styles.orderVerification}>
        {quoteLoading ? (
          <>
            <ActivityIndicator color={C.greenDark} size="small" />
            <Text style={styles.orderVerificationText}>
              Vérification des prix et du stock…
            </Text>
          </>
        ) : quoteReady && !stockProblem ? (
          <>
            <Ionicons
              name="shield-checkmark"
              size={17}
              color={C.greenDark}
            />
            <Text style={styles.orderVerificationOk}>
              Total vérifié par L’ecomax
            </Text>
          </>
        ) : null}
      </View>

      {expanded ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(180)}
          exiting={reduceMotion ? undefined : FadeOut.duration(120)}
          layout={reduceMotion ? undefined : LinearTransition.duration(180)}
          style={styles.orderDetails}
        >
          {cart.map((line) => {
            const affected = stockProblem?.slug === line.product.slug;
            return (
              <View
                key={`${line.product.id}-${line.color ?? ""}-${line.size ?? ""}`}
                style={styles.orderProduct}
              >
                <Image
                  source={imageUrl(
                    line.product.thumbnail || line.product.images?.[0],
                  )}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  style={styles.orderImage}
                />
                <View style={styles.orderProductCopy}>
                  <Text numberOfLines={2} style={styles.orderProductName}>
                    {line.product.name}
                  </Text>
                  <Text style={styles.orderVariant}>
                    {[line.color, line.size].filter(Boolean).join(" · ") ||
                      "Option standard"}{" "}
                    · Qté {line.quantity}
                  </Text>
                  <View style={styles.orderAvailability}>
                    <View
                      style={[
                        styles.availabilityDot,
                        affected && styles.availabilityDotError,
                      ]}
                    />
                    <Text
                      style={[
                        styles.availabilityText,
                        affected && styles.availabilityTextError,
                      ]}
                    >
                      {affected
                        ? "ACTION REQUISE"
                        : quoteReady
                          ? "DISPONIBILITÉ VÉRIFIÉE"
                          : "VÉRIFICATION EN COURS"}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderProductEnd}>
                  <Text style={styles.orderProductPrice}>
                    {money(line.product.price * line.quantity)}
                  </Text>
                  <Text style={styles.orderQuantity}>QTÉ {line.quantity}</Text>
                </View>
              </View>
            );
          })}
          <AnimatedPressable
            accessibilityLabel="Modifier les articles du panier"
            onPress={onEdit}
            style={styles.editCart}
          >
            <Ionicons name="create-outline" size={16} color={C.ink} />
            <Text style={styles.editCartText}>MODIFIER LE PANIER</Text>
          </AnimatedPressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

function PaymentMethodRow({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const paypal = method.provider === "paypal";
  return (
    <AnimatedPressable
      accessibilityLabel={`${method.title}${method.available ? "" : ", indisponible pour le moment"}`}
      accessibilityState={{ disabled: !method.available, selected }}
      disabled={!method.available}
      onPress={onSelect}
      pressedScale={0.99}
      style={[
        styles.paymentRow,
        selected && styles.paymentRowSelected,
        !method.available && styles.paymentRowUnavailable,
      ]}
    >
      <View
        style={[
          styles.paymentIcon,
          paypal && styles.paymentIconPaypal,
          !method.available && styles.paymentIconUnavailable,
        ]}
      >
        <Ionicons
          name={paypal ? "logo-paypal" : "cash-outline"}
          size={23}
          color={
            !method.available ? "#989C98" : paypal ? "#0070BA" : C.greenDark
          }
        />
      </View>
      <View style={styles.paymentCopy}>
        <View style={styles.paymentTitleRow}>
          <Text
            maxFontSizeMultiplier={1.25}
            numberOfLines={2}
            style={[
              styles.paymentTitle,
              !method.available && styles.paymentTitleUnavailable,
            ]}
          >
            {method.title}
          </Text>
          {method.recommended && method.available ? (
            <Text style={styles.recommended}>RECOMMANDÉ</Text>
          ) : null}
        </View>
        <Text
          maxFontSizeMultiplier={1.35}
          style={styles.paymentDescription}
        >
          {method.available
            ? `${method.description}${method.fee > 0 ? ` · Frais ${money(method.fee)}` : ""}`
            : method.unavailableReason || "INDISPONIBLE POUR LE MOMENT"}
        </Text>
        {!method.available ? (
          <Text style={styles.unavailable}>INDISPONIBLE POUR LE MOMENT</Text>
        ) : null}
      </View>
      <View
        accessibilityElementsHidden
        style={[styles.radio, selected && styles.radioSelected]}
      >
        {selected ? (
          <Ionicons name="checkmark" size={15} color={C.white} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function PriceRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, accent && styles.priceAccent]}>
        {label}
      </Text>
      <Text style={[styles.priceValue, accent && styles.priceAccent]}>
        {value}
      </Text>
    </View>
  );
}

function PriceSummary({
  subtotal,
  discount,
  shipping,
  paymentFee,
  total,
}: {
  subtotal: number;
  discount: number;
  shipping: number;
  paymentFee: number;
  total: number;
}) {
  return (
    <View style={styles.priceCard}>
      <Text style={styles.sectionEyebrow}>RÉCAPITULATIF DU PRIX</Text>
      <PriceRow label="Sous-total" value={money(subtotal)} />
      {discount > 0 ? (
        <PriceRow accent label="Réduction" value={`−${money(discount)}`} />
      ) : null}
      <PriceRow
        label="Livraison"
        value={shipping > 0 ? money(shipping) : "OFFERTE"}
      />
      {paymentFee > 0 ? (
        <PriceRow label="Frais de paiement" value={money(paymentFee)} />
      ) : null}
      <View style={styles.totalDivider} />
      <View style={styles.totalRow}>
        <View style={styles.totalLabelWrap}>
          <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
          <Text style={styles.taxLabel}>Taxes incluses</Text>
        </View>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.15}
          numberOfLines={1}
          style={styles.totalValue}
        >
          {money(total)}
        </Text>
      </View>
    </View>
  );
}

function CheckoutFooter({
  paymentStep,
  total,
  loading,
  disabledReason,
  onPress,
  bottomInset,
}: {
  paymentStep: boolean;
  total: number;
  loading: boolean;
  disabledReason?: string;
  onPress: () => void;
  bottomInset: number;
}) {
  const disabled = loading || Boolean(disabledReason);
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.footerInner}>
        {disabledReason ? (
          <View accessibilityRole="alert" style={styles.disabledReason}>
            <Ionicons name="information-circle" size={17} color={C.red} />
            <Text style={styles.disabledReasonText}>{disabledReason}</Text>
          </View>
        ) : null}
        <AnimatedPressable
          accessibilityLabel={
            paymentStep
              ? `Confirmer la commande, ${money(total)}`
              : "Continuer vers le paiement"
          }
          accessibilityState={{ busy: loading, disabled }}
          disabled={disabled}
          haptic={!disabled}
          onPress={onPress}
          pressedScale={0.99}
          style={[
            styles.confirmButton,
            disabled && styles.confirmButtonDisabled,
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator color={C.disabledText} size="small" />
              <Text style={styles.confirmTextDisabled}>
                TRAITEMENT DE LA COMMANDE…
              </Text>
            </>
          ) : (
            <>
              <View style={styles.confirmIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={disabled ? C.disabledText : C.green}
                />
              </View>
              <View style={styles.confirmCopy}>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    styles.confirmText,
                    disabled && styles.confirmTextDisabled,
                  ]}
                >
                  {paymentStep
                    ? "CONFIRMER LA COMMANDE"
                    : "CONTINUER VERS LE PAIEMENT"}
                </Text>
                <Text style={styles.confirmHint}>
                  {paymentStep ? `${money(total)} · total sécurisé` : "Étape suivante sécurisée"}
                </Text>
              </View>
              <View style={styles.confirmArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={disabled ? C.disabledText : C.ink}
                />
              </View>
            </>
          )}
        </AnimatedPressable>
        {paymentStep ? (
          <Text style={styles.terms}>
            En confirmant, vous acceptez nos{" "}
            <Text
              accessibilityRole="link"
              onPress={() =>
                void Linking.openURL(
                  "https://lecomax.com/conditions-utilisation",
                )
              }
              style={styles.termsLink}
            >
              conditions de vente
            </Text>
            .
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyCart({ topInset, bottomInset }: { topInset: number; bottomInset: number }) {
  return (
    <View
      style={[
        styles.empty,
        {
          paddingTop: Math.max(topInset, 24),
          paddingBottom: Math.max(bottomInset, 24),
        },
      ]}
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="bag-outline" size={32} color={C.greenDark} />
      </View>
      <Text style={styles.emptyTitle}>VOTRE PANIER EST VIDE</Text>
      <Text style={styles.emptyText}>
        Ajoutez un article avant de finaliser votre commande.
      </Text>
      <AnimatedPressable
        accessibilityLabel="Retourner au catalogue"
        onPress={() => router.replace("/catalog")}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>DÉCOUVRIR LES PRODUITS</Text>
      </AnimatedPressable>
    </View>
  );
}

function stockProblemFromError(error: unknown, cart: CartLine[]) {
  if (
    !(error instanceof ApiError) ||
    !["OUT_OF_STOCK", "PRODUCT_UNAVAILABLE"].includes(error.code ?? "")
  ) {
    return undefined;
  }
  const details =
    error.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : {};
  const slug = typeof details.slug === "string" ? details.slug : undefined;
  const line = cart.find((candidate) => candidate.product.slug === slug);
  const available = Number(details.availableQuantity);
  const requested = Number(details.requestedQuantity);
  return {
    slug,
    productName:
      typeof details.productName === "string"
        ? details.productName
        : line?.product.name || "Article indisponible",
    explanation:
      error.code === "PRODUCT_UNAVAILABLE"
        ? "Cet article n’est plus disponible à la vente. Modifiez votre panier pour continuer."
        : "La quantité demandée dépasse le stock actuellement disponible.",
    availableQuantity: Number.isFinite(available) ? available : undefined,
    requestedQuantity: Number.isFinite(requested) ? requested : undefined,
    color: typeof details.color === "string" ? details.color : undefined,
  } satisfies StockProblem;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const reduceMotion = useReducedMotion();
  const params = useLocalSearchParams<{
    step?: string;
    mode?: string;
    addressId?: string;
    returnTo?: string;
  }>();

  const cart = useCommerceStore((state) => state.cart);
  const clearCart = useCommerceStore((state) => state.clearCart);
  const removeCartLine = useCommerceStore((state) => state.removeCartLine);
  const savedCouponCode = useCommerceStore((state) => state.coupon);
  const setCouponCode = useCommerceStore((state) => state.setCoupon);
  const setUser = useUserStore((state) => state.setUser);
  const saveAddress = useUserStore((state) => state.saveAddress);
  const savedAddresses = useUserStore((state) => state.addresses ?? []);
  const savedName = useUserStore((state) => state.name);
  const savedEmail = useUserStore((state) => state.email);
  const savedPhone = useUserStore((state) => state.phone);
  const savedCity = useUserStore((state) => state.city);
  const savedAddress = useUserStore((state) => state.address);

  const editingAddress = savedAddresses.find(
    (item) => item.id === params.addressId,
  );
  const creatingNewAddress = params.mode === "new";
  const initialAddress = creatingNewAddress ? undefined : editingAddress;
  const hasSavedAddress = Boolean(
    initialAddress
      ? initialAddress.name &&
          initialAddress.email &&
          initialAddress.phone &&
          initialAddress.city &&
          initialAddress.address
      : savedName && savedEmail && savedPhone && savedCity && savedAddress,
  );
  const startsAtPayment = params.step === "payment" && hasSavedAddress;
  const [step, setStep] = useState<1 | 2>(startsAtPayment ? 2 : 1);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote>();
  const [submitError, setSubmitError] = useState<string>();
  const [checkoutRequestId] = useState(createCheckoutRequestId);
  const [focusedField, setFocusedField] = useState<InputName>();
  const [couponInput, setCouponInput] = useState(savedCouponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon>();
  const [couponError, setCouponError] = useState<string>();
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponsEnabled, setCouponsEnabled] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState<string>();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote>();
  const [checkoutQuoteLoading, setCheckoutQuoteLoading] = useState(false);
  const [checkoutQuoteError, setCheckoutQuoteError] = useState<string>();
  const [stockProblem, setStockProblem] = useState<StockProblem>();
  const [removedNotice, setRemovedNotice] = useState<string>();
  const [loyaltyDiscountPct, setLoyaltyDiscountPct] = useState(0);
  const [pendingPayPalCapture, setPendingPayPalCapture] =
    useState<PayPalCapture>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, line) => sum + line.product.price * line.quantity,
        0,
      ),
    [cart],
  );
  const itemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    trigger,
    formState: { isDirty, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name:
        initialAddress?.name ?? (creatingNewAddress ? "" : (savedName ?? "")),
      email:
        initialAddress?.email ?? (creatingNewAddress ? "" : (savedEmail ?? "")),
      phone:
        initialAddress?.phone ?? (creatingNewAddress ? "" : (savedPhone ?? "")),
      city:
        initialAddress?.city ?? (creatingNewAddress ? "" : (savedCity ?? "")),
      address:
        initialAddress?.address ??
        (creatingNewAddress ? "" : (savedAddress ?? "")),
      notes: "",
      payment: "cod",
    },
  });

  const leaveCheckout = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/cart");
  }, []);
  const confirmCheckoutExit = useCallback(() => {
    Alert.alert(
      "Quitter le paiement ?",
      "Vos informations non enregistrées seront perdues.",
      [
        { text: "Rester", style: "cancel" },
        { text: "Quitter", style: "destructive", onPress: leaveCheckout },
      ],
    );
  }, [leaveCheckout]);
  const requestCheckoutBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      return;
    }
    if (isDirty) {
      confirmCheckoutExit();
      return;
    }
    leaveCheckout();
  }, [confirmCheckoutExit, isDirty, leaveCheckout, step]);
  const interceptAndroidBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      return true;
    }
    if (!isDirty) return false;
    confirmCheckoutExit();
    return true;
  }, [confirmCheckoutExit, isDirty, step]);
  useAndroidBackInterceptor(interceptAndroidBack);
  const selectedPayment = useWatch({ control, name: "payment" });
  const shipping = checkoutQuote?.shipping ?? shippingQuote?.cost ?? 0;
  const couponDiscount =
    checkoutQuote?.couponDiscount ?? appliedCoupon?.discount ?? 0;
  const loyaltyDiscount =
    checkoutQuote?.loyaltyDiscount ??
    Math.round(((subtotal - couponDiscount) * loyaltyDiscountPct) / 100);
  const discount = checkoutQuote?.discount ?? couponDiscount + loyaltyDiscount;
  const selectedMethod = paymentMethods.find(
    (method) => method.provider === selectedPayment,
  );
  const paymentFee =
    checkoutQuote?.paymentFee ??
    (selectedMethod?.available ? selectedMethod.fee : 0);
  const total =
    checkoutQuote?.total ??
    Math.max(0, subtotal + shipping + paymentFee - discount);

  const retryCheckout = useCallback(() => {
    setRefreshing(true);
    setSubmitError(undefined);
    setPaymentMethodsError(undefined);
    setCheckoutQuoteError(undefined);
    setRefreshVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    void getSettings()
      .then((rows) => {
        const settings = Object.fromEntries(
          rows.map((row) => [row.key, String(row.value)]),
        );
        setCouponsEnabled(settings.enable_coupons === "true");
        if (settings.enable_ecoclub === "false") return;
        void apiRequest<{ tier?: string }>("/api/points", {
          authenticated: true,
        })
          .then((points) =>
            setLoyaltyDiscountPct(
              points.tier === "Gold" ? 50 : points.tier === "Silver" ? 30 : 0,
            ),
          )
          .catch(() => setLoyaltyDiscountPct(0));
      })
      .catch(() => {
        setCouponsEnabled(false);
        setLoyaltyDiscountPct(0);
      });
  }, []);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Saisissez un code promotionnel.");
      return;
    }
    setValidatingCoupon(true);
    setCouponError(undefined);
    try {
      const coupon = await validateCoupon(code, cart);
      setAppliedCoupon(coupon);
      setCouponInput(coupon.code);
      setCouponCode(coupon.code);
    } catch (error) {
      setAppliedCoupon(undefined);
      setCouponCode(undefined);
      setCouponError(
        error instanceof Error
          ? error.message
          : "Ce code ne peut pas être appliqué.",
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (!savedCouponCode || !cart.length || !couponsEnabled) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setValidatingCoupon(true);
        return validateCoupon(savedCouponCode, cart);
      })
      .then((coupon) => {
        if (!active || !coupon) return;
        setAppliedCoupon(coupon);
        setCouponInput(coupon.code);
        setCouponError(undefined);
      })
      .catch((error) => {
        if (!active) return;
        setAppliedCoupon(undefined);
        setCouponCode(undefined);
        setCouponError(
          error instanceof Error
            ? error.message
            : "Ce code ne peut plus être appliqué.",
        );
      })
      .finally(() => {
        if (active) setValidatingCoupon(false);
      });
    return () => {
      active = false;
    };
  }, [cart, couponsEnabled, savedCouponCode, setCouponCode]);

  useEffect(() => {
    if (step !== 2) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return [];
        setPaymentMethodsLoading(true);
        setPaymentMethodsError(undefined);
        return getPaymentMethods(getValues("city"), subtotal);
      })
      .then((methods) => {
        if (!active) return;
        setPaymentMethods(methods);
        const current = methods.find(
          (method) => method.provider === getValues("payment"),
        );
        if (!current?.available) {
          const firstAvailable = methods.find((method) => method.available);
          if (firstAvailable) {
            setValue("payment", firstAvailable.provider, {
              shouldValidate: true,
            });
          }
        }
      })
      .catch((error) => {
        if (!active) return;
        setPaymentMethods([]);
        setPaymentMethodsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les moyens de paiement.",
        );
      })
      .finally(() => {
        if (active) setPaymentMethodsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getValues, refreshVersion, setValue, step, subtotal]);

  useEffect(() => {
    if (step !== 2 || !cart.length) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined;
        setCheckoutQuoteLoading(true);
        setCheckoutQuoteError(undefined);
        setStockProblem(undefined);
        return getCheckoutQuote(cart, {
          city: getValues("city"),
          email: getValues("email"),
          couponId: appliedCoupon?.id,
          paymentProvider: selectedPayment,
        });
      })
      .then((quote) => {
        if (!active || !quote) return;
        setCheckoutQuote(quote);
        setShippingQuote({
          cost: quote.shipping,
          estimatedDays: quote.estimatedDays,
          zoneName: quote.zoneName,
        });
        if (quote.priceChanged) {
          setCheckoutQuoteError(
            "Un prix a été actualisé. Le total affiché utilise le tarif actuel validé par le serveur.",
          );
        }
      })
      .catch((error) => {
        if (!active) return;
        const problem = stockProblemFromError(error, cart);
        setCheckoutQuote(undefined);
        setStockProblem(problem);
        setCheckoutQuoteError(
          problem
            ? undefined
            : error instanceof Error
              ? error.message
              : "Impossible de vérifier le total de la commande.",
        );
      })
      .finally(() => {
        if (active) {
          setCheckoutQuoteLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    appliedCoupon?.id,
    cart,
    getValues,
    refreshVersion,
    selectedPayment,
    step,
  ]);

  const next = async () => {
    if (!(await trigger(["name", "email", "phone", "city", "address"]))) {
      setSubmitError(
        "Complétez les champs de livraison signalés avant de continuer.",
      );
      void triggerWarningHaptic();
      return;
    }
    const values = getValues();
    setUser({
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
      address: values.address,
    });
    saveAddress({
      id: editingAddress?.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
      address: values.address,
    });
    if (params.returnTo === "addresses" || params.returnTo === "cart") {
      router.replace(params.returnTo === "cart" ? "/cart" : "/addresses");
      return;
    }
    setSubmitError(undefined);
    try {
      const quote = await getShippingQuote(values.city, subtotal);
      setShippingQuote(quote);
      setStep(2);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de calculer la livraison.";
      setSubmitError(message);
      void triggerErrorHaptic();
    }
  };

  const submit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setSubmitError(undefined);
    try {
      if (stockProblem) {
        throw new Error(
          "Modifiez le panier pour résoudre le problème de stock.",
        );
      }
      if (!shippingQuote || checkoutQuoteLoading || !checkoutQuote) {
        throw new Error(
          "Le total sécurisé n’est pas disponible. Réessayez la vérification.",
        );
      }
      const method = paymentMethods.find(
        (candidate) => candidate.provider === values.payment,
      );
      if (!method?.available) {
        throw new Error(
          method?.unavailableReason ||
            "Aucun moyen de paiement n’est disponible.",
        );
      }

      let paypalCapture = pendingPayPalCapture;
      if (values.payment === "paypal" && !paypalCapture) {
        const paypalOrder = await createPayPalCheckout(
          total,
          checkoutRequestId,
        );
        const approval = await WebBrowser.openAuthSessionAsync(
          paypalOrder.approveUrl,
          "lecomax://paypal",
          { preferEphemeralSession: false },
        );
        if (approval.type !== "success") {
          throw new Error(
            approval.type === "cancel" || approval.type === "dismiss"
              ? "Paiement PayPal annulé. Votre panier a été conservé."
              : "Impossible de revenir dans L’ECOMAX après le paiement.",
          );
        }
        const callback = new URL(approval.url);
        const approvedOrderId = callback.searchParams.get("orderId");
        if (
          callback.searchParams.get("status") !== "approved" ||
          !approvedOrderId ||
          approvedOrderId !== paypalOrder.orderId
        ) {
          throw new Error("PayPal n’a pas confirmé votre autorisation.");
        }
        paypalCapture = await capturePayPalCheckout(approvedOrderId);
        setPendingPayPalCapture(paypalCapture);
      }

      const order = await createOrder(
        values,
        cart,
        shippingQuote,
        checkoutRequestId,
        appliedCoupon,
        loyaltyDiscount,
        paypalCapture,
        method.fee,
        checkoutQuote,
      );
      setPendingPayPalCapture(undefined);
      clearCart();
      void triggerSuccessHaptic();
      router.replace({
        pathname: "/order-confirmation",
        params: {
          orderNumber: order.order_number,
          total: String(total),
          payment: values.payment,
          email: values.email,
          estimatedDays:
            shippingQuote.estimatedDays || "2–5 jours ouvrables",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Veuillez réessayer.";
      setSubmitError(message);
      void triggerErrorHaptic();
    }
  });

  const removeProblemItem = () => {
    const line = cart.find(
      (candidate) => candidate.product.slug === stockProblem?.slug,
    );
    if (!line) {
      router.replace("/cart");
      return;
    }
    removeCartLine(line.product.id, line.color, line.size);
    setRemovedNotice(`${line.product.name} a été retiré du panier.`);
    setStockProblem(undefined);
    setRefreshVersion((current) => current + 1);
  };

  const disabledReason =
    submitError ??
    (step === 1
      ? undefined
      : stockProblem
        ? "Confirmation bloquée : corrigez le problème de stock."
        : paymentMethodsLoading || checkoutQuoteLoading
          ? "Vérification sécurisée de votre commande en cours…"
          : checkoutQuoteError && !checkoutQuote
            ? "Confirmation indisponible : vérifiez votre connexion puis réessayez."
            : paymentMethodsError
              ? "Confirmation indisponible : les moyens de paiement n’ont pas pu être chargés."
              : !selectedMethod?.available
                ? selectedMethod?.unavailableReason ||
                  "Sélectionnez un moyen de paiement disponible."
                : !checkoutQuote
                  ? "Le total sécurisé n’est pas encore disponible."
                  : undefined);

  if (!cart.length) {
    return <EmptyCart bottomInset={insets.bottom} topInset={insets.top} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <CheckoutHeader
        compact={compact}
        onBack={requestCheckoutBack}
        paymentStep={step === 2}
        topInset={insets.top}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          step === 2 ? (
            <RefreshControl
              colors={[C.green]}
              onRefresh={retryCheckout}
              refreshing={refreshing}
              tintColor={C.green}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <CheckoutProgress
            currentStep={step === 1 ? 2 : 3}
            onStepPress={(target) => {
              if (target === 1) router.replace("/cart");
              if (target === 2) setStep(1);
            }}
          />

          {step === 1 ? (
            <View style={styles.deliverySection}>
              <Text style={styles.pageTitle}>ADRESSE DE LIVRAISON</Text>
              <Text style={styles.pageSubtitle}>
                Indiquez où vous souhaitez recevoir votre commande.
              </Text>
              <View style={styles.deliveryCard}>
                {deliveryFields.map((item, index) => (
                  <Controller
                    key={item.name}
                    control={control}
                    name={item.name}
                    render={({
                      field: { value, onChange, onBlur },
                      fieldState: { error },
                    }) => {
                      const focused = focusedField === item.name;
                      return (
                        <View
                          style={[
                            styles.fieldWrap,
                            index > 0 && styles.fieldDivider,
                          ]}
                        >
                          <Text
                            style={[
                              styles.fieldLabel,
                              focused && styles.fieldLabelFocused,
                              error && styles.fieldLabelError,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <View
                            style={[
                              styles.field,
                              focused && styles.fieldFocused,
                              error && styles.fieldError,
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={19}
                              color={error ? C.red : C.greenDark}
                            />
                            <TextInput
                              accessibilityLabel={item.label}
                              autoCapitalize={
                                item.name === "email" ? "none" : "sentences"
                              }
                              autoComplete={
                                item.name === "name"
                                  ? "name"
                                  : item.name === "email"
                                    ? "email"
                                    : item.name === "phone"
                                      ? "tel"
                                      : item.name === "address"
                                        ? "street-address"
                                        : "postal-address-locality"
                              }
                              autoCorrect={
                                item.name !== "email" && item.name !== "phone"
                              }
                              cursorColor={C.green}
                              keyboardType={item.keyboardType ?? "default"}
                              onBlur={() => {
                                onBlur();
                                setFocusedField(undefined);
                              }}
                              onChangeText={(text) => {
                                onChange(text);
                                setSubmitError(undefined);
                              }}
                              onFocus={() => setFocusedField(item.name)}
                              placeholder={item.placeholder}
                              placeholderTextColor="#9B9F9B"
                              selectionColor={C.green}
                              style={[
                                styles.fieldInput,
                                Platform.OS === "web"
                                  ? ({
                                      outlineStyle: "none",
                                      outlineWidth: 0,
                                    } as unknown as TextStyle)
                                  : undefined,
                              ]}
                              value={value}
                            />
                          </View>
                          {error ? (
                            <Text accessibilityRole="alert" style={styles.fieldMessage}>
                              {error.message}
                            </Text>
                          ) : null}
                        </View>
                      );
                    }}
                  />
                ))}
              </View>
              <StatusBanner
                message="Vos coordonnées sont protégées et utilisées uniquement pour la livraison."
                tone="success"
              />
            </View>
          ) : (
            <View style={styles.paymentSection}>
              <OrderSummary
                cart={cart}
                expanded={summaryOpen}
                itemCount={itemCount}
                onEdit={() => router.replace("/cart")}
                onToggle={() => setSummaryOpen((current) => !current)}
                quoteLoading={checkoutQuoteLoading}
                quoteReady={Boolean(checkoutQuote)}
                reduceMotion={reduceMotion}
                stockProblem={stockProblem}
                total={total}
              />

              {stockProblem ? (
                <StockProblemCard
                  onEdit={() => router.replace("/cart")}
                  onRemove={removeProblemItem}
                  problem={stockProblem}
                />
              ) : null}
              {removedNotice ? (
                <StatusBanner
                  actionLabel="FERMER"
                  message={removedNotice}
                  onAction={() => setRemovedNotice(undefined)}
                  title="ARTICLE SUPPRIMÉ"
                  tone="success"
                />
              ) : null}
              {checkoutQuoteError ? (
                <StatusBanner
                  actionLabel={checkoutQuote ? undefined : "RÉESSAYER"}
                  message={checkoutQuoteError}
                  onAction={checkoutQuote ? undefined : retryCheckout}
                  title={
                    checkoutQuote ? "PRIX ACTUALISÉ" : "CONNEXION IMPOSSIBLE"
                  }
                  tone={checkoutQuote ? "warning" : "error"}
                />
              ) : null}

              <View style={styles.sectionHeading}>
                <Text style={styles.pageTitle}>Mode de paiement</Text>
                <Text style={styles.pageSubtitle}>
                  Choisissez comment vous souhaitez régler votre commande.
                </Text>
                <View style={styles.securityLine}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={C.greenDark}
                  />
                  <Text style={styles.securityLineText}>
                    Transaction chiffrée et protégée
                  </Text>
                </View>
              </View>

              {paymentMethodsLoading ? (
                <SkeletonRows />
              ) : (
                <>
                  {paymentMethodsError ? (
                    <StatusBanner
                      actionLabel="RÉESSAYER"
                      message={paymentMethodsError}
                      onAction={retryCheckout}
                      title="PAIEMENT INDISPONIBLE"
                      tone="error"
                    />
                  ) : null}
                  <Controller
                    control={control}
                    name="payment"
                    render={({ field: { value, onChange } }) => (
                      <View style={styles.paymentList}>
                        {paymentMethods.map((method) => (
                          <PaymentMethodRow
                            key={method.provider}
                            method={method}
                            onSelect={() => {
                              setSubmitError(undefined);
                              onChange(method.provider);
                            }}
                            selected={value === method.provider}
                          />
                        ))}
                      </View>
                    )}
                  />
                </>
              )}

              {couponsEnabled ? (
                <View style={styles.couponSection}>
                  <Text style={styles.sectionEyebrow}>CODE PROMOTIONNEL</Text>
                  <View
                    style={[
                      styles.couponRow,
                      appliedCoupon && styles.couponRowApplied,
                    ]}
                  >
                    <Ionicons
                      color={appliedCoupon ? C.greenDark : C.muted}
                      name={appliedCoupon ? "checkmark-circle" : "ticket-outline"}
                      size={18}
                    />
                    <TextInput
                      accessibilityLabel="Code promotionnel"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!validatingCoupon}
                      onChangeText={(value) => {
                        setCouponInput(value);
                        if (appliedCoupon) {
                          setAppliedCoupon(undefined);
                          setCouponCode(undefined);
                        }
                        setCouponError(undefined);
                      }}
                      onSubmitEditing={() => void applyCoupon()}
                      placeholder="EX. BIENVENUE10"
                      placeholderTextColor="#929692"
                      returnKeyType="done"
                      selectionColor={C.green}
                      style={styles.couponInput}
                      value={couponInput}
                    />
                    <AnimatedPressable
                      accessibilityLabel="Appliquer le code promotionnel"
                      disabled={validatingCoupon}
                      onPress={() => void applyCoupon()}
                      style={[
                        styles.couponButton,
                        validatingCoupon && styles.couponButtonDisabled,
                      ]}
                    >
                      {validatingCoupon ? (
                        <ActivityIndicator color={C.white} size="small" />
                      ) : (
                        <Text style={styles.couponButtonText}>APPLIQUER</Text>
                      )}
                    </AnimatedPressable>
                  </View>
                  {appliedCoupon ? (
                    <View style={styles.couponFeedback}>
                      <Text style={styles.couponSuccess}>
                        {appliedCoupon.code} APPLIQUÉ · −
                        {money(appliedCoupon.discount)}
                      </Text>
                      <AnimatedPressable
                        accessibilityLabel={`Retirer le code ${appliedCoupon.code}`}
                        onPress={() => {
                          setAppliedCoupon(undefined);
                          setCouponInput("");
                          setCouponCode(undefined);
                          setCouponError(undefined);
                        }}
                        style={styles.couponRemove}
                      >
                        <Text style={styles.couponRemoveText}>RETIRER</Text>
                      </AnimatedPressable>
                    </View>
                  ) : couponError ? (
                    <Text accessibilityRole="alert" style={styles.couponError}>
                      {couponError}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <PriceSummary
                discount={discount}
                paymentFee={paymentFee}
                shipping={shipping}
                subtotal={checkoutQuote?.subtotal ?? subtotal}
                total={total}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <CheckoutFooter
        bottomInset={insets.bottom}
        disabledReason={disabledReason}
        loading={isSubmitting}
        onPress={step === 1 ? () => void next() : () => void submit()}
        paymentStep={step === 2}
        total={total}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8F6" },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  headerRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    backgroundColor: C.white,
  },
  headerTitleWrap: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 17,
    letterSpacing: -0.4,
  },
  headerTitleCompact: { fontSize: 15 },
  headerSecurity: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  headerSecurityText: {
    marginLeft: 4,
    color: C.greenDark,
    fontFamily: typography.black,
    fontSize: 7.5,
    letterSpacing: 0.75,
  },
  headerShield: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CDE9D4",
    borderRadius: 22,
    backgroundColor: C.greenSoft,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  content: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
  },
  deliverySection: { paddingTop: 10 },
  paymentSection: { paddingTop: 10, gap: 18 },
  pageTitle: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.55,
  },
  pageSubtitle: {
    marginTop: 5,
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeading: { marginTop: 6 },
  securityLine: {
    minHeight: 38,
    marginTop: 13,
    paddingHorizontal: 13,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CDECD5",
    borderRadius: 19,
    backgroundColor: "#F7FCF8",
  },
  securityLineText: {
    marginLeft: 6,
    color: C.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  eyebrow: {
    color: C.muted,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1.05,
  },
  sectionEyebrow: {
    marginBottom: 12,
    color: C.greenDark,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.15,
  },
  orderBlock: {
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.white,
  },
  orderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderMetaTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderBagIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: C.greenSoft,
  },
  orderCountBadge: {
    minHeight: 26,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: C.soft,
  },
  orderTop: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  orderTotalCopy: { minWidth: 0, flex: 1, marginRight: 12 },
  orderAmountLabel: {
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  orderTotal: {
    marginTop: 3,
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 27,
    letterSpacing: -0.7,
  },
  orderCount: {
    color: C.muted,
    fontFamily: typography.bold,
    fontSize: 8.5,
  },
  orderToggle: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.soft,
  },
  orderToggleText: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.25,
  },
  orderVerification: {
    minHeight: 36,
    marginTop: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#C9EBD2",
    borderRadius: 18,
    backgroundColor: C.greenSoft,
  },
  orderVerificationText: {
    marginLeft: 7,
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  orderVerificationOk: {
    marginLeft: 7,
    color: C.greenDark,
    fontFamily: typography.bold,
    fontSize: 9.5,
    letterSpacing: 0.05,
  },
  orderDetails: {
    marginTop: 13,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  orderProduct: {
    minHeight: 78,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEDEA",
  },
  orderImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: C.soft,
  },
  orderProductCopy: {
    minWidth: 0,
    flex: 1,
    marginHorizontal: 11,
  },
  orderProductName: {
    color: C.ink,
    fontFamily: typography.bold,
    fontSize: 11,
    lineHeight: 15,
  },
  orderVariant: {
    marginTop: 4,
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  orderAvailability: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  availabilityDotError: { backgroundColor: C.red },
  availabilityText: {
    marginLeft: 5,
    color: C.greenDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.4,
  },
  availabilityTextError: { color: C.red },
  orderProductEnd: { alignItems: "flex-end" },
  orderProductPrice: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 11,
  },
  orderQuantity: {
    marginTop: 5,
    color: C.muted,
    fontFamily: typography.bold,
    fontSize: 7,
  },
  editCart: {
    minHeight: 44,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  editCartText: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 8,
    textDecorationLine: "underline",
  },
  statusBanner: {
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  statusError: { borderColor: "#F0B8BD", backgroundColor: C.redSoft },
  statusWarning: { borderColor: "#E9D59F", backgroundColor: C.amberSoft },
  statusSuccess: { borderColor: "#BCE3C6", backgroundColor: C.greenSoft },
  statusCopy: { minWidth: 0, flex: 1, marginLeft: 9 },
  statusTitle: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.55,
  },
  statusMessage: {
    marginTop: 2,
    color: C.disabledText,
    fontFamily: typography.medium,
    fontSize: 9.5,
    lineHeight: 14,
  },
  statusAction: {
    minHeight: 44,
    marginLeft: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusActionText: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 8,
    textDecorationLine: "underline",
  },
  stockCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9959D",
    borderRadius: 10,
    backgroundColor: C.redSoft,
  },
  stockHeadingRow: { flexDirection: "row", alignItems: "center" },
  stockIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: C.red,
  },
  stockHeadingCopy: { marginLeft: 11 },
  stockEyebrow: {
    color: C.red,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.9,
  },
  stockTitle: {
    marginTop: 2,
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 16,
  },
  stockProduct: {
    marginTop: 14,
    color: C.ink,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  stockExplanation: {
    marginTop: 5,
    color: C.disabledText,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  stockAvailability: {
    marginTop: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EDC7CB",
  },
  stockAvailabilityLabel: {
    color: C.red,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  stockAvailabilityValue: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 16,
  },
  stockPrimary: {
    minHeight: 50,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 7,
    backgroundColor: C.ink,
  },
  stockPrimaryText: {
    color: C.white,
    fontFamily: typography.black,
    fontSize: 9,
  },
  stockSecondary: {
    minHeight: 46,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  stockSecondaryText: {
    color: C.red,
    fontFamily: typography.black,
    fontSize: 8,
  },
  skeletonGroup: { gap: 8 },
  skeletonRow: {
    minHeight: 82,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    backgroundColor: C.white,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#E7E9E6",
  },
  skeletonCopy: { flex: 1, marginHorizontal: 12, gap: 8 },
  skeletonTitle: {
    width: "58%",
    height: 10,
    borderRadius: 3,
    backgroundColor: "#E1E3E0",
  },
  skeletonLine: {
    width: "84%",
    height: 8,
    borderRadius: 3,
    backgroundColor: "#ECEEEC",
  },
  skeletonRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E7E9E6",
  },
  paymentList: { gap: 10 },
  paymentRow: {
    position: "relative",
    minHeight: 92,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    backgroundColor: C.white,
  },
  paymentRowSelected: {
    borderColor: "#7BD494",
    borderWidth: 1.5,
    backgroundColor: "#F3FBF5",
    shadowColor: "#118D35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  paymentRowUnavailable: { backgroundColor: "#F0F1EF" },
  paymentIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: C.greenSoft,
  },
  paymentIconPaypal: { backgroundColor: "#F0F6FA" },
  paymentIconUnavailable: { backgroundColor: "#E5E6E4" },
  paymentCopy: { minWidth: 0, flex: 1, marginHorizontal: 14 },
  paymentTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  paymentTitle: {
    minWidth: 0,
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 13.5,
    lineHeight: 18,
  },
  paymentTitleUnavailable: { color: C.disabledText },
  recommended: {
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
    color: C.greenDark,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.4,
    borderRadius: 10,
    backgroundColor: "#DDF5E4",
  },
  paymentDescription: {
    marginTop: 4,
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 10.5,
    lineHeight: 16,
  },
  unavailable: {
    marginTop: 4,
    color: C.red,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.45,
  },
  radio: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A9ADA9",
    borderRadius: 14,
    backgroundColor: C.white,
  },
  radioSelected: { borderColor: C.green, backgroundColor: C.green },
  couponSection: {
    marginTop: 3,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: C.white,
  },
  couponRow: {
    minHeight: 56,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: C.soft,
  },
  couponRowApplied: { borderColor: "#A7DDB5" },
  couponInput: {
    minHeight: 44,
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 7,
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.4,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  couponButton: {
    minWidth: 90,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: C.ink,
  },
  couponButtonDisabled: { opacity: 0.55 },
  couponButtonText: {
    color: C.white,
    fontFamily: typography.black,
    fontSize: 8,
  },
  couponFeedback: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  couponSuccess: {
    flex: 1,
    color: C.greenDark,
    fontFamily: typography.black,
    fontSize: 8,
  },
  couponRemove: {
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  couponRemoveText: {
    color: C.red,
    fontFamily: typography.black,
    fontSize: 8,
  },
  couponError: {
    marginTop: 7,
    color: C.red,
    fontFamily: typography.semibold,
    fontSize: 9,
  },
  priceCard: {
    marginTop: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.white,
  },
  priceRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: {
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  priceValue: {
    color: C.ink,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  priceAccent: { color: C.greenDark },
  totalDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: C.ink,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  totalLabelWrap: { marginRight: 12 },
  totalLabel: {
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  taxLabel: {
    marginTop: 3,
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 8,
  },
  totalValue: {
    flexShrink: 1,
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 24,
    letterSpacing: -0.7,
  },
  deliveryCard: {
    marginTop: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    backgroundColor: C.white,
  },
  fieldWrap: { paddingVertical: 12 },
  fieldDivider: { borderTopWidth: 1, borderTopColor: "#ECEDEA" },
  fieldLabel: {
    marginBottom: 6,
    color: C.muted,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.55,
  },
  fieldLabelFocused: { color: C.greenDark },
  fieldLabelError: { color: C.red },
  field: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 7,
    backgroundColor: C.soft,
  },
  fieldFocused: { borderColor: C.green, backgroundColor: C.white },
  fieldError: { borderColor: C.red, backgroundColor: C.redSoft },
  fieldInput: {
    minWidth: 0,
    minHeight: 48,
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
    color: C.ink,
    fontFamily: typography.medium,
    fontSize: 13,
  },
  fieldMessage: {
    marginTop: 5,
    color: C.red,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  footer: {
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },
  footerInner: {
    width: "100%",
    maxWidth: MAX_WIDTH,
    alignSelf: "center",
  },
  disabledReason: {
    minHeight: 34,
    marginBottom: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F2C0C5",
    borderRadius: 6,
    backgroundColor: C.redSoft,
  },
  disabledReasonText: {
    minWidth: 0,
    flex: 1,
    marginLeft: 7,
    color: "#9E2631",
    fontFamily: typography.semibold,
    fontSize: 8.5,
    lineHeight: 12,
  },
  confirmButton: {
    minHeight: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    backgroundColor: C.ink,
  },
  confirmButtonDisabled: { backgroundColor: C.disabled },
  confirmText: {
    color: C.white,
    fontFamily: typography.black,
    fontSize: 10.5,
    letterSpacing: 0.15,
  },
  confirmCopy: {
    minWidth: 0,
    flex: 1,
    marginHorizontal: 11,
  },
  confirmHint: {
    marginTop: 3,
    color: "#AEB5AF",
    fontFamily: typography.medium,
    fontSize: 8,
  },
  confirmIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#1A201B",
  },
  confirmArrow: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: C.green,
  },
  confirmTextDisabled: { color: C.disabledText },
  terms: {
    marginTop: 7,
    textAlign: "center",
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 8,
    lineHeight: 12,
  },
  termsLink: {
    color: C.ink,
    fontFamily: typography.bold,
    textDecorationLine: "underline",
  },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.soft,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: C.greenSoft,
  },
  emptyTitle: {
    marginTop: 20,
    textAlign: "center",
    color: C.ink,
    fontFamily: typography.black,
    fontSize: 21,
  },
  emptyText: {
    marginTop: 7,
    maxWidth: 320,
    textAlign: "center",
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  emptyButton: {
    minHeight: 52,
    marginTop: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: C.ink,
  },
  emptyButtonText: {
    color: C.white,
    fontFamily: typography.black,
    fontSize: 9,
  },
});
