import { localizedError } from "@/i18n/errors";
import { currentLocale, msg, useLocale } from "@/i18n";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { ApiError } from "@/lib/api-client";
import { createSupportMessageId, getSupportConversations, startSupportConversation, type SupportConversation } from "@/services/support";

import { useSupportAccount, useSupportActive } from "@/hooks/use-support-account";

const statusLabel = { get open() { return msg("support.open"); }, get waiting() { return msg("support.replySent"); }, get resolved() { return msg("support.resolved"); } } as const;

export default function SupportScreen() {
  useLocale();
  const account = useSupportAccount();
  if (account.error) return <Screen><View style={styles.centerState}><Text style={styles.stateTitle}>{msg("support.signInUnavailable")}</Text><Text style={styles.stateText}>{account.error}</Text><AnimatedPressable accessibilityRole="button" onPress={account.retry} style={styles.primary}><Text style={styles.primaryText}>{msg("notifications.tryAgainUppercase")}</Text></AnimatedPressable></View></Screen>;
  if (!account.ready) return <Screen><View style={styles.centerState}><ActivityIndicator color={palette.greenDark} /><Text style={styles.stateText}>{msg("support.checkingYourSession")}</Text></View></Screen>;
  return <SupportContent key={account.id ?? "guest"} account={account} />;
}

function SupportContent({ account }: { account: ReturnType<typeof useSupportAccount> }) {
  useLocale();
  const active = useSupportActive();
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const pending = useRef<{ fingerprint: string; id: string } | null>(null);
  const [composing, setComposing] = useState(Boolean(orderNumber));
  const [subject, setSubject] = useState(orderNumber ? msg("support.orderSubject", { number: orderNumber }) : "");
  const [message, setMessage] = useState("");
  const conversations = useQuery({ queryKey: ["support-conversations", account.id], queryFn: getSupportConversations, enabled: Boolean(account.id), refetchInterval: active ? 5000 : false, retry: false });
  const create = useMutation({
    mutationFn: startSupportConversation,
    onSuccess: async ({ conversation }) => {
      setSubject(""); setMessage(""); setComposing(false); pending.current = null;
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
      router.push({ pathname: "/support-chat", params: { id: conversation.id } });
    },
  });
  const authRequired = (account.ready && !account.id) || (conversations.error instanceof ApiError && conversations.error.status === 401);

  const submit = () => {
    if (!message.trim() || create.isPending) return;
    const fingerprint = JSON.stringify([account.id, subject.trim(), message.trim(), orderNumber]);
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, id: createSupportMessageId() };
    create.mutate({ subject: subject.trim() || msg("support.supportRequest"), message: message.trim(), order_number: orderNumber, client_message_id: pending.current.id });
  };

  const renderConversation = ({ item }: { item: SupportConversation }) => (
    <AnimatedPressable accessibilityLabel={msg("support.conversationSubject", { subject: item.subject })} onPress={() => router.push({ pathname: "/support-chat", params: { id: item.id } })} style={styles.conversation}>
      <View style={[styles.conversationIcon, item.customer_unread > 0 && styles.conversationIconUnread]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={item.customer_unread > 0 ? palette.white : palette.greenDark} />
      </View>
      <View style={styles.conversationCopy}>
        <View style={styles.conversationTop}>
          <Text numberOfLines={1} style={styles.conversationTitle}>{item.subject}</Text>
          {item.customer_unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.customer_unread}</Text></View> : null}
        </View>
        <Text numberOfLines={2} style={styles.preview}>{item.last_message || msg("support.conversationStarted")}</Text>
        <View style={styles.metaRow}><Text style={styles.status}>{statusLabel[item.status]}</Text><Text style={styles.date}>{new Date(item.last_message_at).toLocaleDateString(currentLocale(), { day: "2-digit", month: "short" })}</Text></View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8A918C" />
    </AnimatedPressable>
  );

  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <AnimatedPressable accessibilityLabel={msg("addresses.back")} onPress={() => router.canGoBack() ? router.back() : router.replace("/account")} style={styles.back}><Ionicons name="arrow-back" size={22} color={palette.ink} /></AnimatedPressable>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>{msg("support.customerServiceUppercase")}</Text><Text accessibilityRole="header" style={styles.title}>{msg("support.support")}</Text></View>
          <View style={styles.online}><Ionicons name="shield-checkmark-outline" size={19} color="#365741" /></View>
        </View>

        {authRequired ? (
          <View style={styles.centerState}><Ionicons name="lock-closed-outline" size={42} color={palette.greenDark} /><Text style={styles.stateTitle}>{msg("support.yourConversationsArePrivate")}</Text><Text style={styles.stateText}>{msg("support.signInToStartASecureConversationAndFindYourRequests")}</Text><AnimatedPressable onPress={() => router.push({ pathname: "/auth", params: { returnTo: "account" } })} style={styles.primary}><Text style={styles.primaryText}>{msg("support.signInUppercase")}</Text></AnimatedPressable></View>
        ) : (
          <FlatList
            data={conversations.data?.conversations ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            refreshing={conversations.isRefetching}
            onRefresh={() => void conversations.refetch()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
            ListHeaderComponent={<>
              <View style={styles.hero}>
                <View style={styles.heroTop}><View style={styles.heroIcon}><Ionicons name="headset-outline" size={24} color="#365741" /></View><Text style={styles.heroTag}>{msg("support.hereToHelpUppercase")}</Text></View>
                <Text style={styles.heroTitle}>{msg("support.haveAQuestion")}{"\n"}{msg("support.weReHereForYou")}</Text>
                <Text style={styles.heroText}>{msg("support.talkDirectlyWithOurTeamFindEveryReplyInYourConversations")}</Text>
                <View style={styles.topics}>{[msg("support.order"), msg("support.delivery"), msg("support.return"), msg("support.other")].map(topic => <AnimatedPressable key={topic} accessibilityRole="button" accessibilityLabel={msg("support.topicRequest", { topic })} onPress={() => { setSubject(topic); setComposing(true); }} style={[styles.topic, subject === topic && styles.topicActive]}><Text style={[styles.topicText, subject === topic && styles.topicTextActive]}>{topic}</Text></AnimatedPressable>)}</View>
              </View>
              <AnimatedPressable accessibilityRole="button" accessibilityLabel={composing ? msg("support.closeForm") : msg("support.startAConversation")} onPress={() => setComposing((value) => !value)} style={styles.startButton}><Ionicons name={composing ? "close" : "add"} size={20} color={palette.white} /><Text style={styles.startText}>{composing ? msg("support.closeForm") : msg("support.writeToOurTeam")}</Text></AnimatedPressable>
              {composing ? <View style={styles.composerCard}>
                <Text style={styles.composerTitle}>{msg("support.yourRequest")}</Text><Text style={styles.composerHint}>{msg("support.aFewDetailsWillHelpUsAnswerYou")}</Text><Text style={styles.inputLabel}>{msg("support.subjectUppercase")}</Text><TextInput accessibilityLabel={msg("support.requestSubject")} value={subject} onChangeText={setSubject} maxLength={120} placeholder={msg("support.eGTrackingMyOrder")} placeholderTextColor="#8A918C" style={styles.input} />
                <Text style={styles.inputLabel}>{msg("support.messageUppercase")}</Text><TextInput accessibilityLabel={msg("support.describeYourRequest")} value={message} onChangeText={setMessage} maxLength={2000} multiline placeholder={msg("support.describeYourRequestText")} placeholderTextColor="#8A918C" style={[styles.input, styles.messageInput]} />
                {create.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{localizedError(create.error)}</Text> : null}
                <Text style={styles.characterCount}>{message.length}/2000</Text><AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("support.sendRequest")} disabled={!message.trim() || create.isPending} onPress={submit} style={[styles.sendButton, (!message.trim() || create.isPending) && styles.disabled]}>{create.isPending ? <ActivityIndicator color={palette.white} /> : <><Text style={styles.sendText}>{msg("support.sendMyRequest")}</Text><Ionicons name="arrow-forward" size={18} color={palette.white} /></>}</AnimatedPressable>
                <Text style={styles.privacy}>{msg("support.yourMessagesAreOnlySharedWithLEcomaxCustomerService")}</Text>
              </View> : null}
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{msg("support.yourConversations")}</Text><Text style={styles.sectionCount}>{conversations.data?.conversations.length ?? 0}</Text></View>
            </>}
            ListEmptyComponent={conversations.isError ? <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={30} color="#365741" /><Text style={styles.emptyTitle}>{msg("support.weCouldnTLoadYourConversations")}</Text><Text style={styles.emptyText}>{localizedError(conversations.error)}</Text><AnimatedPressable accessibilityRole="button" accessibilityLabel={msg("support.refreshConversations")} onPress={() => void conversations.refetch()} style={styles.retryButton}><Text style={styles.topicText}>{msg("support.tryAgain")}</Text></AnimatedPressable></View> : conversations.isPending ? <ActivityIndicator color={palette.greenDark} style={{ marginTop: 30 }} /> : <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={34} color="#9AA09B" /><Text style={styles.emptyTitle}>{msg("support.noConversationsYet")}</Text><Text style={styles.emptyText}>{msg("support.yourConversationsWithOurTeamWillAppearHere")}</Text></View>}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTop:{flexDirection:"row",alignItems:"center",gap:12},heroTag:{fontFamily:typography.semibold,fontSize:9,letterSpacing:1.5,color:"#52684D"},topics:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:20},topic:{paddingVertical:10,paddingHorizontal:12,borderRadius:20,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E1E6DA"},topicActive:{backgroundColor:"#182A20",borderColor:"#182A20"},topicText:{fontFamily:typography.medium,fontSize:11,color:"#365741"},topicTextActive:{color:palette.white},composerTitle:{fontFamily:typography.semibold,fontSize:18,color:"#182A20"},composerHint:{fontFamily:typography.regular,fontSize:11,lineHeight:18,color:palette.muted,marginTop:4,marginBottom:17},characterCount:{fontFamily:typography.regular,fontSize:10,textAlign:"right",color:palette.muted,marginTop:8},retryButton:{padding:14,marginTop:8},
  flex:{flex:1}, header:{height:76,paddingHorizontal:16,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#E9ECEA"}, back:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:"#F3F5F3"}, headerCopy:{flex:1,marginLeft:12}, eyebrow:{fontFamily:typography.semibold,fontSize:8,color:palette.greenDark,letterSpacing:1.5}, title:{fontFamily:typography.semibold,fontSize:22,color:palette.ink}, online:{flexDirection:"row",alignItems:"center",gap:5}, onlineDot:{width:7,height:7,borderRadius:4,backgroundColor:palette.greenDark}, onlineText:{fontFamily:typography.semibold,fontSize:7,color:palette.greenDark}, hero:{padding:24,borderRadius:26,backgroundColor:"#F1F4ED"}, heroIcon:{width:46,height:46,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:"#E2EADA"}, heroTitle:{marginTop:20,fontFamily:typography.medium,fontSize:29,lineHeight:35,letterSpacing:-.8,color:"#182A20"}, heroText:{marginTop:9,fontFamily:typography.regular,fontSize:13,lineHeight:20,color:"#6B7568"}, availability:{marginTop:15,fontFamily:typography.bold,fontSize:9,color:palette.green,letterSpacing:.8}, startButton:{minHeight:54,marginTop:14,paddingHorizontal:18,borderRadius:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:"#182A20"}, startText:{fontFamily:typography.semibold,fontSize:13,color:palette.white,letterSpacing:.5}, composerCard:{marginTop:16,padding:20,borderWidth:1,borderColor:"#E4E8E0",borderRadius:24,backgroundColor:palette.white}, inputLabel:{marginTop:4,marginBottom:7,fontFamily:typography.semibold,fontSize:8,color:palette.muted,letterSpacing:1.2}, input:{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:"#D8DDD9",borderRadius:13,fontFamily:typography.medium,fontSize:13,color:palette.ink,backgroundColor:palette.white}, messageInput:{minHeight:128,paddingTop:13,textAlignVertical:"top"}, sendButton:{minHeight:50,marginTop:14,paddingHorizontal:18,borderRadius:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:palette.ink}, disabled:{opacity:.45}, sendText:{fontFamily:typography.semibold,fontSize:10,color:palette.white}, privacy:{marginTop:10,fontFamily:typography.regular,fontSize:9,lineHeight:14,color:palette.muted}, error:{marginTop:10,fontFamily:typography.bold,fontSize:10,color:palette.red}, sectionHeading:{marginTop:26,marginBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, sectionTitle:{fontFamily:typography.semibold,fontSize:18,color:palette.ink,letterSpacing:1}, sectionCount:{minWidth:24,paddingHorizontal:7,paddingVertical:3,borderRadius:9,textAlign:"center",fontFamily:typography.semibold,fontSize:9,color:palette.greenDark,backgroundColor:"#EAF7ED"}, conversation:{minHeight:104,marginBottom:10,padding:14,borderWidth:1,borderColor:"#E1E5E2",borderRadius:18,flexDirection:"row",alignItems:"center",backgroundColor:palette.white}, conversationIcon:{width:43,height:43,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"#EAF7ED"}, conversationIconUnread:{backgroundColor:palette.greenDark}, conversationCopy:{minWidth:0,marginHorizontal:11,flex:1}, conversationTop:{flexDirection:"row",alignItems:"center",gap:7}, conversationTitle:{flex:1,fontFamily:typography.semibold,fontSize:12,color:palette.ink}, badge:{minWidth:20,height:20,paddingHorizontal:5,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:palette.red}, badgeText:{fontFamily:typography.semibold,fontSize:8,color:palette.white}, preview:{marginTop:5,fontFamily:typography.regular,fontSize:10,lineHeight:15,color:palette.muted}, metaRow:{marginTop:7,flexDirection:"row",gap:8}, status:{fontFamily:typography.semibold,fontSize:8,color:palette.greenDark,textTransform:"uppercase"}, date:{fontFamily:typography.medium,fontSize:8,color:"#8A918C"}, empty:{minHeight:160,padding:20,borderRadius:22,backgroundColor:"#F8F9F6",alignItems:"center",justifyContent:"center"}, emptyTitle:{marginTop:12,fontFamily:typography.semibold,fontSize:15,color:palette.ink}, emptyText:{marginTop:8,fontFamily:typography.regular,fontSize:12,lineHeight:19,color:palette.muted,textAlign:"center"}, centerState:{flex:1,paddingHorizontal:32,alignItems:"center",justifyContent:"center"}, stateTitle:{marginTop:18,fontFamily:typography.semibold,fontSize:22,color:palette.ink,textAlign:"center"}, stateText:{marginTop:9,fontFamily:typography.regular,fontSize:13,lineHeight:20,color:palette.muted,textAlign:"center"}, primary:{minHeight:52,marginTop:22,paddingHorizontal:26,borderRadius:26,alignItems:"center",justifyContent:"center",backgroundColor:palette.ink}, primaryText:{fontFamily:typography.semibold,fontSize:11,color:palette.white},
});
