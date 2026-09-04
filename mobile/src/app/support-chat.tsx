import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { getSupportConversation, sendSupportMessage, type SupportMessage } from "@/services/support";

type DisplayMessage = SupportMessage & { pending?: boolean; failed?: boolean };
const createId = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
  const value = Math.floor(Math.random() * 16);
  return (character === "x" ? value : (value & 3) | 8).toString(16);
});

export default function SupportChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const [draft, setDraft] = useState("");
  const [optimistic, setOptimistic] = useState<DisplayMessage[]>([]);
  const storageKey = `LECOMAX_SUPPORT_DRAFT:${id ?? "new"}`;
  const query = useQuery({ queryKey: ["support-conversation", id], queryFn: () => getSupportConversation(id), enabled: Boolean(id), refetchInterval: 15_000 });

  useEffect(() => { void AsyncStorage.getItem(storageKey).then((value) => { if (value) setDraft(value); }); }, [storageKey]);
  useEffect(() => { const timer = setTimeout(() => void AsyncStorage.setItem(storageKey, draft), 250); return () => clearTimeout(timer); }, [draft, storageKey]);

  const send = useMutation({
    mutationFn: ({ body, clientId }: { body: string; clientId: string }) => sendSupportMessage(id, body, clientId),
    onSuccess: async ({ message }, variables) => {
      setOptimistic((current) => current.filter((item) => item.client_message_id !== variables.clientId));
      await Promise.all([query.refetch(), queryClient.invalidateQueries({ queryKey: ["support-conversations"] })]);
    },
    onError: (_error, variables) => setOptimistic((current) => current.map((item) => item.client_message_id === variables.clientId ? { ...item, pending: false, failed: true } : item)),
  });

  const submit = useCallback((retry?: DisplayMessage) => {
    const body = (retry?.body ?? draft).trim();
    if (!body || send.isPending) return;
    const clientId = retry?.client_message_id || createId();
    if (!retry) {
      setDraft(""); void AsyncStorage.removeItem(storageKey);
      setOptimistic((current) => [...current, { id: clientId, conversation_id: id, sender_type: "customer", body, client_message_id: clientId, created_at: new Date().toISOString(), pending: true }]);
    } else setOptimistic((current) => current.map((item) => item.id === retry.id ? { ...item, pending: true, failed: false } : item));
    send.mutate({ body, clientId });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [draft, id, send, storageKey]);

  const messages: DisplayMessage[] = [...(query.data?.messages ?? []), ...optimistic].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const customer = item.sender_type === "customer";
    return <View style={[styles.messageRow, customer && styles.messageRowCustomer]}><View style={[styles.bubble, customer ? styles.customerBubble : styles.supportBubble]}><Text style={[styles.body, customer && styles.customerBody]}>{item.body}</Text><View style={styles.messageMeta}><Text style={[styles.time, customer && styles.customerTime]}>{new Date(item.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text>{item.pending ? <ActivityIndicator size={10} color="#D9E0DA" /> : item.failed ? <AnimatedPressable accessibilityLabel="Réessayer l’envoi" onPress={() => submit(item)} style={styles.retry}><Ionicons name="refresh" size={12} color="#FFD7D7" /><Text style={styles.retryText}>RÉESSAYER</Text></AnimatedPressable> : customer ? <Ionicons name={item.read_at ? "checkmark-done" : "checkmark"} size={13} color="#D9E0DA" /> : null}</View></View></View>;
  };

  return <Screen className="bg-white"><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 4 : 0} style={styles.flex}>
    <View style={styles.header}><AnimatedPressable accessibilityLabel="Retour aux conversations" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color={palette.ink} /></AnimatedPressable><View style={styles.headerCopy}><Text numberOfLines={1} style={styles.title}>{query.data?.conversation.subject || "Assistance"}</Text><View style={styles.presence}><View style={styles.presenceDot} /><Text style={styles.presenceText}>ÉQUIPE L’ECOMAX</Text></View></View><View style={styles.secure}><Ionicons name="shield-checkmark-outline" size={18} color={palette.greenDark} /></View></View>
    {query.isPending ? <View style={styles.center}><ActivityIndicator color={palette.greenDark} /><Text style={styles.loading}>Chargement de la conversation…</Text></View> : query.isError ? <View style={styles.center}><Ionicons name="cloud-offline-outline" size={39} color={palette.greenDark} /><Text style={styles.errorTitle}>Conversation indisponible</Text><Text style={styles.errorText}>{query.error.message}</Text><AnimatedPressable onPress={() => void query.refetch()} style={styles.reload}><Text style={styles.reloadText}>RÉESSAYER</Text></AnimatedPressable></View> : <>
      <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} renderItem={renderMessage} contentContainerStyle={styles.messages} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} keyboardShouldPersistTaps="handled" ListHeaderComponent={<View style={styles.notice}><Ionicons name="information-circle-outline" size={16} color={palette.greenDark} /><Text style={styles.noticeText}>Les messages sont partagés avec le service client. Évitez d’envoyer des mots de passe ou données bancaires.</Text></View>} />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}><View style={styles.inputShell}><TextInput accessibilityLabel="Votre message" value={draft} onChangeText={setDraft} maxLength={2000} multiline placeholder={query.data?.conversation.status === "resolved" ? "Envoyer un message pour rouvrir…" : "Écrivez votre message…"} placeholderTextColor="#858C87" style={styles.input} /><AnimatedPressable accessibilityLabel="Envoyer le message" disabled={!draft.trim() || send.isPending} onPress={() => submit()} style={[styles.send, (!draft.trim() || send.isPending) && styles.sendDisabled]}>{send.isPending ? <ActivityIndicator size="small" color={palette.white} /> : <Ionicons name="arrow-up" size={20} color={palette.white} />}</AnimatedPressable></View><Text style={styles.draftNote}>Brouillon enregistré automatiquement</Text></View>
    </>}
  </KeyboardAvoidingView></Screen>;
}

const styles = StyleSheet.create({ flex:{flex:1}, header:{height:76,paddingHorizontal:16,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#E6EAE7",backgroundColor:palette.white}, back:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:"#F2F4F2"}, headerCopy:{minWidth:0,marginLeft:12,flex:1}, title:{fontFamily:typography.black,fontSize:15,color:palette.ink}, presence:{marginTop:4,flexDirection:"row",alignItems:"center",gap:5}, presenceDot:{width:6,height:6,borderRadius:3,backgroundColor:palette.greenDark}, presenceText:{fontFamily:typography.black,fontSize:7,color:palette.greenDark,letterSpacing:1}, secure:{width:38,height:38,borderRadius:19,alignItems:"center",justifyContent:"center",backgroundColor:"#EAF7ED"}, center:{flex:1,paddingHorizontal:30,alignItems:"center",justifyContent:"center"}, loading:{marginTop:11,fontFamily:typography.medium,fontSize:12,color:palette.muted}, errorTitle:{marginTop:15,fontFamily:typography.black,fontSize:19,color:palette.ink}, errorText:{marginTop:7,fontFamily:typography.regular,fontSize:12,lineHeight:18,color:palette.muted,textAlign:"center"}, reload:{minHeight:48,marginTop:18,paddingHorizontal:23,borderRadius:24,alignItems:"center",justifyContent:"center",backgroundColor:palette.ink}, reloadText:{fontFamily:typography.black,fontSize:10,color:palette.white}, messages:{padding:16,paddingBottom:24}, notice:{marginBottom:20,padding:13,borderRadius:14,flexDirection:"row",gap:9,backgroundColor:"#EEF8F0"}, noticeText:{flex:1,fontFamily:typography.regular,fontSize:9.5,lineHeight:15,color:"#405346"}, messageRow:{marginBottom:10,alignItems:"flex-start"}, messageRowCustomer:{alignItems:"flex-end"}, bubble:{maxWidth:"82%",paddingHorizontal:14,paddingVertical:11,borderRadius:18}, supportBubble:{borderTopLeftRadius:5,backgroundColor:"#F0F2F0"}, customerBubble:{borderTopRightRadius:5,backgroundColor:palette.ink}, body:{fontFamily:typography.regular,fontSize:13,lineHeight:19,color:palette.ink}, customerBody:{color:palette.white}, messageMeta:{marginTop:6,flexDirection:"row",alignItems:"center",justifyContent:"flex-end",gap:5}, time:{fontFamily:typography.medium,fontSize:7.5,color:"#7A827C"}, customerTime:{color:"#BFC6C0"}, retry:{flexDirection:"row",alignItems:"center",gap:3}, retryText:{fontFamily:typography.black,fontSize:7,color:"#FFD7D7"}, composer:{paddingHorizontal:12,paddingTop:10,borderTopWidth:1,borderTopColor:"#E6EAE7",backgroundColor:palette.white}, inputShell:{minHeight:54,paddingLeft:14,paddingRight:5,borderWidth:1,borderColor:"#D9DEDA",borderRadius:20,flexDirection:"row",alignItems:"flex-end",backgroundColor:"#F8F9F8"}, input:{maxHeight:110,minHeight:52,paddingTop:15,paddingBottom:12,flex:1,fontFamily:typography.regular,fontSize:13,color:palette.ink,textAlignVertical:"top"}, send:{width:44,height:44,marginBottom:5,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:palette.greenDark}, sendDisabled:{opacity:.4}, draftNote:{marginTop:5,marginBottom:1,fontFamily:typography.medium,fontSize:7.5,color:"#929893",textAlign:"center"} });
