import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components/animated-pressable';
import { Screen } from '@/components/screen';
import { typography } from '@/constants/theme';
import { useSupportAccount, useSupportActive } from '@/hooks/use-support-account';
import { createSupportMessageId, getSupportConversation, sendSupportAttachment, sendSupportMessage, type SupportMessage } from '@/services/support';

type Outgoing = SupportMessage & { failed?: boolean; pending?: boolean };
const green = '#174F3D';
const fileSize = (size: number) => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(size / 1024))} Ko`;
const dayKey = (date: string) => new Date(date).toLocaleDateString('fr-FR');
function dayLabel(date: string) {
  if (dayKey(date) === dayKey(new Date().toISOString())) return 'Aujourd’hui';
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  return dayKey(date) === dayKey(yesterday.toISOString()) ? 'Hier' : new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SupportChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const account = useSupportAccount();
  if (!account.ready) return <Screen><View style={s.center}><ActivityIndicator color={green} /></View></Screen>;
  if (!account.id || account.error) return <Screen><View style={s.center}><Ionicons name="lock-closed-outline" size={32} color={green} /><Text style={s.stateTitle}>{account.error || 'Connectez-vous pour retrouver vos messages'}</Text><AnimatedPressable style={s.action} onPress={account.error ? account.retry : () => router.push('/auth')}><Text style={s.actionText}>{account.error ? 'Réessayer' : 'Se connecter'}</Text></AnimatedPressable></View></Screen>;
  return <Chat key={account.id + id} id={id} userId={account.id} />;
}

function Chat({ id, userId }: { id: string; userId: string }) {
  const active = useSupportActive();
  const client = useQueryClient();
  const list = useRef<FlatList<Outgoing>>(null);
  const nearBottom = useRef(true);
  const [draft, setDraft] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [inputFocused, setInputFocused] = useState(false);
  const [outbox, setOutbox] = useState<Outgoing[]>([]);
  const [restored, setRestored] = useState(false);
  const [asset, setAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileError, setFileError] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showLatest, setShowLatest] = useState(false);
  const fileAttempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const storageKey = `LECOMAX_SUPPORT_DRAFT:${userId}:${id}`;
  const queryKey = ['support-conversation', userId, id];
  const query = useQuery({ queryKey, queryFn: () => getSupportConversation(id), enabled: Boolean(id), refetchInterval: active ? 5000 : false, retry: false });

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(storageKey).then(value => {
      if (!mounted || !value) return;
      try {
        const saved = JSON.parse(value);
        if (typeof saved.draft === 'string') setDraft(saved.draft);
        if (Array.isArray(saved.outbox)) setOutbox(saved.outbox.filter((m: Outgoing) => m.conversation_id === id && m.sender_type === 'customer' && typeof m.body === 'string').map((m: Outgoing) => ({ ...m, pending: false, failed: true })));
      } catch { /* Invalid local drafts do not affect server history. */ }
    }).catch(() => {}).finally(() => { if (mounted) setRestored(true); });
    return () => { mounted = false; };
  }, [storageKey, id]);
  useEffect(() => {
    if (restored) void AsyncStorage.setItem(storageKey, JSON.stringify({ draft, outbox })).catch(() => {});
  }, [draft, outbox, restored, storageKey]);

  const scrollToLatest = () => { nearBottom.current = true; setShowLatest(false); list.current?.scrollToEnd({ animated: true }); };
  const send = useMutation({
    mutationFn: ({ body, clientId, file }: { body: string; clientId: string; file?: DocumentPicker.DocumentPickerAsset }) => file ? sendSupportAttachment(id, body, clientId, file) : sendSupportMessage(id, body, clientId),
    onSuccess: ({ message }, variables) => {
      client.setQueryData<Awaited<ReturnType<typeof getSupportConversation>>>(queryKey, current => current ? { ...current, messages: current.messages.some(m => m.id === message.id) ? current.messages : [...current.messages, message] } : current);
      setOutbox(current => current.filter(m => m.client_message_id !== variables.clientId));
      if (variables.file) { setAsset(null); setDraft(''); fileAttempt.current = null; }
      setFileError('');
      void client.invalidateQueries({ queryKey: ['support-conversations'] });
      void query.refetch();
    },
    onError: (error, variables) => {
      if (variables.file) setFileError(error.message);
      else setOutbox(current => current.map(m => m.client_message_id === variables.clientId ? { ...m, pending: false, failed: true } : m));
    },
  });

  const submit = (retry?: Outgoing) => {
    const body = (retry?.body ?? draft).trim();
    const file = retry ? null : asset;
    if ((!body && !file) || send.isPending || !restored) return;
    let clientId = retry?.client_message_id || createSupportMessageId();
    if (file) {
      const fingerprint = JSON.stringify([file.uri, file.name, file.size, body]);
      if (fileAttempt.current?.fingerprint !== fingerprint) fileAttempt.current = { fingerprint, id: clientId };
      clientId = fileAttempt.current.id;
    } else if (retry) setOutbox(current => current.map(m => m.id === retry.id ? { ...m, pending: true, failed: false } : m));
    else {
      setDraft('');
      setOutbox(current => [...current, { id: clientId, conversation_id: id, sender_type: 'customer', body, client_message_id: clientId, created_at: new Date().toISOString(), pending: true }]);
    }
    send.mutate({ body, clientId, file: file ?? undefined });
    nearBottom.current = true;
    requestAnimationFrame(scrollToLatest);
  };

  const pickFile = async () => {
    setFileError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (selected.size && selected.size > 3 * 1024 * 1024) { setFileError('Choisissez un fichier de moins de 3 Mo.'); return; }
      setAsset(selected);
    } catch { setFileError('Impossible d’ouvrir vos fichiers. Réessayez.'); }
  };

  const savedIds = new Set(query.data?.messages.map(m => m.client_message_id));
  const messages = [...(query.data?.messages ?? []), ...outbox.filter(m => !savedIds.has(m.client_message_id))].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const renderMessage = ({ item, index }: { item: Outgoing; index: number }) => {
    const mine = item.sender_type === 'customer';
    const newDay = index === 0 || dayKey(messages[index - 1].created_at) !== dayKey(item.created_at);
    const grouped = !newDay && messages[index - 1].sender_type === item.sender_type;
    const attachment = item.attachment;
    return <>
      {newDay ? <View style={s.dayRow}><Text style={s.day}>{dayLabel(item.created_at)}</Text></View> : null}
      <View style={[s.messageRow, mine && s.messageMine, grouped && { marginTop: 3 }]}>
        {!mine ? <View style={[s.miniAvatar, grouped && { opacity: 0 }]}><Image source={require('../../assets/images/support/customer-care-v1.png')} accessibilityLabel="Service client L’ECOMAX" style={{ width: 24, height: 24, borderRadius: 10 }} /></View> : null}
        <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTeam]}>
          {!mine && !grouped ? <Text style={s.sender}>L’ECOMAX</Text> : null}
          {attachment ? <AnimatedPressable disabled={!attachment.url} accessibilityRole="button" accessibilityLabel={`Ouvrir ${attachment.name}`} onPress={() => { if (!attachment.url) return; if (attachment.type.startsWith('image/')) setLightbox(attachment.url); else void Linking.openURL(attachment.url).catch(() => setFileError('Impossible d’ouvrir ce document.')); }} style={[s.fileCard, mine && s.fileCardMine]}>
            {attachment.type.startsWith('image/') && attachment.url ? <Image source={{ uri: attachment.url }} resizeMode="cover" style={s.photo} /> : <View style={s.documentRow}><View style={s.pdfIcon}><Ionicons name="document-text-outline" size={25} color={green} /></View><View style={s.fileCopy}><Text numberOfLines={2} style={[s.fileName, mine && s.white]}>{attachment.name}</Text><Text style={[s.fileDetail, mine && s.lightText]}>PDF · {fileSize(attachment.size)}</Text></View><Ionicons name="download-outline" size={18} color={mine ? '#D6E8DD' : green} /></View>}
            {!attachment.url ? <Text style={[s.fileDetail, mine && s.lightText]}>Fichier indisponible · Actualisez la conversation</Text> : null}
          </AnimatedPressable> : null}
          {item.body ? <Text selectable style={[s.body, mine && s.white]}>{item.body}</Text> : null}
          <View style={s.messageMeta}><Text style={[s.time, mine && s.lightText]}>{new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>{item.pending ? <Ionicons name="time-outline" size={12} color="#BDDBC9" /> : item.failed ? <AnimatedPressable accessibilityLabel="Réessayer l’envoi" onPress={() => submit(item)}><Text style={s.failed}>Réessayer ↻</Text></AnimatedPressable> : mine ? <Ionicons name={item.read_at ? 'checkmark-done' : 'checkmark'} size={15} color={item.read_at ? '#8AE3C5' : '#BDDBC9'} /> : null}</View>
        </View>
      </View>
    </>;
  };

  return <Screen className="bg-white"><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
    <View style={s.header}>
      <AnimatedPressable accessibilityLabel="Retour aux conversations" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/support')}><Ionicons name="chevron-back" size={23} color={green} /></AnimatedPressable>
      <View style={s.avatar}><Image source={require('../../assets/images/support/customer-care-v1.png')} accessibilityLabel="Service client L’ECOMAX" style={{ width: 45, height: 45, borderRadius: 17 }} /><View style={s.verified}><Ionicons name="checkmark" size={9} color="white" /></View></View>
      <View style={s.headerCopy}><Text style={s.headerTitle}>L’ECOMAX <Text style={s.headerSuffix}>Assistance</Text></Text><Text numberOfLines={1} style={s.headerSubject}>{query.data?.conversation.subject || 'Votre conversation'}</Text></View>
      <View accessibilityLabel="Conversation privée" style={s.headerLock}><Ionicons name="lock-closed-outline" size={17} color={green} /></View>
    </View>
    <View style={s.canvas}>
      <View pointerEvents="none" style={s.orbOne} /><View pointerEvents="none" style={s.orbTwo} />
      {query.isPending ? <View style={s.center}><ActivityIndicator color={green} /><Text style={s.hint}>Chargement de vos échanges…</Text></View> : query.isError && !query.data ? <View style={s.center}><Ionicons name="cloud-offline-outline" size={34} color={green} /><Text style={s.stateTitle}>Conversation indisponible</Text><Text style={s.hint}>{query.error.message}</Text><AnimatedPressable style={s.action} onPress={() => void query.refetch()}><Text style={s.actionText}>Réessayer</Text></AnimatedPressable></View> : <>
        <FlatList style={s.flex} ref={list} data={messages} renderItem={renderMessage} keyExtractor={m => m.id} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => { if (nearBottom.current) list.current?.scrollToEnd({ animated: false }); }} onScroll={({ nativeEvent: n }) => { nearBottom.current = n.contentSize.height - n.layoutMeasurement.height - n.contentOffset.y < 120; setShowLatest(!nearBottom.current); }} scrollEventThrottle={100} ListHeaderComponent={<View style={s.intro}><View style={s.introIcon}><Ionicons name="leaf-outline" size={22} color={green} /></View><Text style={s.introTitle}>Un échange, en toute simplicité.</Text><Text style={s.introText}>Notre équipe vous accompagne, ici.</Text><View style={s.privateRow}><Ionicons name="lock-closed-outline" size={10} color="#859083" /><Text style={s.privateText}>Conversation privée avec le service client</Text></View></View>} />
        {showLatest ? <AnimatedPressable accessibilityLabel="Voir les derniers messages" onPress={scrollToLatest} style={s.latest}><Ionicons name="chevron-down" size={21} color={green} /></AnimatedPressable> : null}
      </>}
    </View>
    <View style={s.composer}>
      {asset ? <View style={s.selectedFile}>{asset.mimeType?.startsWith('image/') ? <Image source={{ uri: asset.uri }} style={s.selectedThumb} /> : <View style={s.pdfIcon}><Ionicons name="document-text-outline" size={23} color={green} /></View>}<View style={s.fileCopy}><Text numberOfLines={1} style={s.fileName}>{asset.name}</Text><Text style={s.fileDetail}>{fileSize(asset.size ?? 0)} · Prêt à envoyer</Text></View><AnimatedPressable disabled={send.isPending} accessibilityLabel="Retirer le fichier" onPress={() => setAsset(null)} style={s.remove}><Ionicons name="close" size={19} color={green} /></AnimatedPressable></View> : null}
      {fileError || (query.isError && query.data) ? <Text accessibilityLiveRegion="polite" style={s.error}>{fileError || 'Actualisation impossible. Vos messages restent affichés.'}</Text> : null}
      <View style={[s.composerField, inputFocused && s.composerFieldFocused]}>
        <AnimatedPressable disabled={send.isPending || !restored || !query.data} accessibilityRole="button" accessibilityLabel="Joindre une photo ou un PDF" onPress={() => void pickFile()} style={s.attachmentButton}>
          <Ionicons name="attach-outline" size={23} color="#69806E" />
        </AnimatedPressable>
        <TextInput
          accessibilityLabel="Votre message"
          editable={restored && !send.isPending && Boolean(query.data)}
          value={draft}
          onChangeText={value => { setDraft(value); if (!value) setInputHeight(44); }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onContentSizeChange={({ nativeEvent }) => setInputHeight(Math.max(44, Math.min(112, nativeEvent.contentSize.height)))}
          maxLength={asset ? 1000 : 2000}
          multiline
          numberOfLines={1}
          placeholder={asset ? 'Ajouter une légende…' : 'Écrivez un message…'}
          placeholderTextColor="#919B92"
          selectionColor="#93AE96"
          underlineColorAndroid="transparent"
          style={[s.messageInput, { height: draft ? inputHeight : 44 }, Platform.OS === 'web' && s.messageInputWeb]}
        />
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
          disabled={(!draft.trim() && !asset) || send.isPending || !restored || !query.data}
          onPress={() => submit()}
          style={[s.sendButton, ((!draft.trim() && !asset) || !restored || !query.data) && s.sendButtonIdle]}
        >
          {send.isPending ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="arrow-up" size={22} color={(!draft.trim() && !asset) || !restored || !query.data ? '#78917E' : 'white'} />}
        </AnimatedPressable>
      </View>
      {asset ? <Text style={s.composerHint}>{send.isPending ? 'Envoi du fichier en cours…' : `${draft.length}/1 000 · Photo ou document privé`}</Text> : null}
    </View>
    <Modal visible={Boolean(lightbox)} transparent animationType="fade" onRequestClose={() => setLightbox(null)}><View style={s.lightbox}><AnimatedPressable accessibilityLabel="Fermer la photo" onPress={() => setLightbox(null)} style={s.lightboxClose}><Ionicons name="close" size={28} color="white" /></AnimatedPressable>{lightbox ? <Image source={{ uri: lightbox }} resizeMode="contain" style={s.fullImage} /> : null}</View></Modal>
  </KeyboardAvoidingView></Screen>;
}

const s = StyleSheet.create({
  composerField:{flexDirection:'row',alignItems:'flex-end',gap:2,padding:5,minHeight:56,borderWidth:1,borderColor:'#DFE6DA',borderRadius:28,backgroundColor:'#FFFFFF'},
  composerFieldFocused:{borderColor:'#93AE96'},
  messageInputWeb:{outlineWidth:0,outlineColor:'transparent',boxShadow:'none'},
  attachmentButton:{width:40,height:44,alignItems:'center',justifyContent:'center',borderRadius:22},
  messageInput:{flex:1,minWidth:0,minHeight:44,maxHeight:112,paddingTop:12,paddingBottom:12,paddingLeft:2,paddingRight:10,fontFamily:typography.regular,fontSize:14,lineHeight:20,color:'#2E4434',textAlignVertical:'top',borderWidth:0,backgroundColor:'transparent'},
  sendButton:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:green},
  sendButtonIdle:{backgroundColor:'#E7EDE3'},
  flex:{flex:1}, center:{flex:1,justifyContent:'center',alignItems:'center',padding:28,gap:14}, stateTitle:{fontFamily:typography.semibold,fontSize:19,color:green,textAlign:'center'}, hint:{fontFamily:typography.regular,fontSize:13,color:'#7C897E',textAlign:'center'}, action:{backgroundColor:green,borderRadius:20,paddingHorizontal:24,paddingVertical:14},actionText:{color:'white',fontFamily:typography.semibold},
  header:{height:83,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderBottomColor:'#E8EDE6',backgroundColor:'#FFFFFF'},back:{width:28,height:44,justifyContent:'center'},avatar:{width:45,height:45,borderRadius:17,backgroundColor:green,alignItems:'center',justifyContent:'center'},avatarText:{fontFamily:typography.semibold,fontSize:24,color:'#E6EFDE',letterSpacing:-2},verified:{position:'absolute',bottom:-2,right:-2,width:15,height:15,borderRadius:8,backgroundColor:'#73A889',borderWidth:2,borderColor:'white',alignItems:'center',justifyContent:'center'},headerCopy:{flex:1,minWidth:0},headerTitle:{fontFamily:typography.semibold,fontSize:14,color:'#203B2E',letterSpacing:-.3},headerSuffix:{fontFamily:typography.regular,color:'#788578',fontSize:12},headerSubject:{fontFamily:typography.regular,fontSize:11,color:'#7B8B7C',marginTop:5},headerLock:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'#F1F5ED'},
  canvas:{flex:1,backgroundColor:'#F3F3EA',overflow:'hidden'},orbOne:{position:'absolute',width:380,height:380,borderRadius:190,borderWidth:1,borderColor:'#E8EBDD',right:-190,top:120},orbTwo:{position:'absolute',width:450,height:450,borderRadius:225,borderWidth:1,borderColor:'#E9ECDF',left:-250,bottom:-160},messages:{paddingHorizontal:18,paddingBottom:25},intro:{alignItems:'center',paddingTop:27,paddingBottom:18},introIcon:{height:44,width:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#E7ECDD',marginBottom:12},introTitle:{fontFamily:typography.medium,fontSize:15,color:'#50624E',letterSpacing:-.2},introText:{fontFamily:typography.regular,fontSize:11,color:'#899280',marginTop:5},privateRow:{flexDirection:'row',gap:5,alignItems:'center',marginTop:14},privateText:{fontFamily:typography.regular,fontSize:9,color:'#899280'},dayRow:{alignItems:'center',marginVertical:17},day:{backgroundColor:'#E8EBE0',borderRadius:10,paddingVertical:6,paddingHorizontal:12,color:'#71806C',fontSize:10,fontFamily:typography.medium},
  messageRow:{flexDirection:'row',alignItems:'flex-end',gap:7,marginTop:13},messageMine:{justifyContent:'flex-end'},miniAvatar:{width:24,height:24,borderRadius:10,backgroundColor:'#E0E7D8',alignItems:'center',justifyContent:'center',marginBottom:2},miniAvatarText:{fontFamily:typography.semibold,fontSize:12,color:green},bubble:{maxWidth:'83%',paddingHorizontal:14,paddingTop:11,paddingBottom:7,borderRadius:20,minWidth:72},bubbleMine:{backgroundColor:green,borderBottomRightRadius:5},bubbleTeam:{backgroundColor:'#FFFFFF',borderBottomLeftRadius:5,borderWidth:1,borderColor:'#E8EBE1'},sender:{fontFamily:typography.semibold,fontSize:9,color:'#749273',letterSpacing:.6,marginBottom:6},body:{fontFamily:typography.regular,fontSize:14,lineHeight:21,color:'#293B2D'},white:{color:'#FFFFFF'},lightText:{color:'#ACCCB9'},messageMeta:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:4},time:{fontFamily:typography.regular,fontSize:9,color:'#9BA597'},failed:{fontFamily:typography.medium,fontSize:10,color:'#FFD1C8'},latest:{position:'absolute',bottom:14,right:18,width:40,height:40,borderRadius:20,backgroundColor:'white',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#DCE5D6'},
  composer:{paddingHorizontal:14,paddingTop:12,paddingBottom:8,borderTopWidth:1,borderTopColor:'#E5EADD',backgroundColor:'#FCFDF9'},composerRow:{flexDirection:'row',alignItems:'flex-end',gap:9},inputShell:{flex:1,flexDirection:'row',alignItems:'flex-end',minHeight:51,borderWidth:1,borderColor:'#E1E7DC',borderRadius:25,backgroundColor:'white'},attach:{width:43,height:50,alignItems:'center',justifyContent:'center'},input:{flex:1,minHeight:50,maxHeight:115,paddingTop:15,paddingBottom:13,paddingRight:13,fontFamily:typography.regular,fontSize:13,lineHeight:20,color:'#2E4434'},send:{width:51,height:51,borderRadius:20,backgroundColor:green,alignItems:'center',justifyContent:'center'},sendDisabled:{backgroundColor:'#A9BEAA'},composerHint:{fontFamily:typography.regular,fontSize:8,color:'#9AA591',textAlign:'center',marginTop:8},error:{fontFamily:typography.medium,fontSize:11,color:'#B54736',paddingBottom:10},selectedFile:{padding:9,borderRadius:15,backgroundColor:'#EBF0E6',flexDirection:'row',alignItems:'center',gap:10,marginBottom:10},selectedThumb:{width:45,height:45,borderRadius:10},fileCopy:{flex:1,minWidth:0},fileName:{fontFamily:typography.medium,fontSize:12,color:'#274832'},fileDetail:{fontFamily:typography.regular,fontSize:10,color:'#84937E',marginTop:4},remove:{padding:7},fileCard:{backgroundColor:'#F0F4ED',borderRadius:12,overflow:'hidden',marginBottom:6},fileCardMine:{backgroundColor:'#28604C'},documentRow:{flexDirection:'row',alignItems:'center',gap:9,padding:10,maxWidth:260},pdfIcon:{height:42,width:36,backgroundColor:'#DFEADC',borderRadius:9,alignItems:'center',justifyContent:'center'},photo:{width:220,height:190},lightbox:{flex:1,backgroundColor:'rgba(10,20,14,.97)',alignItems:'center',justifyContent:'center'},lightboxClose:{position:'absolute',top:50,right:22,zIndex:1,padding:10},fullImage:{width:'100%',height:'80%'},
});
