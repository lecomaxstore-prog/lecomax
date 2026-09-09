import { storeSettings } from "@/lib/store-settings";
import { money } from "@/lib/format";
import { localizedContent } from "@/i18n/content";
import { msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useProduct, useSettings } from "@/hooks/use-catalog";

type Topic = "delivery-dates" | "delivery-coverage" | "stock";

const colorSwatches: Record<string, string> = {
  "Gris Clair": "#D9DCDD",
  Gris: "#8C9396",
  Kaki: "#918569",
  Noir: "#151515",
  Blanc: "#FFFFFF",
  Bleu: "#2E75BB",
  Jaune: "#F4C62B",
  Rose: "#EAA9B5",
};

function InformationRow({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  useLocale();
  return (
    <View className="flex-row border-b border-neutral-100 py-5 last:border-b-0 dark:border-neutral-800">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
        <Ionicons name={icon} size={19} color="#168526" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-[14px] font-black text-ink dark:text-white">
          {title}
        </Text>
        <Text className="mt-1.5 text-[12px] leading-5 text-muted">
          {detail}
        </Text>
      </View>
    </View>
  );
}

function TimelineRow({
  step,
  title,
  detail,
  timing,
  last = false,
}: {
  step: number;
  title: string;
  detail: string;
  timing: string;
  last?: boolean;
}) {
  useLocale();
  return (
    <View style={{ minHeight: last ? 70 : 91, flexDirection: "row" }}>
      <View style={{ width: 38, alignItems: "center" }}>
        <View
          style={{
            zIndex: 2,
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: step === 1 ? "#149E64" : "#CFE7D7",
            borderRadius: 16,
            backgroundColor: step === 1 ? "#149E64" : "#F0F8F3",
          }}
        >
          {step === 1 ? (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: "#087A4B",
                fontFamily: "Inter_900Black",
                fontSize: 11,
              }}
            >
              {step}
            </Text>
          )}
        </View>
        {!last ? (
          <View style={{ width: 1, flex: 1, backgroundColor: "#DDE7E0" }} />
        ) : null}
      </View>
      <View
        style={{
          minWidth: 0,
          paddingLeft: 12,
          paddingBottom: last ? 0 : 20,
          flex: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: "#111111",
              fontFamily: "Inter_900Black",
              fontSize: 13,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#087A4B",
              fontFamily: "Inter_700Bold",
              fontSize: 8.5,
            }}
          >
            {timing}
          </Text>
        </View>
        <Text
          style={{
            marginTop: 6,
            color: "#6F7570",
            fontFamily: "Inter_500Medium",
            fontSize: 10,
            lineHeight: 16,
          }}
        >
          {detail}
        </Text>
      </View>
    </View>
  );
}

export default function ProductInformationScreen() {
  useLocale();
  const { topic = "delivery-dates", slug = "" } = useLocalSearchParams<{
    topic: Topic;
    slug: string;
  }>();
  const { data: product } = useProduct(slug);
  const { data: settings = [] } = useSettings();
  const values = storeSettings(Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  ));
  const estimatedDays =
    localizedContent(values.shipping_estimated_days?.trim()) || msg("orderConfirmation.25BusinessDays");
  const shippingCost = values.shipping_cost;
  const freeThreshold = values.free_shipping_threshold;

  const colorSizes = product?.color_sizes;
  const colorAvailable = (color: string) => {
    if (!product || (product.out_of_stock_colors ?? []).includes(color))
      return false;
    const quantity = product.color_stock?.[color];
    return quantity === undefined ? product.stock > 0 : quantity > 0;
  };
  const availableColorCount =
    product?.colors?.filter(colorAvailable).length ?? 0;
  const configuration = {
    "delivery-dates": {
      eyebrow: msg("support.delivery"),
      title: msg("topic.whenWillYouReceiveYourOrder"),
      summary: msg("delivery.estimatedWithin", { estimate: estimatedDays }),
      icon: "calendar-outline" as const,
    },
    "delivery-coverage": {
      eyebrow: msg("topic.coverage"),
      title: msg("topic.deliveryThroughoutMorocco"),
      summary: msg("topic.yourOrderIsTrackedUntilItArrives"),
      icon: "location-outline" as const,
    },
    stock: {
      eyebrow: msg("topic.availability"),
      title: product?.name || msg("topic.productStock"),
      summary: product?.stock
        ? msg("stock.availableUnits", { count: product.stock })
        : msg("topic.productCurrentlySoldOut"),
      icon: "cube-outline" as const,
    },
  }[topic] ?? {
    eyebrow: msg("topic.information"),
    title: msg("topic.productInformation"),
    summary: msg("topic.everythingYouNeedToKnowBeforeBuying"),
    icon: "information-circle-outline" as const,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6F5] dark:bg-ink" edges={["top"]}>
      <View className="flex-row items-center border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <AnimatedPressable
          accessibilityLabel={msg("addresses.back")}
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 21,
            backgroundColor: "#F3F4F3",
          }}
        >
          <Ionicons name="arrow-back" size={21} color="#111111" />
        </AnimatedPressable>
        <View className="flex-1 items-center">
          <Text className="text-[9px] font-black uppercase tracking-[1.6px] text-green">
            {configuration.eyebrow}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-1 text-[16px] font-black text-ink dark:text-white"
          >
            {topic === "delivery-dates"
              ? msg("topic.deliveryTracking")
              : topic === "delivery-coverage"
                ? msg("topic.deliveryAreas")
                : msg("topic.stockOptions")}
          </Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 21,
            backgroundColor: "#ECF8EF",
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#149E64" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 56 }}
      >
        {topic === "delivery-dates" ? (
          <View
            style={{
              overflow: "hidden",
              padding: 22,
              borderWidth: 1,
              borderColor: "#CFE7D7",
              borderRadius: 24,
              backgroundColor: "#F0F8F3",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 13,
                  backgroundColor: "#149E64",
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    color: "#087A4B",
                    fontFamily: "Inter_900Black",
                    fontSize: 8,
                    letterSpacing: 1.35,
                  }}
                >
                  {msg("topic.estimatedTimeUppercase")}</Text>
                <Text
                  style={{
                    marginTop: 3,
                    color: "#111111",
                    fontFamily: "Inter_500Medium",
                    fontSize: 10,
                  }}
                >
                  {msg("topic.afterOrderConfirmation")}</Text>
              </View>
            </View>
            <Text
              style={{
                marginTop: 22,
                color: "#111111",
                fontFamily: "Inter_900Black",
                fontSize: 28,
                letterSpacing: -0.8,
              }}
            >
              {estimatedDays}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: "#5F6E64",
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                lineHeight: 18,
              }}
            >
              {msg("topic.aClearEstimateFromProcessingYourOrderToDelivery")}</Text>
          </View>
        ) : topic === "delivery-coverage" ? (
          <View
            style={{
              overflow: "hidden",
              padding: 22,
              borderWidth: 1,
              borderColor: "#CFE7D7",
              borderRadius: 24,
              backgroundColor: "#F0F8F3",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 13,
                  backgroundColor: "#149E64",
                }}
              >
                <Ionicons name="location-outline" size={21} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    color: "#087A4B",
                    fontFamily: "Inter_900Black",
                    fontSize: 8,
                    letterSpacing: 1.35,
                  }}
                >
                  {msg("topic.deliveryAreaUppercase")}</Text>
                <Text
                  style={{
                    marginTop: 3,
                    color: "#5F6E64",
                    fontFamily: "Inter_500Medium",
                    fontSize: 10,
                  }}
                >
                  {msg("topic.nationwideTrackedDelivery")}</Text>
              </View>
            </View>
            <Text
              style={{
                marginTop: 22,
                color: "#111111",
                fontFamily: "Inter_900Black",
                fontSize: 29,
                letterSpacing: -0.9,
              }}
            >
              {msg("trustStrip.acrossMorocco")}</Text>
            <Text
              style={{
                marginTop: 8,
                color: "#5F6E64",
                fontFamily: "Inter_500Medium",
                fontSize: 11,
                lineHeight: 18,
              }}
            >
              {msg("topic.majorCitiesSmallerTownsAndAreasCoveredByOurDeliveryPartners")}</Text>
          </View>
        ) : topic === "stock" ? (
          <View
            style={{
              overflow: "hidden",
              padding: 22,
              borderWidth: 1,
              borderColor: "#CFE7D7",
              borderRadius: 24,
              backgroundColor: "#F0F8F3",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 13,
                  backgroundColor: "#149E64",
                }}
              >
                <Ionicons name="cube-outline" size={21} color="#FFFFFF" />
              </View>
              <View
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: product?.stock ? "#DDF4E4" : "#ECEEEC",
                }}
              >
                <Text
                  style={{
                    color: product?.stock ? "#087A4B" : "#747A76",
                    fontFamily: "Inter_900Black",
                    fontSize: 8,
                    letterSpacing: 0.7,
                  }}
                >
                  {product?.stock ? msg("homePromotionSection.inStockUppercase") : msg("homePromotionSection.soldOutUppercase")}
                </Text>
              </View>
            </View>
            <Text
              style={{
                marginTop: 20,
                color: "#111111",
                fontFamily: "Inter_900Black",
                fontSize: 22,
                lineHeight: 28,
                letterSpacing: -0.55,
              }}
            >
              {product?.name || msg("topic.productAvailability")}
            </Text>
            <Text
              style={{
                marginTop: 9,
                color: "#087A4B",
                fontFamily: "Inter_700Bold",
                fontSize: 10.5,
              }}
            >
              {product?.stock
                ? msg("stock.availableUnits", { count: product.stock })
                : msg("topic.productCurrentlyUnavailable")}
            </Text>
          </View>
        ) : (
          <View className="rounded-[26px] bg-ink px-6 py-7">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-green">
              <Ionicons name={configuration.icon} size={23} color="#FFFFFF" />
            </View>
            <Text className="mt-6 text-[28px] font-black leading-8 tracking-[-0.8px] text-white">
              {configuration.title}
            </Text>
            <Text className="mt-3 text-[14px] leading-6 text-white/65">
              {configuration.summary}
            </Text>
          </View>
        )}

        {topic === "delivery-dates" ? (
          <View
            style={{
              marginTop: 16,
              paddingHorizontal: 18,
              paddingTop: 19,
              paddingBottom: 16,
              borderWidth: 1,
              borderColor: "#E3E7E4",
              borderRadius: 22,
              backgroundColor: "#FFFFFF",
            }}
          >
            <Text
              style={{
                marginBottom: 18,
                color: "#111111",
                fontFamily: "Inter_900Black",
                fontSize: 15,
              }}
            >
              {msg("topic.yourOrderSJourney")}</Text>
            <TimelineRow
              step={1}
              title={msg("orderConfirmation.orderConfirmed")}
              timing={msg("topic.instant")}
              detail={msg("topic.yourOrderIsReceivedAndYourConfirmationIsSentToYou")}
            />
            <TimelineRow
              step={2}
              title={msg("orderConfirmation.preparation")}
              timing={msg("topic.2448Hours")}
              detail={msg("topic.yourItemsAreCheckedPackedAndHandedToTheCarrier")}
            />
            <TimelineRow
              step={3}
              last
              title={msg("support.delivery")}
              timing={estimatedDays}
              detail={msg("topic.theDriverWillContactYouBeforeArrivingExcludingSundaysAndPublicHolidays")}
            />
          </View>
        ) : null}

        {topic === "delivery-coverage" ? (
          <>
            <View
              style={{
                height: 82,
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E2E7E3",
                borderRadius: 20,
                backgroundColor: "#FFFFFF",
              }}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: "#111111",
                    fontFamily: "Inter_900Black",
                    fontSize: 20,
                  }}
                >
                  {shippingCost} MAD
                </Text>
                <Text
                  style={{
                    marginTop: 5,
                    color: "#757B76",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 8.5,
                  }}
                >
                  {msg("topic.deliveryFeesUppercase")}</Text>
              </View>
              <View
                style={{ width: 1, height: 42, backgroundColor: "#E3E6E4" }}
              />
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    color: "#149E64",
                    fontFamily: "Inter_900Black",
                    fontSize: 20,
                  }}
                >
                  {values.free_shipping_enabled === "false" ? "?" : money(0)}
                </Text>
                <Text
                  style={{
                    marginTop: 5,
                    color: "#757B76",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 8.5,
                  }}
                >
                  {values.free_shipping_enabled === "false" ? "?" : `${msg("topic.fromUppercase")}${freeThreshold} ${values.currency}`}
                </Text>
              </View>
            </View>
            <View className="mt-4 rounded-[22px] bg-white px-5 dark:bg-neutral-900">
              <Text
                style={{
                  paddingTop: 19,
                  color: "#111111",
                  fontFamily: "Inter_900Black",
                  fontSize: 15,
                }}
              >
                {msg("topic.yourDelivery")}</Text>
              <InformationRow
                icon="map-outline"
                title={msg("topic.allCitiesInMorocco")}
                detail={msg("topic.casablancaRabatMarrakechTangierAgadirFezAndCoveredAreas")}
              />
              <InformationRow
                icon="navigate-outline"
                title={msg("topic.trackingIncluded")}
                detail={msg("topic.yourTrackingNumberIsSentOnceTheParcelIsCollected")}
              />
              <InformationRow
                icon="call-outline"
                title={msg("topic.receivingYourParcel")}
                detail={msg("topic.theDriverMayCallBeforeArrivingKeepYourPhoneAvailable")}
              />
            </View>
          </>
        ) : null}

        {topic === "stock" ? (
          product?.colors?.length ? (
            <View
              style={{
                marginTop: 16,
                padding: 18,
                borderWidth: 1,
                borderColor: "#E2E7E3",
                borderRadius: 22,
                backgroundColor: "#FFFFFF",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#111111",
                      fontFamily: "Inter_900Black",
                      fontSize: 15,
                    }}
                  >
                    {msg("topic.colorsSizes")}</Text>
                  <Text
                    style={{
                      marginTop: 5,
                      color: "#757B76",
                      fontFamily: "Inter_500Medium",
                      fontSize: 9.5,
                    }}
                  >
                    {msg("topic.currentAvailability")}</Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: "#ECF8EF",
                  }}
                >
                  <Text
                    style={{
                      color: "#087A4B",
                      fontFamily: "Inter_900Black",
                      fontSize: 7.5,
                    }}
                  >
                    {availableColorCount}/{product.colors.length} {msg("topic.availableUppercase")}{availableColorCount > 1 ? "S" : ""}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginTop: 16,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {product.colors.map((color) => {
                  const sizes = colorSizes?.[color] ?? product.sizes ?? [];
                  const available = colorAvailable(color);
                  return (
                    <View
                      key={color}
                      style={{
                        width: "48.5%",
                        minHeight: 126,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: available ? "#BDE2C7" : "#E1E4E2",
                        borderRadius: 16,
                        backgroundColor: available ? "#F5FBF7" : "#FAFBFA",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: "#DADFDB",
                            borderRadius: 11,
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderWidth: 1,
                              borderColor: "#D3D7D4",
                              borderRadius: 10,
                              backgroundColor:
                                colorSwatches[color] ?? "#D7DAD8",
                            }}
                          />
                        </View>
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            backgroundColor: available ? "#3ECF4C" : "#CDD1CE",
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          marginTop: 13,
                          color: available ? "#111111" : "#777C78",
                          fontFamily: "Inter_900Black",
                          fontSize: 12.5,
                        }}
                      >
                        {localizedContent(color)}
                      </Text>
                      <Text
                        style={{
                          marginTop: 5,
                          color: "#858A86",
                          fontFamily: "Inter_500Medium",
                          fontSize: 8.5,
                        }}
                      >
                        {sizes.length
                          ? msg("variants.availableSizes", { sizes: sizes.join(", ") })
                          : msg("topic.standardSize")}
                      </Text>
                      <View
                        style={{
                          marginTop: 10,
                          alignSelf: "flex-start",
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 10,
                          backgroundColor: available ? "#DFF4E5" : "#ECEEEC",
                        }}
                      >
                        <Text
                          style={{
                            color: available ? "#087A4B" : "#858A86",
                            fontFamily: "Inter_900Black",
                            fontSize: 7,
                          }}
                        >
                          {available ? msg("homePromotionSection.inStockUppercase") : msg("homePromotionSection.soldOutUppercase")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null
        ) : null}

        <View className="mt-4 rounded-[18px] border border-[#D8E8DE] bg-[#F0F8F3] p-4">
          <View className="flex-row items-center">
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color="#3ECF4C"
            />
            <Text className="ml-3 flex-1 text-[11px] font-semibold leading-5 text-[#436052]">
              {msg("topic.cashOnDeliveryAndLecomaxSupportAvailableThroughoutMorocco")}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
