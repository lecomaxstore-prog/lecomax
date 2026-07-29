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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { AppViewportOverlay } from "@/components/app-viewport";
import { CheckoutProgress } from "@/components/checkout-progress";
import { Screen } from "@/components/screen";
import { typography } from "@/constants/theme";
import { useSettings } from "@/hooks/use-catalog";
import { imageUrl, money } from "@/lib/format";
import { cartLineAvailableStock } from "@/lib/cart-reconciliation";
import { validateCoupon, type AppliedCoupon } from "@/services/coupons";
import { getFreshProducts } from "@/services/catalog";
import { getShippingQuote, type ShippingQuote } from "@/services/orders";
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
  const maximum = availableStock(line);
  const unavailable =
    maximum < 1 ||
    (line.color
      ? line.product.out_of_stock_colors?.includes(line.color)
      : false) ||
    (line.size ? line.product.out_of_stock_sizes?.includes(line.size) : false);
  const promotional =
    Boolean(line.product.original_price) &&
    Number(line.product.original_price) > line.product.price;
  const options = [line.color, line.size].filter(Boolean).join(" · ");

  return (
    <View style={styles.product}>
      <View style={styles.productTop}>
        <View style={styles.productImage}>
          <Image
            accessibilityLabel={line.product.name}
            cachePolicy="memory-disk"
            contentFit="contain"
            recyclingKey={keyFor(line)}
            source={imageUrl(
              line.product.thumbnail || line.product.images?.[0],
            )}
            style={StyleSheet.absoluteFill}
            transition={160}
          />
        </View>

        <View style={styles.productDetails}>
          <View style={styles.productHeading}>
            <Text
              maxFontSizeMultiplier={1.25}
              numberOfLines={3}
              style={styles.productName}
            >
              {line.product.name}
            </Text>
            <View style={styles.productActions}>
              <AnimatedPressable
                accessibilityLabel={
                  favourite
                    ? "Retirer des favoris"
                    : "Enregistrer dans les favoris"
                }
                accessibilityState={{ selected: favourite }}
                onPress={onToggleFavourite}
                pressedScale={0.88}
                style={styles.iconButton}
              >
                <Ionicons
                  color={favourite ? colors.primaryDark : colors.text}
                  name={favourite ? "heart" : "heart-outline"}
                  size={21}
                />
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityLabel={`Supprimer ${line.product.name}`}
                onPress={onRemove}
                pressedScale={0.88}
                style={styles.iconButton}
              >
                <Ionicons
                  color={colors.danger}
                  name="trash-outline"
                  size={20}
                />
              </AnimatedPressable>
            </View>
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
                ? "Article ou variante indisponible"
                : `Livraison estimée : ${estimate}`}
            </Text>
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
            accessibilityLabel="Réduire la quantité"
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
            accessibilityLabel="Augmenter la quantité"
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
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ADRESSE DE LIVRAISON</Text>
        {address ? (
          <AnimatedPressable
            accessibilityLabel="Modifier l’adresse de livraison"
            haptic={false}
            onPress={onEdit}
            style={styles.textAction}
          >
            <Text style={styles.textActionLabel}>Modifier</Text>
          </AnimatedPressable>
        ) : null}
      </View>

      {address ? (
        <AnimatedPressable
          accessibilityLabel={`Adresse sélectionnée : ${address.name}, ${address.address}, ${address.city}`}
          onPress={onSelect}
          pressedScale={0.99}
          style={styles.addressCard}
        >
          <View style={styles.addressCheck}>
            <Ionicons color={colors.white} name="checkmark" size={22} />
          </View>
          <View style={styles.addressCopy}>
            <Text numberOfLines={1} style={styles.addressName}>
              {address.name} · {address.phone}
            </Text>
            <Text numberOfLines={2} style={styles.addressLine}>
              {address.address}, {address.city}
            </Text>
          </View>
          <Ionicons color={colors.text} name="chevron-forward" size={23} />
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
            Ajoutez une adresse complète avant de continuer.
          </Text>
        </View>
      )}

      <AnimatedPressable
        accessibilityLabel="Ajouter une nouvelle adresse"
        onPress={onNew}
        pressedScale={0.985}
        style={styles.addAddress}
      >
        <Ionicons color={colors.text} name="add" size={24} />
        <Text style={styles.addAddressText}>Ajouter une nouvelle adresse</Text>
      </AnimatedPressable>
    </View>
  );
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCommerceStore((state) => state.cart);
  const wishlist = useCommerceStore((state) => state.wishlist);
  const couponCode = useCommerceStore((state) => state.coupon);
  const addToCart = useCommerceStore((state) => state.addToCart);
  const removeCartLine = useCommerceStore((state) => state.removeCartLine);
  const setLineQuantity = useCommerceStore((state) => state.setLineQuantity);
  const refreshCartProducts = useCommerceStore((state) => state.refreshCartProducts);
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
              `${result.removed.length} article${result.removed.length > 1 ? "s indisponibles ont" : " indisponible a"} été retiré${result.removed.length > 1 ? "s" : ""}`,
            );
          }
          if (result.adjusted.length) {
            messages.push(
              `la quantité de ${result.adjusted.length} article${result.adjusted.length > 1 ? "s a été ajustée" : " a été ajustée"} au stock disponible`,
            );
          }
          setStockNotice(`${messages.join(" et ")}.`);
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
  const estimate = settings.shipping_estimated_days?.trim() || "2–5 jours";
  const couponsEnabled = settings.enable_coupons !== "false";
  const configuredShipping = Number(settings.shipping_cost);
  const standardShipping =
    Number.isFinite(configuredShipping) && configuredShipping >= 0
      ? configuredShipping
      : 35;
  const configuredFreeThreshold = Number(settings.free_shipping_threshold);
  const freeShippingThreshold =
    Number.isFinite(configuredFreeThreshold) && configuredFreeThreshold > 0
      ? configuredFreeThreshold
      : 0;
  const estimatedShipping =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
      ? 0
      : standardShipping;
  const shipping = shippingQuote?.cost ?? estimatedShipping;
  const discount = couponCode ? (appliedCoupon?.discount ?? 0) : 0;
  const total = Math.max(0, subtotal + (shipping ?? 0) - discount);

  useEffect(() => {
    if (!activeAddress?.city || !cart.length) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setShippingLoading(true);
      setShippingError(undefined);
      try {
        const quote = await getShippingQuote(activeAddress.city, subtotal);
        if (active) setShippingQuote(quote);
      } catch (error) {
        if (!active) return;
        setShippingQuote(undefined);
        setShippingError(
          error instanceof Error
            ? error.message
            : "Livraison indisponible pour le moment.",
        );
      } finally {
        if (active) setShippingLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [activeAddress?.city, cart.length, subtotal]);

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
          error instanceof Error ? error.message : "Code promo invalide.",
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
      setCouponError("Saisissez un code promotionnel.");
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
          ? error.message
          : "Ce code ne peut pas être appliqué.",
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const continueToCheckout = () => {
    if (!activeAddress) {
      setAddressNotice(true);
      Alert.alert(
        "Adresse requise",
        "Ajoutez une adresse de livraison complète pour continuer.",
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
          <Text style={styles.emptyEyebrow}>VOTRE SÉLECTION</Text>
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyCopy}>
            Découvrez nos collections et composez une sélection qui vous ressemble.
          </Text>
          <AnimatedPressable
            accessibilityLabel="Découvrir les produits"
            onPress={() => router.push("/catalog")}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>CONTINUER MES ACHATS</Text>
            <View style={styles.emptyButtonArrow}>
              <Ionicons color={colors.text} name="arrow-forward" size={17} />
            </View>
          </AnimatedPressable>

          <View style={styles.emptyShortcuts}>
            <AnimatedPressable
              accessibilityLabel="Voir les nouveautés"
              onPress={() => router.push("/catalog?sort=new")}
              style={styles.emptyShortcut}
            >
              <View style={styles.emptyShortcutIcon}>
                <Ionicons color={colors.primaryDark} name="sparkles-outline" size={18} />
              </View>
              <View style={styles.emptyShortcutCopy}>
                <Text style={styles.emptyShortcutTitle}>Nouveautés</Text>
                <Text style={styles.emptyShortcutText}>Les dernières pièces</Text>
              </View>
              <Ionicons color={colors.text} name="chevron-forward" size={16} />
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel="Voir les promotions"
              onPress={() => router.push("/catalog?sort=low")}
              style={styles.emptyShortcut}
            >
              <View style={styles.emptyShortcutIcon}>
                <Ionicons color={colors.primaryDark} name="pricetag-outline" size={18} />
              </View>
              <View style={styles.emptyShortcutCopy}>
                <Text style={styles.emptyShortcutTitle}>Promotions</Text>
                <Text style={styles.emptyShortcutText}>Nos meilleures offres</Text>
              </View>
              <Ionicons color={colors.text} name="chevron-forward" size={16} />
            </AnimatedPressable>
          </View>

          <View style={styles.emptyBenefits}>
            {([
              ["shield-checkmark-outline", "Paiement sécurisé"],
              ["car-outline", "Livraison suivie"],
              ["refresh-outline", "Retours simplifiés"],
            ] as const).map(([icon, label]) => (
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
          contentContainerStyle={{
            paddingBottom: 112 + Math.max(insets.bottom, 8),
          }}
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>VOTRE COMMANDE</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {itemCount} ARTICLE{itemCount > 1 ? "S" : ""}
                </Text>
              </View>
            </View>
            {cart.map((line) => (
              <CartItem
                busy={busyLine === keyFor(line)}
                estimate={shippingQuote?.estimatedDays || estimate}
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
              <Text style={styles.fieldLabel}>CODE PROMO</Text>
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
                  accessibilityLabel="Code promotionnel"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!validatingCoupon && !appliedCoupon}
                  onChangeText={(value) => {
                    setCouponInput(value);
                    setCouponError(undefined);
                  }}
                  onSubmitEditing={() => void applyCoupon()}
                  placeholder="Saisissez votre code"
                  placeholderTextColor="#8A8F8B"
                  returnKeyType="done"
                  selectionColor={colors.primary}
                  style={[styles.couponInput, webInputReset]}
                  value={couponInput}
                />
                {appliedCoupon ? (
                  <AnimatedPressable
                    accessibilityLabel="Retirer le code promotionnel"
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
                    accessibilityLabel="Appliquer le code promotionnel"
                    accessibilityState={{ busy: validatingCoupon }}
                    disabled={validatingCoupon}
                    onPress={() => void applyCoupon()}
                    style={styles.applyCoupon}
                  >
                    {validatingCoupon ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.applyCouponText}>APPLIQUER</Text>
                    )}
                  </AnimatedPressable>
                )}
              </View>
              {appliedCoupon ? (
                <Text accessibilityLiveRegion="polite" style={styles.couponOk}>
                  {appliedCoupon.code} appliqué · −
                  {money(appliedCoupon.discount)}
                </Text>
              ) : couponError ? (
                <Text accessibilityRole="alert" style={styles.couponError}>
                  {couponError}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.summary}>
            <SummaryRow label="Sous-total" value={money(subtotal)} />
            {discount > 0 ? (
              <SummaryRow
                accent
                label={`Remise${appliedCoupon ? ` · ${appliedCoupon.code}` : ""}`}
                value={`−${money(discount)}`}
              />
            ) : null}
            <SummaryRow
              accent={shipping === 0}
              label="Livraison"
              loading={shippingLoading}
              value={
                shipping === 0 ? "OFFERTE" : money(shipping)
              }
            />
            {shippingError ? (
              <Text accessibilityRole="alert" style={styles.shippingError}>
                {shippingError}
              </Text>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
                <Text style={styles.taxLabel}>Taxes incluses</Text>
              </View>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>

          <View style={styles.trust}>
            <TrustItem
              icon="lock-closed-outline"
              label={
                settings.checkout_trust_payment?.trim() || "Paiement sécurisé"
              }
            />
            <View style={styles.trustDivider} />
            <TrustItem
              icon="refresh-outline"
              label={
                settings.checkout_trust_returns?.trim() || "Retours faciles"
              }
            />
            <View style={styles.trustDivider} />
            <TrustItem
              icon="headset-outline"
              label={settings.checkout_contact_title?.trim() || "Assistance"}
            />
          </View>

          {removedLine ? (
            <View accessibilityLiveRegion="polite" style={styles.undo}>
              <Text numberOfLines={1} style={styles.undoText}>
                Article retiré du panier
              </Text>
              <AnimatedPressable
                accessibilityLabel="Annuler la suppression"
                haptic={false}
                onPress={undoRemoval}
                style={styles.undoButton}
              >
                <Text style={styles.undoButtonText}>ANNULER</Text>
              </AnimatedPressable>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.sticky,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <AnimatedPressable
            accessibilityLabel="Continuer vers le paiement"
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
            <View style={styles.checkoutIcon}>
              <Ionicons
                color={colors.primary}
                name="shield-checkmark-outline"
                size={20}
              />
            </View>
            <View style={styles.checkoutCopy}>
              <Text style={styles.checkoutButtonText}>CONTINUER AU PAIEMENT</Text>
              <Text style={styles.checkoutButtonHint}>Paiement 100 % sécurisé</Text>
            </View>
            <View style={styles.checkoutArrow}>
              <Ionicons color={colors.text} name="arrow-forward" size={18} />
            </View>
          </AnimatedPressable>
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setRemoveCandidate(undefined)}
          transparent
          visible={Boolean(removeCandidate)}
        >
          <AppViewportOverlay align="bottom">
            <Pressable
              accessibilityLabel="Fermer la confirmation"
              onPress={() => setRemoveCandidate(undefined)}
              style={styles.modalBackdrop}
            />
            <View style={styles.removeSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.removeSheetIcon}>
                <Ionicons
                  color={colors.danger}
                  name="trash-outline"
                  size={23}
                />
              </View>
              <Text style={styles.removeTitle}>Supprimer cet article ?</Text>
              <Text numberOfLines={2} style={styles.removeName}>
                {removeCandidate?.product.name}
              </Text>
              <View style={styles.removeActions}>
                <AnimatedPressable
                  accessibilityLabel="Annuler la suppression"
                  haptic={false}
                  onPress={() => setRemoveCandidate(undefined)}
                  style={styles.cancelRemove}
                >
                  <Text style={styles.cancelRemoveText}>ANNULER</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityLabel="Confirmer la suppression"
                  onPress={confirmRemoval}
                  style={styles.confirmRemove}
                >
                  <Text style={styles.confirmRemoveText}>SUPPRIMER</Text>
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
  return (
    <View style={styles.header}>
      <AnimatedPressable
        accessibilityLabel="Retour"
        onPress={() => router.back()}
        style={styles.headerButton}
      >
        <Ionicons color={colors.text} name="arrow-back" size={25} />
      </AnimatedPressable>
      <View style={styles.headerCopy}>
        <Text style={styles.headerTitle}>MON PANIER</Text>
        <Text style={styles.headerSubtitle}>
          {itemCount} article{itemCount === 1 ? "" : "s"}
        </Text>
      </View>
      <View accessibilityLabel="Paiement sécurisé" style={styles.headerSecure}>
        <Ionicons color={colors.primaryDark} name="shield-checkmark-outline" size={21} />
      </View>
    </View>
  );
}

function StockNotice({ message }: { message: string }) {
  return (
    <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.stockNotice}>
      <View style={styles.stockNoticeIcon}>
        <Ionicons color={colors.primaryDark} name="refresh" size={17} />
      </View>
      <View style={styles.stockNoticeCopy}>
        <Text style={styles.stockNoticeTitle}>PANIER MIS À JOUR</Text>
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
  flex: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
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
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  headerCopy: { alignItems: "center" },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 19,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 11,
  },
  headerSecure: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#EAF8EE",
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
  section: { padding: 18, borderTopWidth: 1, borderColor: colors.border },
  sectionHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  textAction: {
    minWidth: 72,
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#EAF8EE",
  },
  textActionLabel: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
    fontSize: 10.5,
  },
  addressCard: {
    minHeight: 96,
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#85D69D",
    borderRadius: 16,
    backgroundColor: "#F5FBF7",
  },
  addressCheck: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.primaryDark,
  },
  addressCopy: { minWidth: 0, flex: 1, marginHorizontal: 14 },
  addressName: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 13.5,
  },
  addressLine: {
    marginTop: 5,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 10.5,
    lineHeight: 15,
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
    fontSize: 10,
  },
  addAddress: {
    minHeight: 54,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#BFC5C0",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#FCFCFB",
  },
  addAddressText: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  divider: { height: 10, backgroundColor: "#F4F6F3" },
  orderSection: { paddingHorizontal: 18, paddingTop: 22 },
  countBadge: {
    minHeight: 30,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#EAF8EE",
  },
  countBadgeText: {
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
  },
  product: {
    marginTop: 13,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E0E4E0",
    borderRadius: 16,
    backgroundColor: "#FCFCFB",
  },
  productTop: { flexDirection: "row" },
  productImage: {
    width: 104,
    height: 122,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  productDetails: { minWidth: 0, flex: 1, marginLeft: 13 },
  productHeading: { flexDirection: "row", alignItems: "flex-start" },
  productName: {
    minWidth: 0,
    flex: 1,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 13.5,
    lineHeight: 18,
  },
  productActions: { marginLeft: 3, gap: 1 },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  category: {
    marginTop: 8,
    color: colors.primaryDark,
    fontFamily: typography.black,
    fontSize: 8,
    letterSpacing: 1,
  },
  options: {
    marginTop: 7,
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 10.5,
  },
  deliveryLine: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  deliveryText: {
    minWidth: 0,
    flex: 1,
    color: colors.primaryDark,
    fontFamily: typography.semibold,
    fontSize: 9,
    lineHeight: 13,
  },
  unavailableText: { color: colors.danger },
  productBottom: {
    marginTop: 15,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  linePrice: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
  },
  linePricePromotion: { color: colors.danger },
  oldPrice: {
    marginTop: 3,
    color: "#8A8E8B",
    fontFamily: typography.medium,
    fontSize: 10,
    textDecorationLine: "line-through",
  },
  quantity: {
    height: 42,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C9CECA",
    borderRadius: 12,
  },
  quantityButton: {
    width: 42,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  quantityPressed: { backgroundColor: colors.surface },
  quantityValue: {
    width: 42,
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
  couponSection: { padding: 16 },
  fieldLabel: {
    marginBottom: 8,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 1,
  },
  couponControl: {
    minHeight: 56,
    paddingLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C9CECA",
    borderRadius: 9,
    backgroundColor: colors.white,
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
    height: 54,
    flex: 1,
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 11,
    backgroundColor: "transparent",
  },
  applyCoupon: {
    minWidth: 112,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  applyCouponText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 9,
    letterSpacing: 0.5,
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
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  summaryRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.secondaryText,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: typography.bold,
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
    height: 1,
    marginVertical: 10,
    backgroundColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 16,
  },
  taxLabel: {
    marginTop: 3,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 9,
  },
  totalValue: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 23,
    letterSpacing: -0.6,
  },
  trust: {
    minHeight: 74,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  trustItem: { minWidth: 0, flex: 1, alignItems: "center", gap: 6 },
  trustText: {
    color: colors.text,
    fontFamily: typography.semibold,
    fontSize: 8,
    lineHeight: 11,
    textAlign: "center",
  },
  trustDivider: { width: 1, height: 34, backgroundColor: colors.border },
  undo: {
    minHeight: 50,
    margin: 16,
    paddingLeft: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9,
    backgroundColor: colors.text,
  },
  undoText: {
    minWidth: 0,
    flex: 1,
    color: colors.white,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  undoButton: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  undoButtonText: {
    color: colors.primary,
    fontFamily: typography.black,
    fontSize: 9,
  },
  sticky: {
    paddingHorizontal: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  checkoutButton: {
    minHeight: 60,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 14,
    backgroundColor: colors.text,
    shadowColor: "#0B0B0B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  checkoutButtonDisabled: { opacity: 0.52 },
  checkoutButtonText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  checkoutCopy: {
    minWidth: 0,
    flex: 1,
    marginHorizontal: 9,
    alignItems: "center",
  },
  checkoutButtonHint: {
    marginTop: 3,
    color: "#B7BDB8",
    fontFamily: typography.medium,
    fontSize: 8,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  checkoutIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#1B211C",
  },
  checkoutArrow: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.primary,
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
    paddingHorizontal: 20,
    paddingBottom: 22,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
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
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFF0F0",
  },
  removeTitle: {
    marginTop: 13,
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 18,
  },
  removeName: {
    maxWidth: 330,
    marginTop: 6,
    color: colors.secondaryText,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  removeActions: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  cancelRemove: {
    minHeight: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },
  cancelRemoveText: {
    color: colors.text,
    fontFamily: typography.black,
    fontSize: 9,
  },
  confirmRemove: {
    minHeight: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.danger,
  },
  confirmRemoveText: {
    color: colors.white,
    fontFamily: typography.black,
    fontSize: 9,
  },
});
