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
  const { topic = "delivery-dates", slug = "" } = useLocalSearchParams<{
    topic: Topic;
    slug: string;
  }>();
  const { data: product } = useProduct(slug);
  const { data: settings = [] } = useSettings();
  const values = Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  );
  const estimatedDays =
    values.shipping_estimated_days?.trim() || "2–5 jours ouvrables";
  const shippingCost = values.shipping_cost?.trim() || "35";
  const freeThreshold = values.free_shipping_threshold?.trim() || "500";

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
      eyebrow: "Livraison",
      title: "Quand recevrez-vous votre commande ?",
      summary: `Livraison estimée sous ${estimatedDays}`,
      icon: "calendar-outline" as const,
    },
    "delivery-coverage": {
      eyebrow: "Couverture",
      title: "Livraison partout au Maroc",
      summary: "Votre commande est suivie jusqu’à sa réception.",
      icon: "location-outline" as const,
    },
    stock: {
      eyebrow: "Disponibilité",
      title: product?.name || "Stock du produit",
      summary: product?.stock
        ? `${product.stock} unité${product.stock === 1 ? "" : "s"} disponible${product.stock === 1 ? "" : "s"}`
        : "Produit actuellement épuisé",
      icon: "cube-outline" as const,
    },
  }[topic] ?? {
    eyebrow: "Informations",
    title: "Informations produit",
    summary: "Tout ce qu’il faut savoir avant votre achat.",
    icon: "information-circle-outline" as const,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6F5] dark:bg-ink" edges={["top"]}>
      <View className="flex-row items-center border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <AnimatedPressable
          accessibilityLabel="Retour"
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
              ? "Livraison & suivi"
              : topic === "delivery-coverage"
                ? "Zones de livraison"
                : "Stock & options"}
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
                  DÉLAI ESTIMÉ
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    color: "#111111",
                    fontFamily: "Inter_500Medium",
                    fontSize: 10,
                  }}
                >
                  Après confirmation de la commande
                </Text>
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
              Une estimation claire, du traitement de votre commande jusqu’à sa
              réception.
            </Text>
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
                  ZONE DESSERVIE
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    color: "#5F6E64",
                    fontFamily: "Inter_500Medium",
                    fontSize: 10,
                  }}
                >
                  Livraison nationale avec suivi
                </Text>
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
              Partout au Maroc
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
              Grandes villes, villes secondaires et zones couvertes par nos
              partenaires de livraison.
            </Text>
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
                  {product?.stock ? "EN STOCK" : "ÉPUISÉ"}
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
              {product?.name || "Disponibilité du produit"}
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
                ? `${product.stock} unité${product.stock === 1 ? "" : "s"} disponible${product.stock === 1 ? "" : "s"}`
                : "Produit actuellement indisponible"}
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
              Parcours de votre commande
            </Text>
            <TimelineRow
              step={1}
              title="Commande confirmée"
              timing="Immédiat"
              detail="Votre commande est enregistrée et votre confirmation vous est envoyée."
            />
            <TimelineRow
              step={2}
              title="Préparation"
              timing="24–48 h"
              detail="Vos articles sont contrôlés, emballés et remis au transporteur."
            />
            <TimelineRow
              step={3}
              last
              title="Livraison"
              timing={estimatedDays}
              detail="Le livreur vous contacte avant son passage, hors dimanches et jours fériés."
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
                  FRAIS DE LIVRAISON
                </Text>
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
                  0 MAD
                </Text>
                <Text
                  style={{
                    marginTop: 5,
                    color: "#757B76",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 8.5,
                  }}
                >
                  DÈS {freeThreshold} MAD
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
                Votre livraison
              </Text>
              <InformationRow
                icon="map-outline"
                title="Toutes les villes du Maroc"
                detail="Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès et les zones desservies."
              />
              <InformationRow
                icon="navigate-outline"
                title="Suivi inclus"
                detail="Votre numéro de suivi est communiqué dès la prise en charge du colis."
              />
              <InformationRow
                icon="call-outline"
                title="Réception du colis"
                detail="Le livreur peut vous appeler avant son passage. Gardez votre téléphone disponible."
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
                    Couleurs & pointures
                  </Text>
                  <Text
                    style={{
                      marginTop: 5,
                      color: "#757B76",
                      fontFamily: "Inter_500Medium",
                      fontSize: 9.5,
                    }}
                  >
                    Disponibilité actuelle
                  </Text>
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
                    {availableColorCount}/{product.colors.length} DISPONIBLE
                    {availableColorCount > 1 ? "S" : ""}
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
                        {color}
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
                          ? `Pointure${sizes.length > 1 ? "s" : ""} ${sizes.join(", ")}`
                          : "Taille standard"}
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
                          {available ? "EN STOCK" : "ÉPUISÉ"}
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
              Paiement à la livraison et assistance Lecomax disponibles partout
              au Maroc.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
