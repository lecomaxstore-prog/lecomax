import { useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { phoneTeacherRoute } from '../utils/phone-teacher';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSchool } from '../store/School';
import { phoneExplorerDocument } from '../utils/phone-explorer-document';
import { phoneLearningIds, PHONE_LEARNING_KEY } from '../utils/phone-learning';

export function PhoneExplorer() {
  const { state, update } = useSchool();
  const ref = useRef<WebView>(null);
  const html = useMemo(() => phoneExplorerDocument(state.language), [state.language]);
  return <View style={{ flex: 1 }}><WebView ref={ref} source={{ html }} originWhitelist={['about:*']} javaScriptEnabled
    onShouldStartLoadWithRequest={request => {
      if (/^about:(blank|srcdoc)/.test(request.url)) return true;
      if (['https://support.apple.com/en-ph/104900', 'https://developer.android.com/guide/platform/index.html'].includes(request.url)) void Linking.openURL(request.url).catch(() => {});
      return false;
    }}
    onMessage={event => {
      if (event.nativeEvent.data.length > 3000) return;
      try {
        const message = JSON.parse(event.nativeEvent.data);
        const teacherRoute = phoneTeacherRoute(message, state.language);
        if (teacherRoute) { router.push(teacherRoute); return; }
        if (message.type === 'ready') ref.current?.postMessage(JSON.stringify({ type: 'init', ids: phoneLearningIds(state.drafts[PHONE_LEARNING_KEY]) }));
        if (message.type === 'learned') {
          const ids = phoneLearningIds(JSON.stringify(message.ids));
          update(p => ({ ...p, drafts: { ...p.drafts, [PHONE_LEARNING_KEY]: JSON.stringify([...new Set([...phoneLearningIds(p.drafts[PHONE_LEARNING_KEY]), ...ids])]) } }));
        }
      } catch { /* Ignore malformed embedded messages. */ }
    }} /></View>;
}
