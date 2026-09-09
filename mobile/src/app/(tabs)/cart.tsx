import { PreorderNotice } from "@/components/preorder-notice";
import { localizedContent } from "@/i18n/content";
import { localizedError } from "@/i18n/errors";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import { AnimatedPressable } from "@/components/animated-pressable";
import { AppViewportOverlay } from "@/components/app-viewport";
import { CheckoutProgress } from "@/components/checkout-progress";
import { Screen } from "@/components/screen";
import { typography } from "@/constants/theme";
import { useSettings } from "@/hooks/use-catalog";
import { money } from "@/lib/format";
import { useProductImage } from "@/hooks/use-product-image";
import { cartLineAvailableStock } from "@/lib/cart-reconciliation";
import { validateCoupon, type AppliedCoupon } from "@/services/coupons";
import { getFreshProducts } from "@/services/catalog";
import { getCheckoutQuote, type ShippingQuote, type CheckoutQuote } from "@/services/orders";
import { useCommerceStore } from "@/stores/commerce";
import { useUserStore, type SavedAddress } from "@/stores/user";
import type { CartLine } from "@/types/commerce";

const colors = {
  background: "#FFFFFF",
  white: "#FFFFFF",
  surface: "#F7F8F6",
  text: "#0B0B0B",
  secondaryText: "#5D615D",
  primary: "#29C954",
  primaryDark: "#10843A",
  border: "#E1E4E0",
  danger: "#EF2B2D",
};

const webInputReset =
  Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
        outlineColor: "transparent",
        borderWidth: 0,
        boxShadow: "none",
      } as unknown as TextStyle)
    : undefined;

function keyFor(line: CartLine) {
  return `${line.product.id}:${line.color ?? ""}:${line.size ?? ""}`;
}

function availableStock(line: CartLine) {
  return cartLineAvailableStock(line.product, line);
}

type CartItemProps = {
  line: CartLine;
  busy: boolean;
  favourite: boolean;
  estimate: string;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onToggleFavourite: () => void;
};

const CartItem = memo(function CartItem({
  line,
  busy,
  favourite,
  estimate,
  onQuantity,
  onRemove,
  onToggleFavourite,
}: CartItemProps) {
  useLocale();
  const { source: visibleImage, onError: onImageError } = useProductImage(line.product);
  const maximum = availableStock(line);
  const unavailable =
    maximum < 1 ||
    (!line.product.preorder_enabled && line.color
      ? line.product.out_of_stock_colors?.includes(line.color)
      : false) ||
    (!line.product.preorder_enabled && line.size ? line.product.out_of_stock_sizes?.includes(line.size) : false);
  const promotional =
    Boolean(line.product.original_price) &&
    Number(line.product.original_price) > line.product.price;
  const options = [localizedContent(line.color), line.size].filter(Boolean).join(" · ");

  return (
    <View style={styles.product}>
      <View style={styles.productTop}>
        <View>
          <View style={styles.productImage}>
            {visibleImage ? (
            <Image
              accessibilityLabel={line.product.name}
              cachePolicy="memory-disk"
              contentFit="contain"
              recyclingKey={String(visibleImage)}
              source={visibleImage}
              onError={onImageError}
              style={{ width: "100%", height: "100%" }}
              transition={160}
            />
            ) : (
              <View style={styles.imageFallback} accessibilityLabel={msg("cart.productImageUnavailable")}>
                <Ionicons name="image-outline" size={24} color="#939A8A" />
                <Text style={styles.imageFallbackText}>{msg("cart.imageUnavailable")}</Text>
              </View>
            )}
          </View>

        </View>

        <View style={styles.productDetails}>
          <View style={styles.productHeading}>
            <Text maxFontSizeMultiplier={1.25} style={styles.productName}>
              {line.product.name}
            </Text>
              <PreorderNotice item={{ ...line.product, fulfillment_type: line.fulfillment_type }} />
          </View>

          <Text style={styles.category}>
            {(line.product.brand || line.product.category).toUpperCase()}
          </Text>
          {options ? <Text style={styles.options}>{options}</Text> : null}
          <View style={styles.deliveryLine}>
            <Ionicons
              color={unavailable ? colors.danger : colors.primaryDark}
              name={unavailable ? "alert-circle-outline" : "car-outline"}
              size={15}
            />
            <Text
              numberOfLines={2}
              style={[
                styles.deliveryText,
                unavailable && styles.unavailableText,
              ]}
            >
              {unavailable
                ? msg("cart.itemOrVariantUnavailable")
                : msg("delivery.estimate", { estimate })}
            </Text>
          </View>
          <View style={styles.productActions}>
            <AnimatedPressable
              accessibilityLabel={
                favourite
                  ? msg("productCard.removeFromFavorites")
                  : msg("cart.saveToFavorites")
              }
              accessibilityState={{ selected: favourite }}
              onPress={onToggleFavourite}
              pressedScale={0.88}
              style={styles.iconButton}
            >
              <Ionicons
                color={favourite ? colors.primaryDark : colors.secondaryText}
                name={favourite ? "heart" : "heart-outline"}
                size={21}
              />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel={msg("cart.removeNamed", { name: line.product.name })}
              onPress={onRemove}
              pressedScale={0.88}
              style={styles.iconButton}
            >
              <Ionicons
                color={colors.secondaryText}
                name="trash-outline"
                size={20}
              />
            </AnimatedPressable>
          </View>
        </View>
      </View>

      <View style={styles.productBottom}>
        <View>
          <Text
            style={[styles.linePrice, promotional && styles.linePricePromotion]}
          >
            {money(line.product.price * line.quantity)}
          </Text>
          {promotional ? (
            <Text style={styles.oldPrice}>
              {money(Number(line.product.original_price) * line.quantity)}
            </Text>
          ) : null}
        </View>

        <View style={styles.quantity}>
          <Pressable
            accessibilityLabel={msg("cart.decreaseQuantity")}
            accessibilityState={{ disabled: busy || line.quantity <= 1 }}
            disabled={busy || line.quantity <= 1}
            onPress={() => onQuantity(line.quantity - 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.quantityPressed,
            ]}
          >
            <Ionicons
              color={line.quantity <= 1 ? "#B6BAB7" : colors.text}
              name="remove"
              size={20}
            />
          </Pressable>
          <View style={styles.quantityValue}>
            {busy ? (
              <ActivityIndicator color={colors.primaryDark} size="small" />
            ) : (
              <Text style={styles.quantityText}>{line.quantity}</Text>
            )}
          </View>
          <Pressable
            accessibilityLabel={msg("cart.increaseQuantity")}
            accessibilityState={{
              disabled: busy || unavailable || line.quantity >= maximum,
            }}
            disabled={busy || unavailable || line.quantity >= maximum}
            onPress={() => onQuantity(line.quantity + 1)}
            style={({ pressed }) => [
              styles.quantityButton,
              pressed && styles.quantityPressed,
            ]}
          >
            <Ionicons
              color={
                unavailable || line.quantity >= maximum
                  ? "#B6BAB7"
                  : colors.text
              }
              name="add"
              size={20}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

function DeliveryAddress({
  address,
  onEdit,
  onSelect,
  onNew,
  notice,
}: {
  address?: SavedAddress;
  onEdit: () => void;
  onSelect: () => void;
  onNew: () => void;
  notice: boolean;
}) {
  useLocale();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.addressHeading}>{msg("orderTracking.deliveryAddress")}</Text>
        {address ? (
          <AnimatedPressable
            accessibilityLabel={msg("cart.editDeliveryAddress")}
            haptic={false}
            onPress={onEdit}
            style={styles.addressEditButton}
          >
            <Ionicons name="create-outline" size={14} color="#4E6252" />
            <Text style={styles.addressEditText}>{msg("profile.edit")}</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {address ? (
        <AnimatedPressable
          accessibilityLabel={msg("addresses.selectedDetails", { name: address.name, address: address.address, city: address.city })}
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          onPress={onSelect}
          pressedScale={0.99}
          style={styles.addressCard}
        >
          <View style={styles.addressCardHeader}>
            <View style={styles.addressLocationIcon}>
              <Ionicons name="location-outline" size={22} color="#244B34" />
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.addressEyebrow}>{msg("cart.deliverToThisAddressUppercase")}</Text>
              <Text style={styles.addressName}>{address.name}</Text>
            </View>
            <View style={styles.addressSelectedIcon}>
              <Ionicons color="#FFFFFF" name="checkmark" size={14} />
            </View>
          </View>
          <View style={styles.addressDetails}>
            <Text style={styles.addressLine}>{address.address}</Text>
            <Text style={styles.addressCity}>{address.city}</Text>
          </View>
          <View style={styles.addressContact}>
            <Ionicons name="call-outline" size={14} color="#637362" />
            <Text style={styles.addressPhone}>{address.phone}</Text>
            <View style={styles.addressSelectedBadge}>
              <View style={styles.addressSelectedDot} />
              <Text style={styles.addressSelectedText}>{msg("cart.selected")}</Text>
            </View>
          </View>
        </AnimatedPressable>
      ) : (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.missingAddress, notice && styles.missingAddressError]}
        >
          <Ionicons
            color={notice ? colors.danger : colors.secondaryText}
            name="location-outline"
            size={21}
          />
          <Text style={styles.missingAddressText}>
            {msg("cart.addACompleteAddressBeforeContinuing")}</Text>
        </View>
      )}

      <AnimatedPressable
        accessibilityLabel={msg("cart.addANewAddress")}
        accessibilityRole="button"
        onPress={onNew}
        pressedScale={0.985}
        style={styles.addAddress}
      >
        <View style={styles.addAddressIcon}>
          <Ionicons color="#36533B" name="add" size={17} />
        </View>
        <Text style={styles.addAddressText}>{msg("addresses.addAddress")}</Text>
        <Ionicons color="#86917D" name="chevron-forward" size={15} />
      </AnimatedPressable>
    </View>
  );
}

export default function CartScreen() {
  useLocale();
  const cart = useCommerceStore((state) => state.cart);
  const wishlist = useCommerceStore((state) => state.wishlist);
  const couponCode = useCommerceStore((state) => state.coupon);
  const addToCart = useCommerceStore((state) => state.addToCart);
  const removeCartLine = useCommerceStore((state) => state.removeCartLine);
  const setLineQuantity = useCommerceStore((state) => state.setLineQuantity);
  const refreshCartProducts = useCommerceStore(
    (state) => state.refreshCartProducts,
  );
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const setCoupon = useCommerceStore((state) => state.setCoupon);
  const settingsQuery = useSettings();

  const savedAddresses = useUserStore((state) => state.addresses ?? []);
  const selectedAddressId = useUserStore((state) => state.selectedAddressId);
  const selectAddress = useUserStore((state) => state.selectAddress);
  const userName = useUserStore((state) => state.name);
  const userEmail = useUserStore((state) => state.email);
  const userPhone = useUserStore((state) => state.phone);
  const userCity = useUserStore((state) => state.city);
  const userAddress = useUserStore((state) => state.address);

  const [addressNotice, setAddressNotice] = useState(false);
  const [busyLine, setBusyLine] = useState<string>();
  const [removeCandidate, setRemoveCandidate] = useState<CartLine>();
  const [removedLine, setRemovedLine] = useState<CartLine>();
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon>();
  const [couponError, setCouponError] = useState<string>();
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [calculation, setCalculation] = useState<CheckoutQuote>();
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote>();
  const [shippingError, setShippingError] = useState<string>();
  const [shippingLoading, setShippingLoading] = useState(false);
  const [stockNotice, setStockNotice] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      if (!useCommerceStore.getState().cart.length) return undefined;
      const controller = new AbortController();
      void getFreshProducts(controller.signal)
        .then((products) => {
          const result = refreshCartProducts(products);
          if (!result.removed.length && !result.adjusted.length) return;

          const messages: string[] = [];
          if (result.removed.length) {
            messages.push(
              msg("cart.unavailableRemoved", { count: result.removed.length }),
            );
          }
          if (result.adjusted.length) {
            messages.push(
              msg("cart.stockAdjusted", { count: result.adjusted.length }),
            );
          }
          setStockNotice(`${messages.join(msg("common.andSeparator"))}.`);
        })
        .catch(() => {
          // Keep the local cart unchanged if live stock cannot be verified.
        });
      return () => controller.abort();
    }, [refreshCartProducts]),
  );

  const legacyAddress =
    userName && userEmail && userPhone && userCity && userAddress
      ? ({
          id: "legacy-address",
          name: userName,
          email: userEmail,
          phone: userPhone,
          city: userCity,
          address: userAddress,
        } satisfies SavedAddress)
      : undefined;
  const addresses = savedAddresses.length
    ? savedAddresses
    : legacyAddress
      ? [legacyAddress]
      : [];
  const activeAddress =
    addresses.find((address) => address.id === selectedAddressId) ??
    addresses[0];
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const settings = useMemo(
    () =>
      Object.fromEntries(
        (settingsQuery.data ?? []).map((setting) => [
          setting.key,
          String(setting.value ?? ""),
        ]),
      ),
    [settingsQuery.data],
  );
  const estimate = settings.shipping_estimated_days?.trim() || msg("cart.25Days");
  const couponsEnabled = settings.enable_coupons !== "false";
  const shipping = calculation?.shipping ?? 0;
  const discount = calculation?.discount ?? 0;
  const total = calculation?.total ?? 0;

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      if (!cart.length) { setCalculation(undefined); setShippingLoading(false); return; }
      setShippingLoading(true);
      setCalculation(undefined);
      setShippingError(undefined);
      try {
        const quote = await getCheckoutQuote(cart, { city: activeAddress?.city ?? "", email: "", couponId: appliedCoupon?.id });
        if (active) { setCalculation(quote); setShippingQuote({ cost: quote.shipping, estimatedDays: quote.estimatedDays, zoneName: quote.zoneName }); }
      } catch (error) {
        if (!active) return;
        setShippingQuote(undefined);
        setShippingError(
          error instanceof Error
            ? localizedError(error)
            : msg("cart.deliveryCurrentlyUnavailable"),
        );
      } finally {
        if (active) setShippingLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [activeAddress?.city, cart, appliedCoupon?.id, settingsQuery.dataUpdatedAt]);

  useEffect(() => {
    if (!couponCode || !cart.length || !couponsEnabled) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setValidatingCoupon(true);
      try {
        const coupon = await validateCoupon(couponCode, cart);
        if (!active) return;
        setAppliedCoupon(coupon);
        setCouponInput(coupon.code);
        setCouponError(undefined);
      } catch (error) {
        if (!active) return;
        setAppliedCoupon(undefined);
        setCoupon(undefined);
        setCouponError(
          error instanceof Error ? localizedError(error) : msg("cart.invalidPromotionCode"),
        );
      } finally {
        if (active) setValidatingCoupon(false);
      }
    });
    return () => {
      active = false;
    };
  }, [cart, couponCode, couponsEnabled, setCoupon]);

  const updateQuantity = (line: CartLine, quantity: number) => {
    const lineKey = keyFor(line);
    if (busyLine || quantity < 1 || quantity > availableStock(line)) return;
    setBusyLine(lineKey);
    setLineQuantity(line.product.id, quantity, line.color, line.size);
    setTimeout(() => setBusyLine(undefined), 240);
  };

  const confirmRemoval = () => {
    if (!removeCandidate) return;
    removeCartLine(
      removeCandidate.product.id,
      removeCandidate.color,
      removeCandidate.size,
    );
    setRemovedLine(removeCandidate);
    setRemoveCandidate(undefined);
  };

  const undoRemoval = () => {
    if (!removedLine) return;
    addToCart(removedLine.product, {
      color: removedLine.color,
      size: removedLine.size,
      quantity: removedLine.quantity,
    });
    setRemovedLine(undefined);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError(msg("checkoutScreen.enterAPromotionCode"));
      return;
    }
    if (validatingCoupon || !cart.length) return;
    setValidatingCoupon(true);
    setCouponError(undefined);
    try {
      const coupon = await validateCoupon(code, cart);
      setAppliedCoupon(coupon);
      setCouponInput(coupon.code);
      setCoupon(coupon.code);
    } catch (error) {
      setAppliedCoupon(undefined);
      setCoupon(undefined);
      setCouponError(
        error instanceof Error
          ? localizedError(error)
          : msg("checkoutScreen.thisCodeCannotBeApplied"),
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const continueToCheckout = () => {
    if (!activeAddress) {
      setAddressNotice(true);
      Alert.alert(
        msg("cart.addressRequired"),
        msg("cart.addACompleteDeliveryAddressToContinue"),
      );
      return;
    }
    if (!cart.length) return;
    router.navigate({
      pathname: "/checkout",
      params: {
        step: "payment",
        ...(activeAddress.id !== "legacy-address"
          ? { addressId: activeAddress.id }
          : {}),
      },
    });
  };

  if (!cart.length) {
    return (
      <Screen className="bg-white">
        <CartHeader itemCount={0} />
        {stockNotice ? <StockNotice message={stockNotice} /> : null}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.empty}
        >
          <View style={styles.emptyVisual}>
            <View style={styles.emptyVisualRing} />
            <View style={styles.emptyIcon}>
              <Ionicons
                color={colors.white}
                name="bag-handle-outline"
                size={38}
              />
            </View>
            <View style={styles.emptyPlus}>
              <Ionicons color={colors.text} name="add" size={16} />
            </View>
          </View>
          <Text style={styles.emptyEyebrow}>{msg("cart.yourSelectionUppercase")}</Text>
          <Text style={styles.emptyTitle}>{msg("common.empty")}</Text>
          <Text style={styles.emptyCopy}>
            {msg("cart.exploreOurCollectionsAndFindASelectionThatSuitsYou")}</Text>
          <AnimatedPressable
            accessibilityLabel={msg("cart.exploreProducts")}
            onPress={() => router.push("/catalog")}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>{msg("cart.continueShoppingUppercase")}</Text>
            <View style={styles.emptyButtonArrow}>
              <Ionicons color={colors.text} name="arrow-forward" size={17} />
            </View>
          </AnimatedPressable>

          <View style={styles.emptyShortcuts}>
            <AnimatedPressable
              accessibilityLabel={msg("cart.viewNewArrivals")}
              onPress={() => router.push("/catalog?sort=new")}
              style={styles.emptyShortcut}
            >
              <View style={styles.emptyShortcutIcon}>
                <Ionicons
                  color={colors.primaryDark}
                  name="sparkles-outline"
                  size={18}
                />
              </View>
              <View style={styles.emptyShortcutCopy}>
                <Text style={styles.emptyShortcutTitle}>{msg("common.arrivals")}</Text>
                <Text style={styles.emptyShortcutText}>
                  {msg("cart.theLatestArrivals")}</Text>
              </View>
              <Ionicons color={colors.text} name="chevron-forward" size={16} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel={msg("cart.viewPromotions")}
              onPress={() => router.push("/catalog?sort=low")}
              style={styles.emptyShortcut}
            >
              <View style={styles.emptyShortcutIcon}>
                <Ionicons
                  color={colors.primaryDark}
                  name="pricetag-outline"
                  size={18}
                />
              </View>
              <View style={styles.emptyShortcutCopy}>
                <Text style={styles.emptyShortcutTitle}>{msg("homePromotionSection.promotions")}</Text>
                <Text style={styles.emptyShortcutText}>
                  {msg("cart.ourBestOffers")}</Text>
              </View>
              <Ionicons color={colors.text} name="chevron-forward" size={16} />
            </AnimatedPressable>
          </View>

          <View style={styles.emptyBenefits}>
            {(
              [
                ["shield-checkmark-outline", msg("common.secureCheckout")],
                ["car-outline", msg("cart.trackedDelivery")],
                ["refresh-outline", msg("common.easyReturns")],
              ] as const
            ).map(([icon, label]) => (
              <View key={label} style={styles.emptyBenefit}>
                <Ionicons color={colors.primaryDark} name={icon} size={17} />
                <Text style={styles.emptyBenefitText}>{label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <CartHeader itemCount={itemCount} />
        {stockNotice ? <StockNotice message={stockNotice} /> : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CheckoutProgress currentStep={1} />
          <DeliveryAddress
            address={activeAddress}
            notice={addressNotice}
            onEdit={() =>
              router.push(
                activeAddress?.id && activeAddress.id !== "legacy-address"
                  ? {
                      pathname: "/checkout",
                      params: {
                        addressId: activeAddress.id,
                        returnTo: "cart",
                      },
                    }
                  : "/checkout",
              )
            }
            onNew={() =>
              router.push({
                pathname: "/checkout",
                params: { mode: "new", returnTo: "cart" },
              })
            }
            onSelect={() => {
              if (savedAddresses.length > 1) router.push("/addresses");
              else if (activeAddress?.id !== "legacy-address")
                selectAddress(activeAddress.id);
            }}
          />

          <View style={styles.divider} />

          <View style={styles.orderSection}>
            <View style={styles.orderHeading}>
              <Text accessibilityRole="header" style={styles.orderTitle}>{msg("checkoutScreen.yourOrder")}</Text>
              <Text accessibilityLiveRegion="polite" style={styles.orderCount}>
                {msg("counts.items", { count: itemCount })}
              </Text>
            </View>
            {cart.map((line) => (
              <CartItem
                busy={busyLine === keyFor(line)}
                estimate={localizedContent(shippingQuote?.estimatedDays || estimate)}
                favourite={wishlist.includes(line.product.id)}
                key={keyFor(line)}
                line={line}
                onQuantity={(quantity) => updateQuantity(line, quantity)}
                onRemove={() => setRemoveCandidate(line)}
                onToggleFavourite={() =>
                  toggleWishlist(line.product.id, {
                    color: line.color,
                    size: line.size,
                  })
                }
              />
            ))}
          </View>

          {couponsEnabled ? (
            <View style={styles.couponSection}>
              <Text style={styles.fieldLabel}>{msg("cart.promotionCodeUppercase")}</Text>
              <View
                style={[
                  styles.couponControl,
                  appliedCoupon && styles.couponControlSuccess,
                  couponError && styles.couponControlError,
                ]}
              >
                <Ionicons
                  color={
                    appliedCoupon ? colors.primaryDark : colors.secondaryText
                  }
                  name={appliedCoupon ? "checkmark-circle" : "ticket-outline"}
                  size={19}
                />
                <TextInput
                  accessibilityLabel={msg("checkoutScreen.promotionCode")}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!validatingCoupon && !appliedCoupon}
                  onChangeText={(value) => {
                    setCouponInput(value);
                    setCouponError(undefined);
                  }}
                  onSubmitEditing={() => void applyCoupon()}
                  placeholder={msg("cart.enterYourCode")}
                  placeholderTextColor="#8A8F8B"
                  returnKeyType="done"
                  selectionColor={colors.primary}
                  style={[styles.couponInput, webInputReset]}
                  value={couponInput}
                />
                {appliedCoupon ? (
                  <AnimatedPressable
                    accessibilityLabel={msg("cart.removePromotionCode")}
                    haptic={false}
                    onPress={() => {
                      setAppliedCoupon(undefined);
                      setCoupon(undefined);
                      setCouponInput("");
                    }}
                    style={styles.removeCoupon}
                  >
                    <Ionicons
                      color={colors.secondaryText}
                      name="close"
                      size={18}
                    />
                  </AnimatedPressable>
                ) : (
                  <AnimatedPressable
                    accessibilityLabel={msg("checkoutScreen.applyPromotionCode")}
                    accessibilityState={{ busy: validatingCoupon }}
                    disabled={validatingCoupon}
                    onPress={() => void applyCoupon()}
                    style={styles.applyCoupon}
                  >
                    {validatingCoupon ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.applyCouponText}>{msg("checkoutScreen.apply")}</Text>
                    )}
                  </AnimatedPressable>
                )}
              </View>
              {appliedCoupon ? (
                <Text accessibilityLiveRegion="polite" style={styles.couponOk}>
                  {appliedCoupon.code} {msg("cart.applied")}{money(appliedCoupon.discount)}
                </Text>
              ) : couponError ? (
                <Text accessibilityRole="alert" style={styles.couponError}>
                  {couponError}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.summary}>
            <SummaryRow label={msg("common.subtotal")} value={money(subtotal)} />
            {discount > 0 ? (
              <SummaryRow
                accent
                label={msg("promotions.discountCode", { code: appliedCoupon ? ` · ${appliedCoupon.code}` : "" })}
                value={`−${money(discount)}`}
              />
            ) : null}
            <SummaryRow
              accent={shipping === 0}
              label={msg("support.delivery")}
              loading={shippingLoading}
              value={!calculation ? "—" : shipping === 0 ? msg("checkoutScreen.freeUppercase") : money(shipping)}
            />
            {shippingError ? (
              <Text accessibilityRole="alert" style={styles.shippingError}>
                {shippingError}
              </Text>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{msg("orderConfirmation.totalToPay")}</Text>
                <Text style={styles.taxLabel}>{msg("checkoutScreen.taxIncluded")}</Text>
              </View>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <View style={styles.trust}>
            <TrustItem
              icon="lock-closed-outline"
              label={
                settings.checkout_trust_payment?.trim() || msg("common.secureCheckout")
              }
            />
            <View style={styles.trustDivider} />
            <TrustItem
              icon="refresh-outline"
              label={
                settings.checkout_trust_returns?.trim() || msg("cart.easyReturns")
              }
            />
            <View style={styles.trustDivider} />
            <TrustItem
              icon="headset-outline"
              label={settings.checkout_contact_title?.trim() || msg("support.support")}
            />
          </View>

          {removedLine ? (
            <View accessibilityLiveRegion="polite" style={styles.undo}>
              <Text numberOfLines={1} style={styles.undoText}>
                {msg("cart.itemRemovedFromCart")}</Text>
              <AnimatedPressable
                accessibilityLabel={msg("cart.undoRemoval")}
                haptic={false}
                onPress={undoRemoval}
                style={styles.undoButton}
              >
                <Text style={styles.undoButtonText}>{msg("addresses.cancel")}</Text>
              </AnimatedPressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.sticky, { paddingBottom: 10 }]}>
          <AnimatedPressable
            accessibilityLabel={msg("checkoutScreen.continueToPayment")}
            accessibilityState={{
              disabled: !activeAddress,
            }}
            disabled={!activeAddress}
            onPress={continueToCheckout}
            pressedScale={0.985}
            style={[
              styles.checkoutButton,
              !activeAddress && styles.checkoutButtonDisabled,
            ]}
          >
            <Text style={[styles.checkoutButtonText, !activeAddress && styles.checkoutTextDisabled]}>
              {msg("checkoutScreen.continueToPaymentText")}</Text>
            <Ionicons color={activeAddress ? colors.white : "#858D86"} name="arrow-forward" size={20} />
          </AnimatedPressable>
          <View style={styles.checkoutReassurance}>
            <Ionicons color="#737C73" name={activeAddress ? "lock-closed-outline" : "location-outline"} size={12} />
            <Text style={styles.checkoutButtonHint}>
              {activeAddress ? msg("common.secureCheckout") : msg("cart.addAnAddressToContinue")}
            </Text>
          </View>
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setRemoveCandidate(undefined)}
          transparent
          visible={Boolean(removeCandidate)}
        >
          <AppViewportOverlay align="bottom">
            <Pressable
              accessibilityLabel={msg("cart.closeConfirmation")}
              onPress={() => setRemoveCandidate(undefined)}
              style={styles.modalBackdrop}
            />
            <View accessibilityViewIsModal style={styles.removeSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.removeSheetIcon}>
                <Ionicons
                  color="#A15D4D"
                  name="trash-outline"
                  size={22}
                />
              </View>
              <Text accessibilityRole="header" style={styles.removeTitle}>{msg("cart.removeFromYourCart")}</Text>
              <Text style={styles.removeName}>
                {removeCandidate?.product.name}
              </Text>
              <View style={styles.removeActions}>
                <AnimatedPressable
                  accessibilityLabel={msg("cart.undoRemoval")}
                  accessibilityRole="button"
                  haptic={false}
                  onPress={() => setRemoveCandidate(undefined)}
                  style={styles.cancelRemove}
                >
                  <Text style={styles.cancelRemoveText}>{msg("cart.keepItem")}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityLabel={msg("cart.confirmRemoval")}
                  accessibilityRole="button"
                  onPress={confirmRemoval}
                  style={styles.confirmRemove}
                >
                  <Text style={styles.confirmRemoveText}>{msg("cart.remove")}</Text>
                </AnimatedPressable>
              </View>
            </View>
          </AppViewportOverlay>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CartHeader({ itemCount }: { itemCount: number }) {
  useLocale();
  return (
    <View style={styles.header}>
      <AnimatedPressable
        accessibilityLabel={msg("addresses.back")}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)");
          }
        }}
        style={styles.headerButton}
      >
        <Ionicons color={colors.text} name="arrow-back" size={25} />
      </AnimatedPressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>{msg("cart.myCartUppercase")}</Text>
        <Text style={styles.headerSubtitle}>
          {msg("counts.items", { count: itemCount })}
        </Text>
      </View>
      <View accessibilityLabel={msg("common.secureCheckout")} style={styles.headerSecure}>
        <Ionicons
          color={colors.primaryDark}
          name="shield-checkmark-outline"
          size={21}
        />
      </View>
    </View>
  );
}

function StockNotice({ message }: { message: string }) {
  useLocale();
  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={styles.stockNotice}
    >
      <View style={styles.stockNoticeIcon}>
        <Ionicons color={colors.primaryDark} name="refresh" size={17} />
      </View>
      <View style={styles.stockNoticeCopy}>
        <Text style={styles.stockNoticeTitle}>{msg("cart.cartUpdatedUppercase")}</Text>
        <Text style={styles.stockNoticeText}>{message}</Text>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
  loading = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  loading?: boolean;
}) {
  useLocale();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, accent && styles.summaryAccent]}>
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primaryDark} size="small" />
      ) : (
        <Text style={[styles.summaryValue, accent && styles.summaryAccent]}>
          {value}
        </Text>
      )}
    </View>
  );
}

function TrustItem({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  useLocale();
  return (
    <View style={styles.trustItem}>
      <Ionicons color={colors.primaryDark} name={icon} size={18} />
      <Text numberOfLines={2} style={styles.trustText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(11,11,11,0.07)",
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  headerCopy: { alignItems: "center" },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
    letterSpacing: -0.35,
  },
  headerSubtitle: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 11,
  },
  headerSecure: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F0F8F2",
  },
  stockNotice: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#BFE7CA",
    borderRadius: 14,
    backgroundColor: "#F1FBF4",
  },
  stockNoticeIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#DDF5E4",
  },
  stockNoticeCopy: { minWidth: 0, flex: 1 },
  stockNoticeTitle: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  stockNoticeText: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 14,
  },
  section: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  sectionHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 17,
    letterSpacing: -0.45,
  },
  orderHeading: {
    minHeight: 36,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  orderTitle: {
    color: "#2D3A30",
    fontFamily: typography.medium,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  orderCount: {
    color: "#7D8475",
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 18,
  },
  textAction: {
    minWidth: 66,
    minHeight: 44,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  textActionLabel: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  addressCard: {
    minHeight: 88,
    marginTop: 13,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#CCDCC6",
    borderRadius: 20,
    backgroundColor: "#F8FAF5",
  },
  addressHeading: { flex: 1, color: "#25362A", fontFamily: typography.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.45 },
  addressEditButton: { minHeight: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 14, backgroundColor: "#F2F5EE", marginLeft: 10 },
  addressEditText: { color: "#4E6252", fontFamily: typography.medium, fontSize: 11 },
  addressCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  addressCopy: { minWidth: 0, flex: 1 },
  addressLocationIcon: { width: 42, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#E8EFDF" },
  addressEyebrow: { fontFamily: typography.semibold, fontSize: 8, letterSpacing: 0.8, color: "#687B60", marginBottom: 4 },
  addressSelectedIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#365A3E", alignItems: "center", justifyContent: "center" },
  addressDetails: { marginTop: 13 },
  addressCity: { fontFamily: typography.medium, color: "#485844", fontSize: 12, lineHeight: 19, marginTop: 2 },
  addressSelectedBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: "#EAF1E3" },
  addressSelectedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#547744" },
  addressSelectedText: { color: "#4F6B42", fontFamily: typography.medium, fontSize: 9 },
  addAddressIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#EDF2E7", alignItems: "center", justifyContent: "center" },
  addressName: {
    color: "#253D2D",
    fontFamily: typography.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  addressContact: { marginTop: 13, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDE5D6", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  addressPhone: { color: "#52634B", fontFamily: typography.medium, fontSize: 11, lineHeight: 18, fontVariant: ["tabular-nums"] },
  addressLine: {
    color: "#52634B",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 21,
  },
  missingAddress: {
    minHeight: 64,
    marginTop: 10,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  missingAddressError: {
    borderColor: "#F2B8B9",
    backgroundColor: "#FFF7F7",
  },
  missingAddressText: {
    minWidth: 0,
    flex: 1,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  addAddress: {
    minHeight: 48,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E9DF",
    backgroundColor: "#FFFFFF",
  },
  addAddressText: {
    flex: 1,
    color: "#465D3F",
    fontFamily: typography.medium,
    fontSize: 11,
  },
  divider: { height: 1, marginHorizontal: 18, backgroundColor: colors.border },
  orderSection: { paddingHorizontal: 18, paddingTop: 20 },
  countBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#EEF8F1",
  },
  countBadgeText: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
  },
  product: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E7E9E0",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },
  productTop: { flexDirection: "row" },
  productImage: {
    width: 84,
    height: 104,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 7, padding: 8 },
  imageFallbackText: { fontFamily: typography.regular, fontSize: 9, lineHeight: 13, color: "#7F8777", textAlign: "center" },
  productDetails: { minWidth: 0, flex: 1, marginLeft: 12 },
  productHeading: { alignItems: "stretch" },
  productName: {
    minWidth: 0,
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  productActions: { flexDirection: "row", alignSelf: "flex-end", marginTop: 8, gap: 6 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F7F8F4",
  },
  category: {
    marginTop: 7,
    color: colors.secondaryText,
    fontFamily: typography.semibold,
    fontSize: 9,
    letterSpacing: 0.55,
  },
  options: {
    marginTop: 4,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 10.5,
  },
  deliveryLine: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  deliveryText: {
    minWidth: 0,
    flex: 1,
    color: "#61745B",
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  unavailableText: { color: colors.danger },
  productBottom: {
    marginTop: 14,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linePrice: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
  },
  linePricePromotion: { color: colors.text },
  oldPrice: {
    marginTop: 3,
    color: "#8A8E8B",
    fontFamily: typography.medium,
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  quantity: {
    height: 44,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D5D9D5",
    borderRadius: 12,
  },
  quantityButton: {
    width: 40,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  quantityPressed: { backgroundColor: colors.surface },
  quantityValue: {
    width: 38,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  quantityText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 14,
  },
  couponSection: { paddingHorizontal: 18, paddingVertical: 20 },
  fieldLabel: {
    marginBottom: 10,
    color: "#74806D",
    fontFamily: typography.medium,
    fontSize: 9,
    letterSpacing: 1,
  },
  couponControl: {
    minHeight: 56,
    paddingLeft: 12,
    paddingRight: 5,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E6DB",
    borderRadius: 16,
    backgroundColor: "#FAFBF7",
  },
  couponControlSuccess: {
    borderColor: "#A7D9B5",
    backgroundColor: "#F5FBF7",
  },
  couponControlError: {
    borderColor: "#E9A9AA",
    backgroundColor: "#FFF9F9",
  },
  couponInput: {
    minWidth: 0,
    height: 44,
    flex: 1,
    color: colors.text,
    fontFamily: typography.regular,
    fontSize: 11,
    backgroundColor: "transparent",
  },
  applyCoupon: {
    minWidth: 86,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#294B36",
  },
  applyCouponText: {
    color: colors.white,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  removeCoupon: {
    width: 52,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  couponOk: {
    marginTop: 8,
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 9,
  },
  couponError: {
    marginTop: 8,
    color: colors.danger,
    fontFamily: typography.semibold,
    fontSize: 9,
  },
  summary: {
    marginHorizontal: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: "#E6E9DE",
    backgroundColor: "#F8FAF4",
  },
  summaryRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryLabel: {
    flex: 1,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 12,
  },
  summaryValue: {
    color: "#354731",
    fontFamily: typography.medium,
    fontSize: 12,
  },
  summaryAccent: { color: colors.primaryDark },
  shippingError: {
    color: colors.danger,
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 13,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
    backgroundColor: "#DCE3D2",
  },
  totalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: "#354731",
    fontFamily: typography.medium,
    fontSize: 14,
  },
  taxLabel: {
    marginTop: 3,
    color: "#7D8774",
    fontFamily: typography.regular,
    fontSize: 9,
  },
  totalValue: {
    color: "#294B36",
    fontFamily: typography.semibold,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.6,
  },
  trust: {
    minHeight: 74,
    marginHorizontal: 18,
    marginTop: 8,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  trustItem: { minWidth: 0, flex: 1, alignItems: "center", gap: 6 },
  trustText: {
    color: "#77826C",
    fontFamily: typography.regular,
    fontSize: 8,
    lineHeight: 11,
    textAlign: "center",
  },
  trustDivider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: "#E5E9DE" },
  undo: {
    minHeight: 50,
    margin: 16,
    paddingLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E7DB",
    backgroundColor: "#F4F7EF",
  },
  undoText: {
    minWidth: 0,
    flex: 1,
    color: "#59664F",
    fontFamily: typography.regular,
    fontSize: 10,
  },
  undoButton: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  undoButtonText: {
    color: "#294B36",
    fontFamily: typography.medium,
    fontSize: 11,
    textDecorationLine: "underline",
  },
  sticky: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  checkoutButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#183D29",
  },
  checkoutButtonDisabled: { backgroundColor: "#E8ECE6" },
  checkoutTextDisabled: { color: "#737C73" },
  checkoutButtonText: {
    color: colors.white,
    fontFamily: typography.semibold,
    fontSize: 14,
    flex: 1,
  },
  checkoutReassurance: { marginTop: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  checkoutButtonHint: {
    color: "#737C73",
    fontFamily: typography.medium,
    fontSize: 10,
    textAlign: "center",
  },
  empty: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingTop: 34,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  emptyVisual: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyVisualRing: {
    position: "absolute",
    inset: 0,
    borderWidth: 1,
    borderColor: "#CDEED7",
    borderRadius: 58,
    backgroundColor: "#F2FBF5",
  },
  emptyIcon: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: colors.text,
  },
  emptyPlus: {
    position: "absolute",
    right: 4,
    bottom: 11,
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  emptyEyebrow: {
    marginTop: 20,
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1.7,
  },
  emptyTitle: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 27,
    lineHeight: 32,
    textAlign: "center",
  },
  emptyCopy: {
    maxWidth: 330,
    marginTop: 8,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  emptyButton: {
    width: "100%",
    maxWidth: 400,
    minHeight: 58,
    marginTop: 23,
    paddingLeft: 19,
    paddingRight: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: colors.text,
  },
  emptyButtonText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 10,
    letterSpacing: 0.45,
  },
  emptyButtonArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  emptyShortcuts: {
    width: "100%",
    maxWidth: 400,
    marginTop: 18,
    gap: 9,
  },
  emptyShortcut: {
    minHeight: 68,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: "#FCFCFA",
  },
  emptyShortcutIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF8EE",
  },
  emptyShortcutCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  emptyShortcutTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  emptyShortcutText: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 10,
  },
  emptyBenefits: {
    width: "100%",
    maxWidth: 400,
    marginTop: 22,
    paddingTop: 18,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  emptyBenefit: {
    flex: 1,
    alignItems: "center",
    gap: 7,
  },
  emptyBenefitText: {
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
  },
  removeSheet: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: "center",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFEFB",
  },
  sheetHandle: {
    width: 38,
    height: 4,
    marginTop: 8,
    borderRadius: 2,
    backgroundColor: "#D5D9D6",
  },
  removeSheetIcon: {
    width: 48,
    height: 48,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEDFD6",
    backgroundColor: "#F8EFE9",
  },
  removeTitle: {
    marginTop: 20,
    color: "#2D3A30",
    fontFamily: typography.semibold,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  removeName: {
    maxWidth: 330,
    marginTop: 10,
    color: "#7B8074",
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  removeActions: {
    width: "100%",
    marginTop: 26,
    flexDirection: "row",
    gap: 10,
  },
  cancelRemove: {
    minHeight: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DEE4D7",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#F2F5ED",
  },
  cancelRemoveText: {
    color: "#354B36",
    fontFamily: typography.medium,
    fontSize: 12,
    textAlign: "center",
  },
  confirmRemove: {
    minHeight: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#A35D4D",
  },
  confirmRemoveText: {
    color: colors.white,
    fontFamily: typography.medium,
    fontSize: 12,
  },
});
