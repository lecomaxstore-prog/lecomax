import { useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { pcTeacherRoute } from '../utils/pc-teacher';
import { useSchool } from '../store/School';
import { pcExplorerDocument } from '../utils/pc-explorer-document';
import { pcLearningIds, PC_LEARNING_KEY } from '../utils/pc-learning';

export function PcExplorer() {
  const { state, update, t, ready } = useSchool();
  const ref = useRef<HTMLIFrameElement>(null);
  const saved = useRef(state.drafts[PC_LEARNING_KEY]);
  useEffect(() => { saved.current = state.drafts[PC_LEARNING_KEY]; }, [state.drafts]);
  const html = useMemo(() => pcExplorerDocument(state.language), [state.language]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== ref.current?.contentWindow || typeof event.data !== 'string' || event.data.length > 3000) return;
      try {
        const message = JSON.parse(event.data);
        const teacherRoute = pcTeacherRoute(message, state.language);
        if (teacherRoute) { router.push(teacherRoute); return; }
        if (message.type === 'ready') ref.current?.contentWindow?.postMessage(JSON.stringify({ type: 'init', ids: pcLearningIds(saved.current) }), '*');
        if (message.type === 'learned') {
          const ids = pcLearningIds(JSON.stringify(message.ids));
          update(p => ({ ...p, drafts: { ...p.drafts, [PC_LEARNING_KEY]: JSON.stringify([...new Set([...pcLearningIds(p.drafts[PC_LEARNING_KEY]), ...ids])]) } }));
        }
      } catch { /* Ignore malformed embedded messages. */ }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [update, state.language]);
  if (!ready) return null;
  return <iframe ref={ref} onLoad={() => ref.current?.contentWindow?.postMessage(JSON.stringify({ type: 'init', ids: pcLearningIds(saved.current) }), '*')} title={t('Laboratoire PC 3D', '3D PC lab', 'مختبر الحاسوب ثلاثي الأبعاد')} srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ border: 0, width: '100%', height: '100%', flex: 1, background: '#f5f5ef' }} />;
}
