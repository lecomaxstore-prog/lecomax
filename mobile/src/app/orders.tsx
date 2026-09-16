import { LIVE_QUERY_OPTIONS } from "@/lib/store-sync";
import { PreorderNotice } from "@/components/preorder-notice";
import { localizedContent, paymentStatusLabel } from "@/i18n/content";
import { currentLocale, msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { imageUrl, money } from "@/lib/format";
import { getCustomerOrders, type CustomerOrder } from "@/services/orders";

const STATUS: Record<
  string,
  { label: string; color: string; background: string }
> = {
  pending: { get label() { return msg("orders.pending"); }, color: "#8A5B00", background: "#FFF3D7" },
  confirmed: { get label() { return msg("orders.confirmed"); }, color: "#116530", background: "#E9F7ED" },
  processing: {
    get label() { return msg("orderTracking.preparing"); },
    color: "#155E75",
    background: "#E8F6FA",
  },
  shipped: { get label() { return msg("orderTracking.shipped"); }, color: "#1D4ED8", background: "#EAF0FF" },
  delivered: { get label() { return msg("orderTracking.delivered"); }, color: "#116530", background: "#E9F7ED" },
  cancelled: { get label() { return msg("orders.cancelled"); }, color: "#A52A2A", background: "#FDECEC" },
};

function statusFor(status: string) {
  return (
    STATUS[status] ?? {
      label: msg("orders.inProgress"),
      color: palette.ink,
      background: "#F0F2F0",
    }
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  useLocale();
  const [expanded, setExpanded] = useState(false);
  const status = statusFor(order.status);
  const date = new Intl.DateTimeFormat(currentLocale(), { dateStyle: "medium" }).format(
    new Date(order.created_at),
  );

  return (
    <View
      style={{
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E1E5E2",
        borderRadius: 20,
        backgroundColor: palette.white,
      }}
    >
      <Pressable
        accessibilityLabel={msg("orders.orderNumber", { number: order.order_number })}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={{
          minHeight: 96,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            backgroundColor: "#EDF8F0",
          }}
        >
          <Ionicons
            name="bag-check-outline"
            size={21}
            color={palette.greenDark}
          />
        </View>
        <View style={{ minWidth: 0, marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              color: palette.ink,
              fontFamily: typography.black,
              fontSize: 13,
            }}
          >
            {order.order_number}
          </Text>
          <Text
            style={{
              marginTop: 5,
              color: palette.muted,
              fontFamily: typography.medium,
              fontSize: 9.5,
            }}
          >
            {date} · {msg("counts.items", { count: order.items.length })}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 9,
              backgroundColor: status.background,
            }}
          >
            <Text
              style={{
                color: status.color,
                fontFamily: typography.black,
                fontSize: 7.5,
                textTransform: "uppercase",
              }}
            >
              {status.label}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: palette.ink,
              fontFamily: typography.black,
              fontSize: 15,
            }}
          >
            {money(Number(order.total))}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={17}
            color={palette.muted}
            style={{ marginTop: 11 }}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: "#E9ECEA",
            backgroundColor: "#FAFBFA",
          }}
        >
          {order.items.map((item, index) => (
            <View
              key={`${item.slug}-${index}`}
              style={{
                minHeight: 64,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  overflow: "hidden",
                  borderRadius: 12,
                  backgroundColor: "#F0F2F0",
                }}
              >
                <Image
                  source={imageUrl(item.image)}
                  contentFit="contain"
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <View style={{ minWidth: 0, marginLeft: 10, flex: 1 }}>
                <Text
                  numberOfLines={2}
                  style={{
                    color: palette.ink,
                    fontFamily: typography.bold,
                    fontSize: 10.5,
                  }}
                >
                  {item.name}
                </Text>
              <PreorderNotice item={item} />
                <Text
                  style={{
                    marginTop: 4,
                    color: palette.muted,
                    fontFamily: typography.medium,
                    fontSize: 8.5,
                  }}
                >
                  ×{item.qty}
                  {item.color ? ` · ${localizedContent(item.color)}` : ""}
                  {item.size ? ` · ${item.size}` : ""}
                </Text>
              </View>
              <Text
                style={{
                  marginLeft: 8,
                  color: palette.ink,
                  fontFamily: typography.bold,
                  fontSize: 10,
                }}
              >
                {money(Number(item.price) * item.qty)}
              </Text>
            </View>
          ))}
          {order.tracking_number ? (
            <View
              style={{
                marginTop: 6,
                padding: 12,
                flexDirection: "row",
                borderRadius: 13,
                backgroundColor: "#EDF8F0",
              }}
            >
              <Ionicons
                name="navigate-circle-outline"
                size={19}
                color={palette.greenDark}
              />
              <Text
                selectable
                style={{
                  marginLeft: 8,
                  flex: 1,
                  color: palette.greenDark,
                  fontFamily: typography.bold,
                  fontSize: 9.5,
                }}
              >
                {msg("orders.tracking")}{" "}{order.tracking_number}
              </Text>
            </View>
          ) : null}
          {order.customer?.address ? (
            <Text
              style={{
                marginTop: 13,
                color: palette.muted,
                fontFamily: typography.medium,
                fontSize: 9.5,
                lineHeight: 15,
              }}
            >
              {msg("orders.delivery")}{" "}{order.customer.address}, {order.customer.city}
            </Text>
          ) : null}
          <Text
            style={{
              marginTop: 8,
              color: palette.muted,
              fontFamily: typography.medium,
              fontSize: 9.5,
            }}
          >
            {msg("orders.payment")}{" "}{order.payment_method === "cod" ? msg("orders.cod") : order.payment_method === "paypal" ? "PayPal" : "—"} ·{" "}
            {paymentStatusLabel(order.payment_status)}
          </Text>
          <AnimatedPressable
            accessibilityLabel={msg("orders.trackOrderNumber", { number: order.order_number })}
            onPress={() =>
              router.push({
                pathname: "/order-tracking",
                params: { orderNumber: order.order_number },
              })
            }
            style={{
              minHeight: 48,
              marginTop: 15,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 14,
              backgroundColor: palette.ink,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="navigate-outline" size={17} color={palette.green} />
              <Text style={{ color: palette.white, fontFamily: typography.black, fontSize: 10 }}>
                {msg("orderTracking.trackOrderUppercase")}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={palette.green} />
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel={msg("orders.supportForOrder", { number: order.order_number })}
            onPress={() => router.push({ pathname: "/support", params: { orderNumber: order.order_number } })}
            style={{
              minHeight: 48,
              marginTop: 9,
              paddingHorizontal: 15,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: "#DDE4DE",
              borderRadius: 14,
              backgroundColor: palette.white,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="headset-outline" size={17} color={palette.greenDark} />
              <Text style={{ color: palette.ink, fontFamily: typography.black, fontSize: 10 }}>
                {msg("orders.contactSupportUppercase")}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={palette.greenDark} />
          </AnimatedPressable>
        </View>
      ) : null}
    </View>
  );
}

export default function OrdersScreen() {
  useLocale();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["customer-orders"],
    queryFn: getCustomerOrders,
  });

  return (
    <Screen className="bg-white">
      <View
        style={{
          height: 76,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#E9ECEA",
        }}
      >
        <AnimatedPressable
          accessibilityLabel={msg("addresses.back")}
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 22,
            backgroundColor: "#F3F5F3",
          }}
        >
          <Ionicons name="arrow-back" size={23} color={palette.ink} />
        </AnimatedPressable>
        <Text
          style={{
            marginLeft: 14,
            color: palette.ink,
            fontFamily: typography.black,
            fontSize: 22,
          }}
        >
          {msg("common.orders")}</Text>
      </View>

      {query.isPending ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={palette.greenDark} />
          <Text
            style={{
              marginTop: 12,
              color: palette.muted,
              fontFamily: typography.medium,
            }}
          >
            {msg("orders.loadingOrders")}</Text>
        </View>
      ) : query.isError ? (
        <View
          style={{
            flex: 1,
            paddingHorizontal: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={palette.greenDark}
          />
          <Text
            style={{
              marginTop: 18,
              color: palette.ink,
              fontFamily: typography.black,
              fontSize: 20,
              textAlign: "center",
            }}
          >
            {msg("orders.signInToViewYourOrders")}</Text>
          <Text
            style={{
              marginTop: 9,
              color: palette.muted,
              fontFamily: typography.regular,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            {msg("orders.yourHistoryIsProtectedAndLinkedToTheSameAccountAsThe")}</Text>
          <AnimatedPressable
            accessibilityLabel={msg("auth.signInText")}
            onPress={() => router.push("/auth")}
            style={{
              height: 52,
              marginTop: 24,
              paddingHorizontal: 26,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 26,
              backgroundColor: palette.ink,
            }}
          >
            <Text
              style={{ color: palette.white, fontFamily: typography.black }}
            >
              {msg("auth.signInText")}</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor={palette.greenDark}
            />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 20) + 20,
          }}
        >
          {!query.data?.length ? (
            <View
              style={{
                minHeight: 450,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="receipt-outline"
                size={46}
                color={palette.greenDark}
              />
              <Text
                style={{
                  marginTop: 17,
                  color: palette.ink,
                  fontFamily: typography.black,
                  fontSize: 20,
                }}
              >
                {msg("orders.noOrdersYet")}</Text>
              <Text
                style={{
                  marginTop: 8,
                  color: palette.muted,
                  fontFamily: typography.regular,
                  textAlign: "center",
                }}
              >
                {msg("orders.yourFutureOrdersWillAppearHere")}</Text>
            </View>
          ) : (
            query.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
