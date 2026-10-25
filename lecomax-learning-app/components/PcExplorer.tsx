import { useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { pcTeacherRoute } from '../utils/pc-teacher';
import { Linking, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSchool } from '../store/School';
import { pcExplorerDocument } from '../utils/pc-explorer-document';
import { pcLearningIds, PC_LEARNING_KEY } from '../utils/pc-learning';

export function PcExplorer() {
  const { state, update, ready } = useSchool();
  const ref = useRef<WebView>(null);
  const html = useMemo(() => pcExplorerDocument(state.language), [state.language]);
  if (!ready) return null;
  return <View style={{ flex: 1 }}><WebView ref={ref} source={{ html }} originWhitelist={['about:*']} javaScriptEnabled
    onShouldStartLoadWithRequest={request => {
      if (/^about:(blank|srcdoc)/.test(request.url)) return true;
      if (['https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html', 'https://www.kingston.com/en/ssd/ssd-faq'].includes(request.url)) void Linking.openURL(request.url).catch(() => {});
      return false;
    }}
    onMessage={event => {
      if (event.nativeEvent.data.length > 3000) return;
      try {
        const message = JSON.parse(event.nativeEvent.data);
        const teacherRoute = pcTeacherRoute(message, state.language);
        if (teacherRoute) { router.push(teacherRoute); return; }
        if (message.type === 'ready') ref.current?.postMessage(JSON.stringify({ type: 'init', ids: pcLearningIds(state.drafts[PC_LEARNING_KEY]) }));
        if (message.type === 'learned') {
          const ids = pcLearningIds(JSON.stringify(message.ids));
          update(p => ({ ...p, drafts: { ...p.drafts, [PC_LEARNING_KEY]: JSON.stringify([...new Set([...pcLearningIds(p.drafts[PC_LEARNING_KEY]), ...ids])]) } }));
        }
      } catch { /* Ignore malformed embedded messages. */ }
    }} /></View>;
}
