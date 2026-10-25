import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { glossaryEntries } from '../../services/glossary';
import { searchLessons } from '../../services/content';
import { useSchool } from '../../store/School';
import { Card, Label, ListItem, Page } from '../../components/UI';

export default function Definition() {
  const { term } = useLocalSearchParams<{ term: string }>();
  const { state, t } = useSchool();
  const entry = glossaryEntries(state.language).find(item => item.term === term);
  if (!entry) return <Page title={t('Terme introuvable', 'Term not found', 'المصطلح غير موجود')} />;
  const related = searchLessons(entry.term, state.language).slice(0, 8);
  return <Page title={entry.term} subtitle={t('Dictionnaire technique', 'Technical dictionary', 'قاموس التقنية')}>
    {entry.contentLanguage !== state.language && <Label muted>{t('Définition originale en arabe', 'Original definition in Arabic', 'التعريف الأصلي بالعربية')}</Label>}
    <Card><Label selectable>{entry.definition}</Label>{!!entry.example && <><Label bold>{t('Exemple', 'Example', 'مثال')}</Label><Label>{entry.example}</Label></>}</Card>
    <Label bold>{t('Pour comprendre en pratique', 'Learn it in practice', 'افهمها بالتطبيق')}</Label>
    {related.map(l => <ListItem key={l.id} title={l.title[state.language]} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })} />)}
    {!related.length && <Label muted>{t('Aucune leçon associée pour le moment.', 'No related lesson yet.', 'لا يوجد درس مرتبط حاليًا.')}</Label>}
  </Page>;
}
