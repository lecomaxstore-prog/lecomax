import { useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { typography } from "@/constants/theme";
import { AnimatedPressable } from "@/components/animated-pressable";
import { askAssistant, type AssistantMessage as Message } from "@/services/assistant";
import { localizedError } from "@/i18n/errors";
import { msg } from "@/i18n";
import { money } from "@/lib/format";

export default function SmartAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const sessionId = useRef<string | undefined>(undefined);
  const sending = useRef(false);
  const list = useRef<FlatList<Message>>(null);
  const input = useRef<TextInput>(null);

  async function send() {
    const content = draft.trim();
    if (!content || sending.current) return;
    sending.current = true;
    setPending(true);
    setError("");
    const conversation: Message[] = [...messages, { role: "user", content }];
    setMessages(conversation);
    setDraft("");
    try {
      const response = await askAssistant(conversation, sessionId.current);
      if (!response?.message && !response?.recommendations?.length) {
        throw new Error("Empty assistant response");
      }
      sessionId.current = response.sessionId ?? sessionId.current;
      setMessages([...conversation, {
        role: "assistant",
        content: response.message ?? "Voici mes recommandations.",
        recommendations: response.recommendations,
      }]);
    } catch (cause) {
      setMessages(messages);
      setDraft(content);
      setError(localizedError(cause) || msg("errors.tryAgain"));
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <Screen className="bg-[#F7F8F5]">
      <View style={styles.header}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
          <Ionicons name="arrow-back" size={20} color="#203D2B" />
        </AnimatedPressable>
        <View style={{ flex: 1 }}><Text style={styles.brand}>L’ECOMAX</Text><Text style={styles.headerTitle}>Votre assistant shopping</Text></View>
        <View style={styles.headerIcon}><Ionicons name="sparkles" size={19} color="#23843F" /></View>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          keyboardShouldPersistTaps="handled"
          onLayout={() => { if (messages.length) list.current?.scrollToEnd({ animated: false }); }}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => { if (messages.length) list.current?.scrollToEnd({ animated: true }); }}
          ListEmptyComponent={<View>
            <LinearGradient colors={["#E5F2E1", "#F2F5E9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroTop}><View style={styles.sparkle}><Ionicons name="sparkles" size={28} color="#287D45" /></View><Text style={styles.eyebrow}>UN PEU D’INSPIRATION ?</Text></View>
              <Text style={styles.title}>Les bonnes trouvailles, <Text style={{ color: "#278945" }}>pour vous.</Text></Text>
              <Text style={styles.intro}>Une envie, un budget, une hésitation ? Trouvons ensemble ce qui vous correspond.</Text>
              <Text style={styles.heroFooter}>À vos envies. À votre rythme.</Text>
            </LinearGradient>
          </View>}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" && styles.userBubble]}>
              <Text style={[styles.messageLabel, item.role === "user" && { color: "#B3D0B8" }]}>{item.role === "user" ? "VOUS" : "L’ECOMAX"}</Text>
              <Text style={[styles.message, item.role === "user" && { color: "#FFFFFF" }]}>{item.content}</Text>
              {item.recommendations?.map((product) => (
                <AnimatedPressable
                  key={product.productSlug}
                  accessibilityRole="button"
                  accessibilityLabel={product.productName ?? product.productSlug}
                  style={styles.product}
                  onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.productSlug } })}
                >
                  <Text style={styles.productTitle}>{product.productName ?? product.productSlug}</Text>
                  {typeof product.productPrice === "number" && <Text>{money(product.productPrice)}</Text>}
                  <Text style={styles.message}>{product.reason}</Text>
                  <Text style={styles.productLink}>Voir le produit →</Text>
                </AnimatedPressable>
              ))}
            </View>
          )}
        />
        {pending && <View style={styles.thinking}><ActivityIndicator accessibilityLabel={msg("common.loadingUppercase")} color="#23843F" /><Text style={styles.thinkingText}>Je regarde ça pour vous…</Text></View>}
        <View style={styles.composerArea}>
        {!!error && <View accessibilityRole="alert" style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={20} color="#946429" />
          <View style={{ flex: 1 }}><Text style={styles.errorTitle}>Le message n’a pas pu être envoyé</Text><Text style={styles.errorText}>Votre message est conservé. Réessayez dans un instant.</Text></View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Réessayer" disabled={pending} style={styles.retry} onPress={() => void send()}><Ionicons name="refresh" size={20} color="#946429" /></AnimatedPressable>
        </View>}
        <View style={[styles.composer, inputFocused && styles.composerFocused]}>
          <TextInput
            ref={input}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            accessibilityLabel="Votre message"
            placeholder="Une envie ? Parlons-en…"
            placeholderTextColor="#8A948D"
            multiline
            maxLength={4000}
            value={draft}
            onChangeText={setDraft}
            editable={!pending}
            style={styles.input}
          />
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Envoyer" disabled={pending || !draft.trim()} onPress={() => void send()} style={[styles.send, (pending || !draft.trim()) && styles.disabled]}>
            {pending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="arrow-up" size={22} color="#FFFFFF" />}
          </AnimatedPressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, minHeight: 0, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 17, borderBottomWidth: 1, borderColor: "#E8EBE5", backgroundColor: "#FFFFFF" },
  back: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: "#E8EBE5", alignItems: "center", justifyContent: "center" },
  brand: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 2, color: "#23843F", marginBottom: 5 },
  headerTitle: { fontFamily: typography.semibold, fontSize: 14, color: "#1C3025" },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#EDF5E9", alignItems: "center", justifyContent: "center" },
  messages: { padding: 20, gap: 18, flexGrow: 1 },
  hero: { borderRadius: 26, padding: 23 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  sparkle: { backgroundColor: "#FFFFFFB3", width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontFamily: typography.bold, fontSize: 9, letterSpacing: 1, color: "#44764E", flexShrink: 1 },
  title: { fontFamily: typography.bold, fontSize: 29, lineHeight: 35, letterSpacing: -1.1, color: "#203D2B" },
  intro: { fontFamily: typography.regular, color: "#5B7160", fontSize: 13, lineHeight: 21, marginTop: 14 },
  heroFooter: { fontFamily: typography.medium, color: "#57745C", fontSize: 10, marginTop: 22 },
  bubble: { backgroundColor: "#FFFFFF", padding: 17, borderRadius: 20, borderTopLeftRadius: 5, maxWidth: "88%", alignSelf: "flex-start", gap: 9, borderWidth: 1, borderColor: "#E6EAE2" },
  userBubble: { backgroundColor: "#214E36", borderColor: "#214E36", alignSelf: "flex-end", borderTopLeftRadius: 20, borderTopRightRadius: 5 },
  messageLabel: { fontFamily: typography.bold, fontSize: 9, letterSpacing: 1, color: "#468158" },
  message: { fontFamily: typography.regular, color: "#344A3C", fontSize: 14, lineHeight: 22 },
  product: { padding: 14, borderRadius: 14, backgroundColor: "#F5F8F1", gap: 8 },
  productTitle: { fontFamily: typography.semibold, fontSize: 15, color: "#243B2B" },
  productLink: { fontFamily: typography.semibold, fontSize: 12, color: "#168526", marginTop: 6 },
  thinking: { flexDirection: "row", gap: 10, alignItems: "center", padding: 18 },
  thinkingText: { fontFamily: typography.regular, color: "#78847C", fontSize: 12 },
  composerArea: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#F7F8F5", borderTopWidth: 1, borderColor: "#E8EBE5" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#FBF2E4", borderRadius: 15, marginBottom: 12 },
  errorTitle: { fontFamily: typography.semibold, color: "#805721", fontSize: 11, marginBottom: 4 },
  errorText: { fontFamily: typography.regular, color: "#977A50", fontSize: 10, lineHeight: 16 },
  retry: { width: 40, height: 44, justifyContent: "center", alignItems: "center" },
  composer: { position: "relative", width: "100%", minWidth: 0, height: 62, overflow: "hidden", backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#DDE5D8" },
  input: { width: "100%", minWidth: 0, height: 60, paddingVertical: 20, paddingLeft: 16, paddingRight: 68, borderWidth: 0, outlineWidth: 0, backgroundColor: "transparent", textAlignVertical: "center", fontFamily: typography.regular, fontSize: 13, lineHeight: 20, color: "#243B2B" },
  send: { position: "absolute", right: 8, top: 8, backgroundColor: "#23843F", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  disabled: { backgroundColor: "#ABBBA4" },
  composerFocused: { borderColor: "#23843F" },
});
