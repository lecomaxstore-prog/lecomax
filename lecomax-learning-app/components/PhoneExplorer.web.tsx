import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { phoneTeacherRoute } from '../utils/phone-teacher';
import { useSchool } from '../store/School';
import { phoneExplorerDocument } from '../utils/phone-explorer-document';
import { phoneLearningIds, PHONE_LEARNING_KEY } from '../utils/phone-learning';

export function PhoneExplorer() {
  const { state, update, t } = useSchool();
  const ref = useRef<HTMLIFrameElement>(null);
  const saved = useRef(state.drafts[PHONE_LEARNING_KEY]);
  useEffect(() => { saved.current = state.drafts[PHONE_LEARNING_KEY]; }, [state.drafts]);
  const html = useMemo(() => phoneExplorerDocument(state.language), [state.language]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || typeof event.data !== 'string' || event.data.length > 3000) return;
      try {
        const message = JSON.parse(event.data);
        const teacherRoute = phoneTeacherRoute(message, state.language);
        if (teacherRoute) { router.push(teacherRoute); return; }
        if (message.type === 'ready') ref.current?.contentWindow?.postMessage(JSON.stringify({ type: 'init', ids: phoneLearningIds(saved.current) }), '*');
        if (message.type === 'learned') {
          const ids = phoneLearningIds(JSON.stringify(message.ids));
          update(p => ({ ...p, drafts: { ...p.drafts, [PHONE_LEARNING_KEY]: JSON.stringify([...new Set([...phoneLearningIds(p.drafts[PHONE_LEARNING_KEY]), ...ids])]) } }));
        }
      } catch { /* Ignore malformed embedded messages. */ }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [update, state.language]);
  return <iframe ref={ref} onLoad={() => ref.current?.contentWindow?.postMessage(JSON.stringify({ type: 'init', ids: phoneLearningIds(saved.current) }), '*')} title={t('Laboratoire téléphone 3D', '3D phone lab', 'مختبر الهاتف ثلاثي الأبعاد')} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ border: 0, width: '100%', height: '100%', flex: 1, background: '#f5f5ef' }} />;
}
