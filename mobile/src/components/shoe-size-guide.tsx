import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { useAppViewport } from "@/components/app-viewport";
import { apiRequest } from "@/lib/api-client";

type ShoeSizeRow = { eu: string; us: string; uk: string; cm: string };

export function ShoeSizeGuide({
  open,
  onClose,
  availableSizes,
  selectedSize,
  onSelectSize,
}: {
  open: boolean;
  onClose: () => void;
  availableSizes: string[];
  selectedSize?: string;
  onSelectSize: (size: string) => void;
}) {
  const { contentWidth } = useAppViewport();
  const [rows, setRows] = useState<ShoeSizeRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const load = useCallback(() => {
    let active = true;
    setStatus("loading");
    void apiRequest<{ shoes?: ShoeSizeRow[] }>("/api/size-guide")
      .then((result) => {
        if (!active) return;
        if (!result.shoes?.length) throw new Error("Guide vide");
        setRows(result.shoes);
        setStatus("idle");
      })
      .catch(() => {
        if (active) {
          setRows([]);
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setStatus("loading");
      try {
        const result = await apiRequest<{ shoes?: ShoeSizeRow[] }>(
          "/api/size-guide",
        );
        if (!active) return;
        if (!result.shoes?.length) throw new Error("Guide vide");
        setRows(result.shoes);
        setStatus("idle");
      } catch {
        if (active) {
          setRows([]);
          setStatus("error");
        }
      }
    });
    return () => {
      active = false;
    };
  }, [load, open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-end",
          backgroundColor: "rgba(17,17,17,0.46)",
        }}
        edges={["top", "bottom"]}
      >
        <Pressable
          accessibilityLabel="Fermer le guide"
          onPress={onClose}
          style={{ width: "100%", flex: 1 }}
        />
        <View
          style={{
            width: contentWidth,
            maxHeight: "91%",
            overflow: "hidden",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: "#FFFFFF",
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#D6D9D7",
              }}
            />
          </View>
          <View className="flex-row items-center border-b border-neutral-100 px-6 pb-5 pt-3">
            <View className="flex-1">
              <Text className="text-[9px] font-black uppercase tracking-[2px] text-green">
                Lecomax
              </Text>
              <Text className="mt-1 text-[23px] font-black tracking-[-0.5px] text-ink">
                Guide des pointures
              </Text>
            </View>
            <AnimatedPressable
              accessibilityLabel="Fermer"
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: "#F2F3F2",
              }}
            >
              <Ionicons name="close" size={21} color="#111111" />
            </AnimatedPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
          >
            <View className="flex-row items-center rounded-[18px] bg-neutral-50 p-4">
              <View className="h-12 w-12 items-center justify-center rounded-[14px] bg-ink">
                <Ionicons name="footsteps-outline" size={23} color="#FFFFFF" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[14px] font-black text-ink">
                  Mesurez votre pied
                </Text>
                <Text className="mt-1 text-[11px] leading-5 text-muted">
                  Posez le pied sur une feuille et mesurez du talon à l’orteil
                  le plus long.
                </Text>
              </View>
            </View>

            <Text className="mb-3 mt-6 text-[10px] font-black uppercase tracking-[1.7px] text-muted">
              Tableau des pointures
            </Text>
            {status === "loading" ? (
              <View
                accessibilityLabel="Chargement du guide des pointures"
                style={{
                  minHeight: 150,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color="#168526" />
                <Text className="mt-3 text-[11px] font-bold text-muted">
                  Chargement du guide…
                </Text>
              </View>
            ) : status === "error" ? (
              <View
                accessibilityLiveRegion="polite"
                style={{
                  minHeight: 150,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#E1E3E1",
                  padding: 20,
                }}
              >
                <Ionicons
                  name="cloud-offline-outline"
                  size={28}
                  color="#168526"
                />
                <Text className="mt-3 text-center text-[12px] font-bold text-ink">
                  Guide momentanément indisponible
                </Text>
                <Text className="mt-1 text-center text-[10px] text-muted">
                  Réessayez sans quitter cette fiche produit.
                </Text>
                <AnimatedPressable
                  accessibilityLabel="Réessayer de charger le guide"
                  onPress={load}
                  style={{
                    marginTop: 14,
                    minHeight: 44,
                    justifyContent: "center",
                    backgroundColor: "#111111",
                    paddingHorizontal: 18,
                  }}
                >
                  <Text className="text-[10px] font-black uppercase text-white">
                    Réessayer
                  </Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View
                style={{
                  overflow: "hidden",
                  borderWidth: 1,
                  borderRadius: 17,
                  borderColor: "#E1E3E1",
                }}
              >
                <View
                  style={{
                    height: 44,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#111111",
                  }}
                >
                  {["EU", "US", "UK", "CM"].map((heading) => (
                    <Text
                      key={heading}
                      style={{
                        flex: 1,
                        color: "#FFFFFF",
                        fontFamily: "Inter_700Bold",
                        fontSize: 10,
                        textAlign: "center",
                        letterSpacing: 0.8,
                      }}
                    >
                      {heading}
                    </Text>
                  ))}
                </View>
                {rows.map((row, index) => {
                  const available = availableSizes.includes(row.eu);
                  const selected = selectedSize === row.eu;
                  return (
                    <Pressable
                      key={row.eu}
                      accessibilityRole="button"
                      accessibilityLabel={`Pointure EU ${row.eu}, ${row.cm} centimètres${available ? ", disponible" : ", indisponible"}`}
                      disabled={!available}
                      onPress={() => {
                        onSelectSize(row.eu);
                        onClose();
                      }}
                      style={{
                        minHeight: 50,
                        flexDirection: "row",
                        alignItems: "center",
                        borderTopWidth: index ? 1 : 0,
                        borderTopColor: "#ECEEEC",
                        borderLeftWidth: selected ? 3 : 0,
                        borderLeftColor: "#3ECF4C",
                        backgroundColor: selected
                          ? "#EFF9F3"
                          : available
                            ? "#F8F9F8"
                            : index % 2
                              ? "#FCFCFC"
                              : "#FFFFFF",
                        opacity: available || selected ? 1 : 0.55,
                      }}
                    >
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color="#3ECF4C"
                            style={{ marginRight: 5 }}
                          />
                        ) : null}
                        <Text
                          style={{
                            color: selected ? "#168526" : "#111111",
                            fontFamily: selected
                              ? "Inter_900Black"
                              : "Inter_700Bold",
                            fontSize: 13,
                          }}
                        >
                          {row.eu}
                        </Text>
                      </View>
                      {[row.us, row.uk, row.cm].map((value, valueIndex) => (
                        <Text
                          key={`${row.eu}-${valueIndex}`}
                          style={{
                            flex: 1,
                            color: selected
                              ? "#168526"
                              : available
                                ? "#343735"
                                : "#9CA09D",
                            fontFamily: selected
                              ? "Inter_700Bold"
                              : "Inter_500Medium",
                            fontSize: 12,
                            textAlign: "center",
                          }}
                        >
                          {value}
                        </Text>
                      ))}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {rows.length ? (
              <View className="mt-3 flex-row flex-wrap gap-4">
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-green" />
                  <Text className="ml-2 text-[10px] text-muted">
                    Disponible pour ce produit
                  </Text>
                </View>
                {selectedSize ? (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color="#3ECF4C"
                    />
                    <Text className="ml-1.5 text-[10px] font-bold text-green">
                      EU {selectedSize} sélectionnée
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View className="mt-6 flex-row rounded-[18px] border border-neutral-200 p-4">
              <View className="h-9 w-9 items-center justify-center rounded-[10px] bg-ink">
                <Ionicons name="information" size={18} color="#FFFFFF" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[13px] font-black text-ink">
                  Conseil Lecomax
                </Text>
                <Text className="mt-1 text-[11px] leading-5 text-muted">
                  Si vous hésitez entre deux pointures, choisissez la plus
                  grande.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
