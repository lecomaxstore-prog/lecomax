import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import { PhonePythonLab } from './PhonePythonLab';
import { Button, Label } from './UI';
import { useSchool } from '../store/School';
import document from '../data/python-mobile-workspace.json';
import { isPythonDraft, pythonProgressSubset, readPythonMobileProgress, readPythonMobileDraft, mergePythonDraftSnapshot } from '../utils/python-mobile-bridge';

export function MobilePythonWorkspace(props: { visible: boolean; seed: { runtime: string; code: string } | null; onClose: () => void; onExplain: (prompt: string) => void }) {
  const { state, update, ready, error, retry, colors, t } = useSchool();
  const [offline, setOffline] = useState(false), [bridgeReady, setBridgeReady] = useState(false), [failure, setFailure] = useState(''), [generation, setGeneration] = useState(0);
  const web = useRef<WebView>(null);
  const pendingDrafts = useRef<Record<string, string>>({});
  const seed = props.seed?.code || '';
  const html = useMemo(() => document.replace('/*PYTHON_SEED*/', `window.pythonSeed=${JSON.stringify(seed).replace(/</g, '\\u003c')};`), [seed]);
  const send = (data: unknown) => web.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(data).replace(/</g, '\\u003c')}}));true;`);
  useEffect(() => { if (bridgeReady) send({ type: 'storage', error }); }, [error, bridgeReady]);
  if (offline && Platform.OS === 'android') return <PhonePythonLab {...props} onClose={() => setOffline(false)} />;
  return <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {!ready && <View style={{ padding: 20 }}><Label accessibilityRole={error ? 'alert' : 'text'}>{error || t('Chargement du brouillon…', 'Loading saved draft…', 'تحميل المسودة…')}</Label>{!!error && <Button title={t('Réessayer', 'Retry storage', 'إعادة المحاولة')} onPress={retry} />}</View>}
        {!!failure && <View style={{ padding: 12 }}><Label accessibilityRole="alert">{failure}</Label><Button title="Reload workspace" onPress={() => { setFailure(''); setBridgeReady(false); setGeneration(n => n + 1); }} /></View>}
        {ready && props.visible && <WebView key={generation + ':' + seed} ref={web} source={{ html }} originWhitelist={['*']} style={{ flex: 1, backgroundColor: colors.bg }}
          javaScriptEnabled domStorageEnabled incognito allowFileAccess={false} allowUniversalAccessFromFileURLs={false} mixedContentMode="never" thirdPartyCookiesEnabled={false} sharedCookiesEnabled={false} javaScriptCanOpenWindowsAutomatically={false}
          keyboardDisplayRequiresUserAction={false} hideKeyboardAccessoryView={false} automaticallyAdjustContentInsets={false} contentInsetAdjustmentBehavior="never"
          onShouldStartLoadWithRequest={request => /^(about:blank|about:srcdoc|data:text\/html)/.test(request.url)}
          onError={event => setFailure(event.nativeEvent.description || 'Python workspace failed to load.')}
          onContentProcessDidTerminate={() => { setFailure('The workspace process stopped. Reload to restore saved work.'); setBridgeReady(false); }}
          onMessage={event => {
            if (event.nativeEvent.data.length > 26000000) { setFailure('Workspace message exceeded the storage limit.'); return; }
            try {
              const message = JSON.parse(event.nativeEvent.data);
              if (message.type === 'ready') { setBridgeReady(true); send({ type: 'init', state: pythonProgressSubset(state), offlineAndroid: Platform.OS === 'android' }); }
              else if (message.type === 'close') props.onClose();
              else if (message.type === 'clipboard' && Number.isSafeInteger(message.id) && message.id > 0 && typeof message.text === 'string' && message.text.length <= 50000) {
                void Clipboard.setStringAsync(message.text).then(
                  () => send({ type: 'clipboard-result', id: message.id, ok: true }),
                  () => send({ type: 'clipboard-result', id: message.id, ok: false }),
                );
              }
              else if (message.type === 'offline' && Platform.OS === 'android') { setBridgeReady(false); setOffline(true); }
              else if (message.type === 'retry-storage') retry();
              else if (message.type === 'draft') {
                const draft = readPythonMobileDraft(message);
                if (!draft) { setFailure('Invalid Python draft. Your existing progress was kept.'); return; }
                if (!(draft.key in state.drafts) && Object.keys(state.drafts).filter(isPythonDraft).length >= 400) { setFailure('Python draft storage is full. Export your work before opening more lessons.'); return; }
                pendingDrafts.current[draft.key] = draft.code;
                update(p => p.drafts[draft.key] === draft.code ? p : { ...p, drafts: { ...p.drafts, [draft.key]: draft.code } });
              }
              else if (message.type === 'progress') {
                const progress = readPythonMobileProgress(message);
                if (!progress) { setFailure('Invalid Python progress message. Your existing progress was kept.'); return; }
                const merged = mergePythonDraftSnapshot(progress.drafts, pendingDrafts.current);
                pendingDrafts.current = merged.pending;
                update(p => ({ ...p, drafts: { ...Object.fromEntries(Object.entries(p.drafts).filter(([key]) => !isPythonDraft(key))), ...merged.drafts }, answers: { ...p.answers, ...progress.answers } }));
              } else if (message.type === 'explain' && typeof message.prompt === 'string' && message.prompt.length <= 6000) { props.onExplain(message.prompt); props.onClose(); }
            } catch { setFailure('The Python workspace sent an unreadable message.'); }
          }} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
