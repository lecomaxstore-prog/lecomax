import React, { useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { TeacherLab } from '../components/TeacherLab';

export default function TerminalPage() {
  const { runtime } = useLocalSearchParams<{ runtime?: string }>();
  const explaining = useRef(false);
  const close = () => { if (explaining.current) return; if (router.canGoBack()) router.back(); else router.replace('/(tabs)/more'); };
  return <TeacherLab visible seed={{ runtime: runtime === 'python' ? 'python' : 'powershell', code: '' }} onClose={close}
    onExplain={(question) => {
      explaining.current = true;
      router.replace({ pathname: '/teacher', params: { question, explain: '1' } });
    }} />;
}
