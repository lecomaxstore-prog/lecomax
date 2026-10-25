import { PreorderNotice } from "@/components/preorder-notice";
import { localizedContent } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  triggerErrorHaptic,
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from "@/services/haptics";
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
import { useFormKeyboardScroll } from "@/hooks/use-form-keyboard-scroll";
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
  .min(1, { error: () => msg("checkoutScreen.emailAddressIsRequired") })
  .email({ error: () => msg("checkoutScreen.enterAValidEmailAddressForExampleNameGmailCom") })
  .superRefine((value, context) => {
    const domain = value.split("@")[1]?.toLowerCase();
    const suggestion = domain ? emailDomainSuggestions[domain] : undefined;
    if (!suggestion) return;
    context.addIssue({
      code: "custom",
      message: msg("validation.emailDomainSuggestion", { domain: suggestion }),
    });
  });

const schema = z.object({
  name: z.string().trim().min(2, { error: () => msg("checkoutScreen.enterYourFullName") }),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(1, { error: () => msg("checkoutScreen.phoneNumberIsRequired") })
    .refine((value) => /^(?:212|0)[67]\d{8}$/.test(value.replace(/\D/g, "")), {
      get message() { return msg("checkoutScreen.useAValidMoroccanNumber06072126Or2127"); },
    }),
  city: z.string().trim().min(2, { error: () => msg("checkoutScreen.enterYourCity") }),
  address: z.string().trim().min(8, { error: () => msg("checkoutScreen.enterYourFullAddress") }),
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
    get label() { return msg("checkoutScreen.fullNameUppercase"); },
    get placeholder() { return msg("checkoutScreen.eGZakariaZemzami"); },
    icon: "person-outline",
  },
  {
    name: "email",
    get label() { return msg("auth.emailAddressUppercase"); },
    get placeholder() { return msg("common.emailExample"); },
    icon: "mail-outline",
    keyboardType: "email-address",
  },
  {
    name: "phone",
    get label() { return msg("checkoutScreen.phoneUppercase"); },
    placeholder: "+212 6 00 00 00 00",
    icon: "call-outline",
    keyboardType: "phone-pad",
  },
  {
    name: "city",
    get label() { return msg("checkoutScreen.cityUppercase"); },
    get placeholder() { return msg("checkoutScreen.eGCasablanca"); },
    icon: "business-outline",
  },
  {
    name: "address",
    get label() { return msg("checkoutScreen.fullAddressUppercase"); },
    get placeholder() { return msg("checkoutScreen.streetNeighborhoodAndPostalCode"); },
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
  useLocale();
  return (
    <View style={[styles.header, { paddingTop: Math.max(topInset, 8) }]}>
      <View style={styles.headerRow}>
        <AnimatedPressable
          accessibilityLabel={
            paymentStep ? msg("checkoutScreen.backToDelivery") : msg("checkoutScreen.backToCart")
          }
          onPress={onBack}
          style={styles.headerIconButton}
        >
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </AnimatedPressable>
        <View style={styles.headerTitleWrap}>
          <Text
            maxFontSizeMultiplier={1.15}
            numberOfLines={2}
            style={[styles.headerTitle, compact && styles.headerTitleCompact]}
          >
            {msg("checkoutScreen.completeYourOrder")}</Text>
          <View style={styles.headerSecurity}>
            <Ionicons name="lock-closed" size={11} color={C.greenDark} />
            <Text
              maxFontSizeMultiplier={1.15}
              style={styles.headerSecurityText}
            >
              {paymentStep ? msg("common.secureCheckout") : msg("checkoutScreen.secureDelivery")}
            </Text>
          </View>
        </View>
        <View
          accessibilityLabel={msg("trustStrip.protectedOrder")}
          style={styles.headerShield}
        >
          <Ionicons name="shield-checkmark-outline" size={21} color={C.green} />
        </View>
      </View>
    </View>
  );
}

function SkeletonRows() {
  useLocale();
  return (
    <View
      accessibilityLabel={msg("checkoutScreen.loadingPaymentMethods")}
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
  useLocale();
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
          tone === "error" ? C.red : tone === "warning" ? C.amber : C.greenDark
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
  useLocale();
  return (
    <View accessibilityRole="alert" style={styles.stockCard}>
      <View style={styles.stockHeadingRow}>
        <View style={styles.stockIcon}>
          <Ionicons name="warning" size={20} color={C.white} />
        </View>
        <View style={styles.stockHeadingCopy}>
          <Text style={styles.stockEyebrow}>{msg("checkoutScreen.actionRequiredUppercase")}</Text>
          <Text style={styles.stockTitle}>{msg("checkoutScreen.insufficientStockUppercase")}</Text>
        </View>
      </View>
      <Text style={styles.stockProduct}>{problem.productName}</Text>
      <Text style={styles.stockExplanation}>{problem.explanation}</Text>
      {problem.availableQuantity !== undefined ? (
        <View style={styles.stockAvailability}>
          <Text style={styles.stockAvailabilityLabel}>{msg("checkoutScreen.availableQuantityUppercase")}</Text>
          <Text style={styles.stockAvailabilityValue}>
            {problem.availableQuantity}
          </Text>
        </View>
      ) : null}
      <AnimatedPressable
        accessibilityLabel={msg("checkoutScreen.editCart")}
        onPress={onEdit}
        style={styles.stockPrimary}
      >
        <Ionicons name="create-outline" size={17} color={C.white} />
        <Text style={styles.stockPrimaryText}>{msg("checkoutScreen.editCartUppercase")}</Text>
      </AnimatedPressable>
      <AnimatedPressable
        accessibilityLabel={msg("cart.removeNamed", { name: problem.productName })}
        onPress={onRemove}
        style={styles.stockSecondary}
      >
        <Ionicons name="trash-outline" size={16} color={C.red} />
        <Text style={styles.stockSecondaryText}>{msg("checkoutScreen.removeItemUppercase")}</Text>
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
  useLocale();
  return (
    <View style={styles.orderBlock}>
      <View style={styles.orderMetaRow}>
        <View style={styles.orderMetaTitle}>
          <Ionicons name="bag-handle-outline" size={18} color="#31553B" />
          <Text style={styles.eyebrow}>{msg("checkoutScreen.yourOrder")}</Text>
        </View>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCount}>
            {msg("counts.items", { count: itemCount })}
          </Text>
        </View>
      </View>
      <View style={styles.orderTop}>
        <View style={styles.orderTotalCopy}>
          <Text style={styles.orderAmountLabel}>{msg("orderConfirmation.totalToPay")}</Text>
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
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? msg("checkoutScreen.hideOrderDetails")
              : msg("checkoutScreen.viewOrderDetails")
          }
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.orderToggle}
        >
          <Text style={styles.orderToggleText}>
            {expanded ? msg("checkoutScreen.hide") : msg("checkoutScreen.viewDetails")}
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
              {msg("checkoutScreen.checkingPricesAndStock")}</Text>
          </>
        ) : quoteReady && !stockProblem ? (
          <>
            <Ionicons name="checkmark" size={14} color={C.greenDark} />
            <Text style={styles.orderVerificationOk}>
              {msg("checkoutScreen.pricesAndAvailabilityVerified")}</Text>
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
                  <Text style={styles.orderProductName}>
                    {line.product.name}
                  </Text>
              <PreorderNotice item={{ ...line.product, fulfillment_type: line.fulfillment_type }} />
                  <Text style={styles.orderVariant}>
                    {[localizedContent(line.color), line.size].filter(Boolean).join(" · ") ||
                      msg("checkoutScreen.standardOption")}{" "}
                    {msg("checkoutScreen.qty")}{line.quantity}
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
                        ? msg("checkoutScreen.actionRequiredUppercase")
                        : quoteReady
                          ? msg("checkoutScreen.availabilityVerifiedUppercase")
                          : msg("checkoutScreen.verificationInProgressUppercase")}
                    </Text>
                  </View>
                  <Text style={styles.orderProductPrice}>
                    {money(line.product.price * line.quantity)}
                  </Text>
                </View>
              </View>
            );
          })}
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={msg("checkoutScreen.editCartItems")}
            onPress={onEdit}
            style={styles.editCart}
          >
            <Ionicons name="create-outline" size={16} color={C.ink} />
            <Text style={styles.editCartText}>{msg("checkoutScreen.editCartUppercase")}</Text>
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
  useLocale();
  const paypal = method.provider === "paypal";
  return (
    <AnimatedPressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={`${localizedContent(method.title)}${method.available ? "" : msg("checkoutScreen.currentlyUnavailable")}`}
      accessibilityState={{ disabled: !method.available, checked: selected }}
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
            {localizedContent(method.title)}
          </Text>
          {method.recommended && method.available ? (
            <Text style={styles.recommended}>{msg("checkoutScreen.recommended")}</Text>
          ) : null}
        </View>
        <Text maxFontSizeMultiplier={1.35} style={styles.paymentDescription}>
          {method.available
            ? `${localizedContent(method.description)}${method.fee > 0 ? msg("checkout.paymentFee", { fee: money(method.fee) }) : ""}`
            : localizedContent(method.unavailableReason) || msg("checkoutScreen.currentlyUnavailableUppercase")}
        </Text>
        {!method.available ? (
          <Text style={styles.unavailable}>{msg("checkoutScreen.currentlyUnavailableUppercase")}</Text>
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
  useLocale();
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
  useLocale();
  return (
    <View style={styles.priceCard}>
      <Text style={styles.sectionEyebrow}>{msg("checkoutScreen.priceSummaryUppercase")}</Text>
      <PriceRow label={msg("common.subtotal")} value={money(subtotal)} />
      {discount > 0 ? (
        <PriceRow accent label={msg("checkoutScreen.discount")} value={`−${money(discount)}`} />
      ) : null}
      <PriceRow
        label={msg("support.delivery")}
        value={shipping > 0 ? money(shipping) : msg("checkoutScreen.freeUppercase")}
      />
      {paymentFee > 0 ? (
        <PriceRow label={msg("checkoutScreen.paymentFees")} value={money(paymentFee)} />
      ) : null}
      <View style={styles.totalDivider} />
      <View style={styles.totalRow}>
        <View style={styles.totalLabelWrap}>
          <Text style={styles.totalLabel}>{msg("checkoutScreen.totalToPayUppercase")}</Text>
          <Text style={styles.taxLabel}>{msg("checkoutScreen.taxIncluded")}</Text>
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
  useLocale();
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
              ? msg("checkout.confirmTotal", { total: money(total) })
              : msg("checkoutScreen.continueToPayment")
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
                {msg("checkoutScreen.processingOrderUppercase")}</Text>
            </>
          ) : (
            <>
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
                    ? msg("checkoutScreen.confirmOrder")
                    : msg("checkoutScreen.continueToPaymentText")}
                </Text>
                <Text style={[styles.confirmHint, disabled && styles.confirmTextDisabled]}>
                  {paymentStep
                    ? msg("checkout.totalDue", { total: money(total) })
                    : msg("checkoutScreen.chooseYourPaymentMethod")}
                </Text>
              </View>
              <View style={styles.confirmArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={disabled ? C.disabledText : C.white}
                />
              </View>
            </>
          )}
        </AnimatedPressable>
        {paymentStep ? (
          <Text style={styles.terms}>
            {msg("checkoutScreen.byConfirmingYouAgreeToOur")}{" "}
            <Text
              accessibilityRole="link"
              onPress={() =>
                void Linking.openURL(
                  "https://lecomax.com/conditions-utilisation",
                )
              }
              style={styles.termsLink}
            >
              {msg("checkoutScreen.termsOfSale")}</Text>
            .
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyCart({
  topInset,
  bottomInset,
}: {
  topInset: number;
  bottomInset: number;
}) {
  useLocale();
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
      <Text style={styles.emptyTitle}>{msg("checkoutScreen.yourCartIsEmptyUppercase")}</Text>
      <Text style={styles.emptyText}>
        {msg("checkoutScreen.addAnItemBeforeCompletingYourOrder")}</Text>
      <AnimatedPressable
        accessibilityLabel={msg("checkoutScreen.backToCatalog")}
        onPress={() => router.replace("/catalog")}
        style={styles.emptyButton}
      >
        <Text style={styles.emptyButtonText}>{msg("homeSignupOffer.exploreProductsUppercase")}</Text>
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
        : line?.product.name || msg("checkoutScreen.itemUnavailable"),
    explanation:
      error.code === "PRODUCT_UNAVAILABLE"
        ? msg("checkoutScreen.thisItemIsNoLongerForSaleUpdateYourCartToContinue")
        : msg("checkoutScreen.theRequestedQuantityExceedsTheStockCurrentlyAvailable"),
    availableQuantity: Number.isFinite(available) ? available : undefined,
    requestedQuantity: Number.isFinite(requested) ? requested : undefined,
    color: typeof details.color === "string" ? details.color : undefined,
  } satisfies StockProblem;
}

export default function CheckoutScreen() {
  useLocale();
  const keyboardScroll = useFormKeyboardScroll();
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
      cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
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
    router.replace("/cart");
  }, []);
  const confirmCheckoutExit = useCallback(() => {
    Alert.alert(
      msg("checkoutScreen.leaveCheckout"),
      msg("checkoutScreen.yourUnsavedInformationWillBeLost"),
      [
        { text: msg("checkoutScreen.stay"), style: "cancel" },
        { text: msg("checkoutScreen.leave"), style: "destructive", onPress: leaveCheckout },
      ],
    );
  }, [leaveCheckout]);
  const requestCheckoutBack = useCallback(() => {
    if (step === 2) {
      leaveCheckout();
      return;
    }
    if (isDirty) {
      confirmCheckoutExit();
      return;
    }
    leaveCheckout();
  }, [confirmCheckoutExit, isDirty, leaveCheckout, step]);
  const interceptAndroidBack = useCallback(() => {
    requestCheckoutBack();
    return true;
  }, [requestCheckoutBack]);
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
      setCouponError(msg("checkoutScreen.enterAPromotionCode"));
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
          ? localizedError(error)
          : msg("checkoutScreen.thisCodeCannotBeApplied"),
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
            ? localizedError(error)
            : msg("checkoutScreen.thisCodeCanNoLongerBeApplied"),
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
            ? localizedError(error)
            : msg("checkoutScreen.unableToLoadPaymentMethods"),
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
            msg("checkoutScreen.aPriceHasBeenUpdatedTheDisplayedTotalUsesTheCurrentPrice"),
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
              ? localizedError(error)
              : msg("checkoutScreen.unableToVerifyTheOrderTotal"),
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
        msg("checkoutScreen.completeTheHighlightedDeliveryFieldsBeforeContinuing"),
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
          ? localizedError(error)
          : msg("checkoutScreen.unableToCalculateDelivery");
      setSubmitError(message);
      setRefreshVersion(current => current + 1);
      void triggerErrorHaptic();
    }
  };

  const submit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setSubmitError(undefined);
    try {
      if (stockProblem) {
        throw new Error(
          msg("checkoutScreen.updateYourCartToResolveTheStockIssue"),
        );
      }
      if (!shippingQuote || checkoutQuoteLoading || !checkoutQuote) {
        throw new Error(
          msg("checkoutScreen.theVerifiedTotalIsUnavailableTryCheckingAgain"),
        );
      }
      const method = paymentMethods.find(
        (candidate) => candidate.provider === values.payment,
      );
      if (!method?.available) {
        throw new Error(
          method?.unavailableReason ||
            msg("checkoutScreen.noPaymentMethodsAreAvailable"),
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
              ? msg("checkoutScreen.paypalPaymentCancelledYourCartHasBeenSaved")
              : msg("checkoutScreen.unableToReturnToLEcomaxAfterPayment"),
          );
        }
        const callback = new URL(approval.url);
        const approvedOrderId = callback.searchParams.get("orderId");
        if (
          callback.searchParams.get("status") !== "approved" ||
          !approvedOrderId ||
          approvedOrderId !== paypalOrder.orderId
        ) {
          throw new Error(msg("checkoutScreen.paypalHasNotConfirmedYourAuthorization"));
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
          preorderItems: JSON.stringify(order.items?.filter(item=>item.fulfillment_type === "PREORDER") ?? []),
          orderNumber: order.order_number,
          total: String(total),
          payment: values.payment,
          email: values.email,
          estimatedDays: shippingQuote.estimatedDays || msg("orderConfirmation.25BusinessDays"),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? localizedError(error) : msg("checkoutScreen.pleaseTryAgain");
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
    setRemovedNotice(msg("cart.namedRemoved", { name: line.product.name }));
    setStockProblem(undefined);
    setRefreshVersion((current) => current + 1);
  };

  const disabledReason =
    submitError ??
    (step === 1
      ? undefined
      : stockProblem
        ? msg("checkoutScreen.confirmationBlockedResolveTheStockIssue")
        : paymentMethodsLoading || checkoutQuoteLoading
          ? msg("checkoutScreen.securelyVerifyingYourOrder")
          : checkoutQuoteError && !checkoutQuote
            ? msg("checkoutScreen.confirmationUnavailableCheckYourConnectionAndTryAgain")
            : paymentMethodsError
              ? msg("checkoutScreen.confirmationUnavailablePaymentMethodsCouldNotBeLoaded")
              : !selectedMethod?.available
                ? selectedMethod?.unavailableReason ||
                  msg("checkoutScreen.selectAnAvailablePaymentMethod")
                : !checkoutQuote
                  ? msg("checkoutScreen.theVerifiedTotalIsNotAvailableYet")
                  : undefined);

  if (!cart.length) {
    return <EmptyCart bottomInset={insets.bottom} topInset={insets.top} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled={Platform.OS !== "web"}
      style={styles.screen}
    >
      <CheckoutHeader
        compact={compact}
        onBack={requestCheckoutBack}
        paymentStep={step === 2}
        topInset={insets.top}
      />

      <ScrollView
        ref={keyboardScroll.scrollRef}
        onScroll={keyboardScroll.onScroll}
        scrollEventThrottle={16}
        onLayout={keyboardScroll.reveal}
        onContentSizeChange={keyboardScroll.reveal}
        style={styles.scroll}
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
            compact
            currentStep={step === 1 ? 2 : 3}
            onStepPress={(target) => {
              if (target === 1) router.replace("/cart");
              if (target === 2) setStep(1);
            }}
          />

          {step === 1 ? (
            <View style={styles.deliverySection}>
              <Text accessibilityRole="header" style={styles.pageTitle}>{msg("checkoutScreen.whereShouldWeDeliverYourOrder")}</Text>
              <Text style={styles.pageSubtitle}>
                {msg("checkoutScreen.enterYourDeliveryDetails")}</Text>
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
                            {item.label.charAt(0) + item.label.slice(1).toLocaleLowerCase("fr")}
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
                              color={error ? C.red : "#809078"}
                            />
                            <TextInput
                              ref={(input) => keyboardScroll.register(item.name, input)}
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
                                keyboardScroll.blur(item.name);
                                onBlur();
                                setFocusedField(undefined);
                              }}
                              onChangeText={(text) => {
                                onChange(text);
                                setSubmitError(undefined);
                              }}
                              onFocus={() => {
                                setFocusedField(item.name);
                                keyboardScroll.focus(item.name);
                              }}
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
                            <Text
                              accessibilityRole="alert"
                              style={styles.fieldMessage}
                            >
                              {localizedError(error)}
                            </Text>
                          ) : null}
                        </View>
                      );
                    }}
                  />
                ))}
              </View>
              <StatusBanner
                message={msg("checkoutScreen.yourDetailsAreProtectedAndUsedOnlyForDelivery")}
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
                  actionLabel={msg("productReviews.closeUppercase")}
                  message={removedNotice}
                  onAction={() => setRemovedNotice(undefined)}
                  title={msg("checkoutScreen.itemRemovedUppercase")}
                  tone="success"
                />
              ) : null}
              {checkoutQuoteError ? (
                <StatusBanner
                  actionLabel={checkoutQuote ? undefined : msg("notifications.tryAgainUppercase")}
                  message={checkoutQuoteError}
                  onAction={checkoutQuote ? undefined : retryCheckout}
                  title={
                    checkoutQuote ? msg("checkoutScreen.priceUpdatedUppercase") : msg("checkoutScreen.connectionFailedUppercase")
                  }
                  tone={checkoutQuote ? "warning" : "error"}
                />
              ) : null}

              <View style={styles.sectionHeading}>
                <Text style={styles.pageTitle}>{msg("orderConfirmation.paymentMethod")}</Text>
                <Text style={styles.pageSubtitle}>
                  {msg("checkoutScreen.howWouldYouLikeToPay")}</Text>
              </View>

              {paymentMethodsLoading ? (
                <SkeletonRows />
              ) : (
                <>
                  {paymentMethodsError ? (
                    <StatusBanner
                      actionLabel={msg("notifications.tryAgainUppercase")}
                      message={paymentMethodsError}
                      onAction={retryCheckout}
                      title={msg("checkoutScreen.paymentUnavailableUppercase")}
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
                  <Text style={styles.sectionEyebrow}>{msg("checkoutScreen.haveAPromotionCode")}</Text>
                  <View
                    nativeID="checkout-promo-field"
                    style={[
                      styles.couponRow,
                      appliedCoupon && styles.couponRowApplied,
                    ]}
                  >
                    <Ionicons
                      color={appliedCoupon ? C.greenDark : C.muted}
                      name={
                        appliedCoupon ? "checkmark-circle" : "ticket-outline"
                      }
                      size={18}
                    />
                    <TextInput
                      nativeID="checkout-promo-input"
                      underlineColorAndroid="transparent"
                      autoComplete="off"
                      ref={(input) => keyboardScroll.register("coupon", input)}
                      onFocus={() => keyboardScroll.focus("coupon")}
                      onBlur={() => keyboardScroll.blur("coupon")}
                      accessibilityLabel={msg("checkoutScreen.promotionCode")}
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
                      placeholder={msg("checkoutScreen.eGBienvenue10Uppercase")}
                      placeholderTextColor="#929692"
                      returnKeyType="done"
                      selectionColor={C.green}
                      style={styles.couponInput}
                      value={couponInput}
                    />
                    <AnimatedPressable
                      accessibilityLabel={msg("checkoutScreen.applyPromotionCode")}
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
                        <Text style={styles.couponButtonText}>{msg("checkoutScreen.apply")}</Text>
                      )}
                    </AnimatedPressable>
                  </View>
                  {appliedCoupon ? (
                    <View style={styles.couponFeedback}>
                      <Text style={styles.couponSuccess}>
                        {appliedCoupon.code} {msg("checkoutScreen.appliedUppercase")}{money(appliedCoupon.discount)}
                      </Text>
                      <AnimatedPressable
                        accessibilityLabel={msg("promotions.removeCode", { code: appliedCoupon.code })}
                        onPress={() => {
                          setAppliedCoupon(undefined);
                          setCouponInput("");
                          setCouponCode(undefined);
                          setCouponError(undefined);
                        }}
                        style={styles.couponRemove}
                      >
                        <Text style={styles.couponRemoveText}>{msg("checkoutScreen.removeUppercase")}</Text>
                      </AnimatedPressable>
                    </View>
                  ) : couponError ? (
                    <Text accessibilityRole="alert" style={styles.couponError}>
                      {couponError}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {checkoutQuote?.items?.filter(item=>item.fulfillment_type === "PREORDER").map((item,index)=><View key={index}><Text>{cart.find(line=>line.product.slug===item.slug)?.product.name}</Text><PreorderNotice item={item}/></View>)}
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
  screen: { flex: 1, minHeight: 0, backgroundColor: "#F8F9F6" },
  scroll: { flex: 1, minHeight: 0 },
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
    textAlign: "center",
    color: "#2C3C2F",
    fontFamily: typography.medium,
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
    color: "#78866F",
    fontFamily: typography.regular,
    fontSize: 11,
  },
  headerShield: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "transparent",
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
  deliverySection: { paddingTop: 24 },
  paymentSection: { paddingTop: 16, gap: 16 },
  pageTitle: {
    color: C.ink,
    fontFamily: typography.bold,
    fontSize: 22,
    lineHeight: 28,
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
    minHeight: 28,
    marginTop: 8,
    paddingHorizontal: 0,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderColor: "#CDECD5",
    borderRadius: 19,
    backgroundColor: "transparent",
  },
  securityLineText: {
    marginLeft: 6,
    color: C.greenDark,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  eyebrow: {
    color: C.muted,
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  sectionEyebrow: {
    marginBottom: 12,
    color: C.ink,
    fontFamily: typography.semibold,
    fontSize: 12,
  },
  orderBlock: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#E3E7DE",
    borderRadius: 18,
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
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  orderTotalCopy: { minWidth: 0, flex: 1, marginRight: 12 },
  orderAmountLabel: {
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  orderTotal: {
    marginTop: 3,
    color: "#183D29",
    fontFamily: typography.bold,
    fontSize: 28,
    letterSpacing: -0.7,
  },
  orderCount: {
    color: C.muted,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  orderToggle: {
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: "#F1F4EC",
  },
  orderToggleText: {
    color: "#31553B",
    fontFamily: typography.semibold,
    fontSize: 11,
  },
  orderVerification: {
    minHeight: 18,
    marginTop: 8,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 0,
    borderColor: "#C9EBD2",
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  orderVerificationText: {
    marginLeft: 7,
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  orderVerificationOk: {
    marginLeft: 7,
    color: "#49634C",
    fontFamily: typography.regular,
    fontSize: 11,
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
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEDEA",
  },
  orderImage: {
    width: 64,
    height: 72,
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
    fontFamily: typography.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  orderVariant: {
    marginTop: 4,
    color: C.muted,
    fontFamily: typography.medium,
    fontSize: 11,
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
    fontFamily: typography.medium,
    fontSize: 9,
    flexShrink: 1,
    letterSpacing: 0.4,
  },
  availabilityTextError: { color: C.red },
  orderProductPrice: {
    color: C.ink,
    marginTop: 8,
    fontFamily: typography.semibold,
    fontSize: 13,
  },
  editCart: {
    minHeight: 44,
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  editCartText: {
    color: C.ink,
    fontFamily: typography.semibold,
    fontSize: 11,
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
  paymentList: { gap: 12 },
  paymentRow: {
    position: "relative",
    minHeight: 88,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    backgroundColor: C.white,
  },
  paymentRowSelected: {
    borderColor: "#315D3C",
    borderWidth: 1,
    backgroundColor: "#F0F6EC",
    shadowColor: "#118D35",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  paymentRowUnavailable: { backgroundColor: "#F0F1EF" },
  paymentIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.greenSoft,
  },
  paymentIconPaypal: { backgroundColor: "#F0F6FA" },
  paymentIconUnavailable: { backgroundColor: "#E5E6E4" },
  paymentCopy: { minWidth: 0, flex: 1, marginHorizontal: 12 },
  paymentTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  paymentTitle: {
    minWidth: 0,
    color: C.ink,
    fontFamily: typography.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  paymentTitleUnavailable: { color: C.disabledText },
  recommended: {
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
    color: C.greenDark,
    fontFamily: typography.medium,
    fontSize: 10,
    borderRadius: 10,
    backgroundColor: "#E0EBD8",
  },
  paymentDescription: {
    marginTop: 4,
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 17,
  },
  unavailable: {
    marginTop: 4,
    color: C.red,
    fontFamily: typography.black,
    fontSize: 7,
    letterSpacing: 0.45,
  },
  radio: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A9ADA9",
    borderRadius: 14,
    backgroundColor: C.white,
  },
  radioSelected: { borderColor: "#315D3C", backgroundColor: "#315D3C" },
  couponSection: {
    marginTop: 3,
    padding: 0,
    borderWidth: 0,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: "transparent",
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
    fontFamily: typography.medium,
    fontSize: 14,
    letterSpacing: 0,
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
    fontFamily: typography.semibold,
    fontSize: 12,
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
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: C.border,
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
    fontSize: 12,
  },
  priceValue: {
    color: C.ink,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  priceAccent: { color: C.greenDark },
  totalDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: C.border,
  },
  totalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
    marginTop: 10,
    backgroundColor: C.white,
  },
  fieldWrap: { paddingVertical: 9 },
  fieldDivider: {},
  fieldLabel: {
    marginBottom: 8,
    color: "#6B7863",
    fontFamily: typography.medium,
    fontSize: 11,
  },
  fieldLabelFocused: { color: C.greenDark },
  fieldLabelError: { color: C.red },
  field: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3E7DD",
    borderRadius: 12,
    backgroundColor: "#FAFBF7",
  },
  fieldFocused: { borderColor: "#5C7956", backgroundColor: C.white },
  fieldError: { borderColor: C.red, backgroundColor: C.redSoft },
  fieldInput: {
    minWidth: 0,
    minHeight: 48,
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
    color: "#33442F",
    fontFamily: typography.regular,
    fontSize: 16,
  },
  fieldMessage: {
    marginTop: 5,
    color: C.red,
    fontFamily: typography.medium,
    fontSize: 9,
  },
  footer: {
    flexShrink: 0,
    paddingTop: 10,
    paddingHorizontal: 20,
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
    minHeight: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    backgroundColor: "#183D29",
  },
  confirmButtonDisabled: { backgroundColor: C.disabled },
  confirmText: {
    color: C.white,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  confirmCopy: {
    minWidth: 0,
    flex: 1,
    marginRight: 10,
  },
  confirmHint: {
    marginTop: 3,
    color: "#D2D7D3",
    fontFamily: typography.medium,
    fontSize: 11,
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
    backgroundColor: "transparent",
  },
  confirmTextDisabled: { color: C.disabledText },
  terms: {
    marginTop: 7,
    textAlign: "center",
    color: C.muted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 14,
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
