import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
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
import { TypingIndicator } from "@/components/typing-indicator";
import { useReducedMotion } from "react-native-reanimated";

export default function SmartAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const sessionId = useRef<string | undefined>(undefined);
  const sending = useRef(false);
  const list = useRef<FlatList<Message>>(null);
  const input = useRef<TextInput>(null);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const scrollFrame = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const scrollToLatest = useCallback(() => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      list.current?.scrollToOffset({
        offset: Math.max(0, contentHeight.current - viewportHeight.current),
        animated: !reduceMotion,
      });
    });
  }, [reduceMotion]);

  useEffect(() => {
    if (messages.length) scrollToLatest();
    return () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    };
  }, [messages.length, pending, scrollToLatest]);

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
        <View style={styles.headerContent}>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Retour" style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}>
            <Ionicons name="chevron-back" size={22} color="#28543E" />
          </AnimatedPressable>
          <View style={styles.headerText}>
            <Text style={styles.brand}>L’ECOMAX</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>Votre assistant shopping</Text>
          </View>
          <LinearGradient
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            colors={["#E8F4E4", "#F4F8EE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons name="sparkles" size={20} color="#287D45" />
          </LinearGradient>
        </View>
      </View>
      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}>
        <FlatList
          ref={list}
          nativeID="assistant-conversation"
          style={{ flex: 1, minHeight: 0 }}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          keyboardShouldPersistTaps="handled"
          onLayout={event => { viewportHeight.current = event.nativeEvent.layout.height; if (messages.length) scrollToLatest(); }}
          contentContainerStyle={styles.messages}
          onContentSizeChange={(_, height) => { contentHeight.current = height; if (messages.length) scrollToLatest(); }}
          ListFooterComponent={pending ? <TypingIndicator /> : null}
          ListEmptyComponent={<View>
            <LinearGradient colors={["#E5F2E1", "#F2F5E9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroTop}><View style={styles.sparkle}><Ionicons name="sparkles" size={28} color="#287D45" /></View><Text style={styles.eyebrow}>UN PEU D’INSPIRATION ?</Text></View>
              <Text style={styles.title}>Les bonnes trouvailles, <Text style={{ color: "#278945" }}>pour vous.</Text></Text>
              <Text style={styles.intro}>Une envie, un budget, une hésitation ? Trouvons ensemble ce qui vous correspond.</Text>
              <Text style={styles.heroFooter}>À vos envies. À votre rythme.</Text>
            </LinearGradient>
          </View>}
          renderItem={({ item }) => (
            <View style={[styles.messageGroup, item.role === "user" && styles.userGroup]}>
              {item.role !== "user" && (
                <View style={styles.messageIdentity}>
                  <LinearGradient
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    colors={["#EFF7E9", "#E1EEDC"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.messageAvatar}
                  >
                    <Ionicons name="sparkles-outline" size={18} color="#28543E" />
                  </LinearGradient>
                  <View style={styles.messageIdentityText}>
                    <Text style={styles.messageLabel}>L’ecomax</Text>
                    <Text style={styles.messageRole}>Assistant shopping</Text>
                  </View>
                </View>
              )}
              <View style={item.role === "user" ? styles.userBubble : styles.assistantReply}>
              <Text selectable style={[styles.message, item.role === "user" ? styles.userMessage : styles.assistantMessage]}>{item.content}</Text>
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
            </View>
          )}
        />

        <View style={styles.composerArea}>
        {!!error && <View accessibilityRole="alert" style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={20} color="#946429" />
          <View style={{ flex: 1 }}><Text style={styles.errorTitle}>Le message n’a pas pu être envoyé</Text><Text style={styles.errorText}>Votre message est conservé. Réessayez dans un instant.</Text></View>
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Réessayer" disabled={pending} style={styles.retry} onPress={() => void send()}><Ionicons name="refresh" size={20} color="#946429" /></AnimatedPressable>
        </View>}
        <View style={[styles.composer, inputFocused && styles.composerFocused]}>
          <TextInput
            nativeID="assistant-message"
            ref={input}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            accessibilityLabel="Votre message"
            placeholder="Une envie ? Parlons-en…"
            placeholderTextColor="#718076"
            cursorColor="#23843F"
            selectionColor="#A9D8B7"
            selectionHandleColor="#23843F"
            underlineColorAndroid="transparent"
            multiline
            numberOfLines={Platform.OS === "web" ? 1 : undefined}
            onContentSizeChange={event => {
              if (Platform.OS !== "web") {
                setInputHeight(Math.min(132, Math.max(44, Math.ceil(event.nativeEvent.contentSize.height))));
              }
            }}
            maxLength={4000}
            value={draft}
            onChangeText={setDraft}
            editable={!pending}
            style={[styles.input, Platform.OS === "web"
              ? styles.webInput
              : { height: draft ? inputHeight : 44 }]}
          />
          <AnimatedPressable accessibilityRole="button" accessibilityLabel="Envoyer" accessibilityState={{ disabled: pending || !draft.trim(), busy: pending }} disabled={pending || !draft.trim()} onPress={() => void send()} style={[styles.send, (pending || !draft.trim()) && styles.disabled]}>
            {pending ? <ActivityIndicator color="#587760" size="small" /> : <Ionicons name="arrow-up" size={22} color={draft.trim() ? "#FFFFFF" : "#78917D"} />}
          </AnimatedPressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, minHeight: 0, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { borderBottomWidth: 1, borderColor: "#E6ECE3", backgroundColor: "#FFFFFF" },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 14 },
  back: { flexShrink: 0, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#E5EBE2", backgroundColor: "#F8FAF6", alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, minWidth: 0, gap: 4 },
  brand: { fontFamily: typography.bold, fontSize: 10, lineHeight: 14, letterSpacing: 1.8, color: "#4E7859" },
  headerTitle: { fontFamily: typography.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.35, color: "#203D2B" },
  headerIcon: { flexShrink: 0, width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: "#DFEBD9", alignItems: "center", justifyContent: "center" },
  messages: { padding: 20, gap: 26, flexGrow: 1 },
  hero: { borderRadius: 26, padding: 23 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  sparkle: { backgroundColor: "#FFFFFFB3", width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontFamily: typography.bold, fontSize: 9, letterSpacing: 1, color: "#44764E", flexShrink: 1 },
  title: { fontFamily: typography.bold, fontSize: 29, lineHeight: 35, letterSpacing: -1.1, color: "#203D2B" },
  intro: { fontFamily: typography.regular, color: "#5B7160", fontSize: 13, lineHeight: 21, marginTop: 14 },
  heroFooter: { fontFamily: typography.medium, color: "#57745C", fontSize: 10, marginTop: 22 },
  messageGroup: { alignSelf: "flex-start", maxWidth: "100%", gap: 8, paddingVertical: 2 },
  userGroup: { alignSelf: "flex-end", maxWidth: "85%", paddingVertical: 0 },
  assistantReply: { gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5EAE3", borderRadius: 18, borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: "#28543E", minWidth: 64, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, borderBottomRightRadius: 7 },
  userMessage: { color: "#FFFFFF", fontSize: 15, lineHeight: 23 },
  messageIdentity: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 2 },
  messageAvatar: { flexShrink: 0, width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: "#DCE8D6", alignItems: "center", justifyContent: "center" },
  messageIdentityText: { flexShrink: 1, gap: 1 },
  messageLabel: { fontFamily: typography.semibold, fontSize: 13, lineHeight: 18, letterSpacing: -0.2, color: "#203D2B" },
  messageRole: { fontFamily: typography.regular, fontSize: 10, lineHeight: 14, color: "#65766B" },
  assistantMessage: { fontSize: 15, lineHeight: 23, color: "#26372D" },
  message: { fontFamily: typography.regular, color: "#344A3C", fontSize: 14, lineHeight: 22 },
  product: { padding: 14, borderRadius: 14, backgroundColor: "#F5F8F1", gap: 8 },
  productTitle: { fontFamily: typography.semibold, fontSize: 15, color: "#243B2B" },
  productLink: { fontFamily: typography.semibold, fontSize: 12, color: "#168526", marginTop: 6 },
  composerArea: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#F7F8F5", borderTopWidth: 1, borderColor: "#E8EBE5" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: "#FBF2E4", borderRadius: 15, marginBottom: 12 },
  errorTitle: { fontFamily: typography.semibold, color: "#805721", fontSize: 11, marginBottom: 4 },
  errorText: { fontFamily: typography.regular, color: "#977A50", fontSize: 10, lineHeight: 16 },
  retry: { width: 40, height: 44, justifyContent: "center", alignItems: "center" },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%", minWidth: 0, minHeight: 62, padding: 8, paddingLeft: 16, backgroundColor: "#FFFFFF", borderRadius: 28, borderWidth: 1, borderColor: "#D7E2D5", boxShadow: "0 3px 12px rgba(32, 61, 43, 0.06)" },
  input: { flex: 1, minWidth: 0, minHeight: 44, maxHeight: 132, paddingVertical: 11, paddingHorizontal: 0, borderWidth: 0, outlineWidth: 0, backgroundColor: "transparent", textAlignVertical: "top", fontFamily: typography.regular, fontSize: 16, lineHeight: 22, color: "#243B2B" },
  send: { flexShrink: 0, alignSelf: "flex-end", backgroundColor: "#23843F", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, boxShadow: "0 2px 5px rgba(35, 132, 63, 0.18)" },
  // Let the browser grow and shrink the textarea without retaining its default two rows.
  webInput: { fieldSizing: "content" } as TextStyle,
  disabled: { backgroundColor: "#EAF0E6", boxShadow: "none" },
  composerFocused: { borderColor: "#75A783", boxShadow: "0 0 0 3px rgba(35, 132, 63, 0.09), 0 3px 12px rgba(32, 61, 43, 0.05)" },
});
