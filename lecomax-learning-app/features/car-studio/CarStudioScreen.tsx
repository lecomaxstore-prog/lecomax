import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Label } from '../../components/UI';
import { useSchool } from '../../store/School';
import StudioFrame from './StudioFrame';
import { readStudioEvent } from './vehicle';
import runtime from '../../data/car-studio-runtime.json';

function StudioSession() {
  const { state, update } = useSchool();
  // Keep srcDoc stable during progress writes; snapshot again on remount after navigation.
  const [completed] = useState(() => state.carStudio.studied);
  const html = useMemo(() => runtime.replace('/*STUDIO_BOOT*/', `window.studioBoot=${JSON.stringify({ language: state.language, completed }).replace(/</g, '\\u003c')};`), [state.language, completed]);
  const onEvent = useCallback((value: unknown) => {
    const event = readStudioEvent(value); if (!event) return;
    update(previous => {
      const progress = previous.carStudio;
      if (event.type === 'learned') return progress.studied.includes(event.id) ? previous : { ...previous, carStudio: { ...progress, studied: [...progress.studied, event.id] } };
      return { ...previous, carStudio: { ...progress, answers: { ...progress.answers, [event.id]: { correct: event.correct === true, attempts: (progress.answers[event.id]?.attempts || 0) + 1 } } } };
    });
  }, [update]);
  return <StudioFrame html={html} onEvent={onEvent} />;
}
export default function CarStudioScreen() {
  const { ready, error, retry, t } = useSchool();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  return <View style={{ flex: 1, backgroundColor: '#0a101a' }}>
    {error ? <View style={{ padding: 10 }}><Label>{error}</Label><Button title={t('Réessayer la sauvegarde', 'Retry progress storage', 'عاود حفظ التقدّم')} onPress={retry} /></View> : null}
    {ready && focused ? <StudioSession /> : <Label>{t('Chargement…', 'Loading…', 'تحميل…')}</Label>}
    <Pressable accessibilityRole="button" onPress={() => router.push('/change-history')} style={{ minHeight: 44, padding: 10, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#26384a' }}>
      <Text style={{ color: '#a8c3d9', fontSize: 12 }}>{t('Changements effectués', 'Changes Made', 'التغييرات')}</Text>
    </Pressable>
  </View>;
}
