import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "@/components/animated-pressable";
import { Screen } from "@/components/screen";
import { palette, typography } from "@/constants/theme";
import { ApiError } from "@/lib/api-client";
import { getSupportConversations, startSupportConversation, type SupportConversation } from "@/services/support";

const statusLabel = { open: "Ouverte", waiting: "Réponse envoyée", resolved: "Résolue" } as const;

export default function SupportScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [composing, setComposing] = useState(Boolean(orderNumber));
  const [subject, setSubject] = useState(orderNumber ? `Commande ${orderNumber}` : "");
  const [message, setMessage] = useState("");
  const conversations = useQuery({ queryKey: ["support-conversations"], queryFn: getSupportConversations });
  const create = useMutation({
    mutationFn: startSupportConversation,
    onSuccess: async ({ conversation }) => {
      setSubject(""); setMessage(""); setComposing(false);
      await queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
      router.push({ pathname: "/support-chat", params: { id: conversation.id } });
    },
  });
  const authRequired = conversations.error instanceof ApiError && conversations.error.status === 401;

  const submit = () => {
    if (!message.trim() || create.isPending) return;
    create.mutate({ subject: subject.trim() || "Demande d’assistance", message: message.trim(), order_number: orderNumber });
  };

  const renderConversation = ({ item }: { item: SupportConversation }) => (
    <AnimatedPressable accessibilityLabel={`Conversation ${item.subject}`} onPress={() => router.push({ pathname: "/support-chat", params: { id: item.id } })} style={styles.conversation}>
      <View style={[styles.conversationIcon, item.customer_unread > 0 && styles.conversationIconUnread]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={item.customer_unread > 0 ? palette.white : palette.greenDark} />
      </View>
      <View style={styles.conversationCopy}>
        <View style={styles.conversationTop}>
          <Text numberOfLines={1} style={styles.conversationTitle}>{item.subject}</Text>
          {item.customer_unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.customer_unread}</Text></View> : null}
        </View>
        <Text numberOfLines={2} style={styles.preview}>{item.last_message || "Conversation démarrée"}</Text>
        <View style={styles.metaRow}><Text style={styles.status}>{statusLabel[item.status]}</Text><Text style={styles.date}>{new Date(item.last_message_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</Text></View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8A918C" />
    </AnimatedPressable>
  );

  return (
    <Screen className="bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <AnimatedPressable accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace("/account")} style={styles.back}><Ionicons name="arrow-back" size={22} color={palette.ink} /></AnimatedPressable>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>SERVICE CLIENT</Text><Text accessibilityRole="header" style={styles.title}>Assistance</Text></View>
          <View style={styles.online}><View style={styles.onlineDot} /><Text style={styles.onlineText}>DISPONIBLE</Text></View>
        </View>

        {authRequired ? (
          <View style={styles.centerState}><Ionicons name="lock-closed-outline" size={42} color={palette.greenDark} /><Text style={styles.stateTitle}>Vos échanges sont privés</Text><Text style={styles.stateText}>Connectez-vous pour démarrer une conversation sécurisée et retrouver vos demandes.</Text><AnimatedPressable onPress={() => router.push({ pathname: "/auth", params: { returnTo: "account" } })} style={styles.primary}><Text style={styles.primaryText}>SE CONNECTER</Text></AnimatedPressable></View>
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
              <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="headset-outline" size={25} color={palette.green} /></View><Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text><Text style={styles.heroText}>Notre équipe répond à vos questions sur les produits, commandes, livraisons et retours.</Text><Text style={styles.availability}>Lun–Sam · 09:00–19:00</Text></View>
              <AnimatedPressable accessibilityLabel="Démarrer une conversation" onPress={() => setComposing((value) => !value)} style={styles.startButton}><Ionicons name={composing ? "close" : "add"} size={20} color={palette.white} /><Text style={styles.startText}>{composing ? "FERMER" : "DÉMARRER UNE CONVERSATION"}</Text></AnimatedPressable>
              {composing ? <View style={styles.composerCard}>
                <Text style={styles.inputLabel}>SUJET</Text><TextInput value={subject} onChangeText={setSubject} maxLength={120} placeholder="Comment pouvons-nous vous aider ?" placeholderTextColor="#8A918C" style={styles.input} />
                <Text style={styles.inputLabel}>MESSAGE</Text><TextInput value={message} onChangeText={setMessage} maxLength={2000} multiline placeholder="Décrivez votre demande…" placeholderTextColor="#8A918C" style={[styles.input, styles.messageInput]} />
                {create.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{create.error.message}</Text> : null}
                <AnimatedPressable disabled={!message.trim() || create.isPending} onPress={submit} style={[styles.sendButton, (!message.trim() || create.isPending) && styles.disabled]}>{create.isPending ? <ActivityIndicator color={palette.white} /> : <><Text style={styles.sendText}>ENVOYER</Text><Ionicons name="arrow-forward" size={18} color={palette.white} /></>}</AnimatedPressable>
                <Text style={styles.privacy}>Vos messages sont transmis uniquement au service client L’ECOMAX.</Text>
              </View> : null}
              <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>MES CONVERSATIONS</Text><Text style={styles.sectionCount}>{conversations.data?.conversations.length ?? 0}</Text></View>
            </>}
            ListEmptyComponent={conversations.isPending ? <ActivityIndicator color={palette.greenDark} style={{ marginTop: 30 }} /> : <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={34} color="#9AA09B" /><Text style={styles.emptyTitle}>Aucune conversation</Text><Text style={styles.emptyText}>Vos échanges avec notre équipe apparaîtront ici.</Text></View>}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex:{flex:1}, header:{height:76,paddingHorizontal:16,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#E9ECEA"}, back:{width:44,height:44,borderRadius:22,alignItems:"center",justifyContent:"center",backgroundColor:"#F3F5F3"}, headerCopy:{flex:1,marginLeft:12}, eyebrow:{fontFamily:typography.black,fontSize:8,color:palette.greenDark,letterSpacing:1.5}, title:{fontFamily:typography.black,fontSize:22,color:palette.ink}, online:{flexDirection:"row",alignItems:"center",gap:5}, onlineDot:{width:7,height:7,borderRadius:4,backgroundColor:palette.greenDark}, onlineText:{fontFamily:typography.black,fontSize:7,color:palette.greenDark}, hero:{padding:22,borderRadius:24,backgroundColor:palette.ink}, heroIcon:{width:48,height:48,borderRadius:16,alignItems:"center",justifyContent:"center",backgroundColor:"#19241C"}, heroTitle:{marginTop:18,fontFamily:typography.black,fontSize:24,lineHeight:29,color:palette.white}, heroText:{marginTop:9,fontFamily:typography.regular,fontSize:13,lineHeight:20,color:"#C5CAC6"}, availability:{marginTop:15,fontFamily:typography.bold,fontSize:9,color:palette.green,letterSpacing:.8}, startButton:{minHeight:54,marginTop:14,paddingHorizontal:18,borderRadius:16,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,backgroundColor:palette.greenDark}, startText:{fontFamily:typography.black,fontSize:10,color:palette.white,letterSpacing:.5}, composerCard:{marginTop:12,padding:16,borderWidth:1,borderColor:"#DDE2DE",borderRadius:20,backgroundColor:"#FAFBFA"}, inputLabel:{marginTop:4,marginBottom:7,fontFamily:typography.black,fontSize:8,color:palette.muted,letterSpacing:1.2}, input:{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:"#D8DDD9",borderRadius:13,fontFamily:typography.medium,fontSize:13,color:palette.ink,backgroundColor:palette.white}, messageInput:{minHeight:108,paddingTop:13,textAlignVertical:"top"}, sendButton:{minHeight:50,marginTop:14,paddingHorizontal:18,borderRadius:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:palette.ink}, disabled:{opacity:.45}, sendText:{fontFamily:typography.black,fontSize:10,color:palette.white}, privacy:{marginTop:10,fontFamily:typography.regular,fontSize:9,lineHeight:14,color:palette.muted}, error:{marginTop:10,fontFamily:typography.bold,fontSize:10,color:palette.red}, sectionHeading:{marginTop:26,marginBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, sectionTitle:{fontFamily:typography.black,fontSize:11,color:palette.ink,letterSpacing:1}, sectionCount:{minWidth:24,paddingHorizontal:7,paddingVertical:3,borderRadius:9,textAlign:"center",fontFamily:typography.black,fontSize:9,color:palette.greenDark,backgroundColor:"#EAF7ED"}, conversation:{minHeight:104,marginBottom:10,padding:14,borderWidth:1,borderColor:"#E1E5E2",borderRadius:18,flexDirection:"row",alignItems:"center",backgroundColor:palette.white}, conversationIcon:{width:43,height:43,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"#EAF7ED"}, conversationIconUnread:{backgroundColor:palette.greenDark}, conversationCopy:{minWidth:0,marginHorizontal:11,flex:1}, conversationTop:{flexDirection:"row",alignItems:"center",gap:7}, conversationTitle:{flex:1,fontFamily:typography.black,fontSize:12,color:palette.ink}, badge:{minWidth:20,height:20,paddingHorizontal:5,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:palette.red}, badgeText:{fontFamily:typography.black,fontSize:8,color:palette.white}, preview:{marginTop:5,fontFamily:typography.regular,fontSize:10,lineHeight:15,color:palette.muted}, metaRow:{marginTop:7,flexDirection:"row",gap:8}, status:{fontFamily:typography.black,fontSize:8,color:palette.greenDark,textTransform:"uppercase"}, date:{fontFamily:typography.medium,fontSize:8,color:"#8A918C"}, empty:{minHeight:220,alignItems:"center",justifyContent:"center"}, emptyTitle:{marginTop:12,fontFamily:typography.black,fontSize:15,color:palette.ink}, emptyText:{marginTop:5,fontFamily:typography.regular,fontSize:11,color:palette.muted}, centerState:{flex:1,paddingHorizontal:32,alignItems:"center",justifyContent:"center"}, stateTitle:{marginTop:18,fontFamily:typography.black,fontSize:22,color:palette.ink,textAlign:"center"}, stateText:{marginTop:9,fontFamily:typography.regular,fontSize:13,lineHeight:20,color:palette.muted,textAlign:"center"}, primary:{minHeight:52,marginTop:22,paddingHorizontal:26,borderRadius:26,alignItems:"center",justifyContent:"center",backgroundColor:palette.ink}, primaryText:{fontFamily:typography.black,fontSize:11,color:palette.white},
});
