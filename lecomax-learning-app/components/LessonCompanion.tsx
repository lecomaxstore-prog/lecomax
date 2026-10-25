import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useSchool } from '../store/School';
import type { LessonSupport } from '../types/university';
import { Button, Card, Label, Row } from './UI';

export function LessonCompanion({ support }: { support: LessonSupport }) {
  const { t, colors } = useSchool();
  const [mode, setMode] = useState<'simpler' | 'analogy' | 'example' | 'mistake' | 'visual' | null>(null);
  const [step, setStep] = useState(0);
  const [term, setTerm] = useState<string | null>(null);
  const [linkError, setLinkError] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ borderWidth: 0, backgroundColor: colors.soft, padding: 16 }}>
        <Label size={12} bold>{t('OBJECTIF', 'LEARNING OBJECTIVE', 'هدف الدرس')}</Label>
        <Label>{support.objective}</Label>
      </Card>
      <Row>
        {([
          ['simpler', t('Plus simple', 'Explain simpler', 'بسّط لي')],
          ['analogy', t('Analogie', 'Analogy', 'شبّه لي')],
          ['example', t('Exemple', 'Give example', 'أعطني مثالًا')],
          ['visual', t('Schéma', 'Explain visually', 'اشرح بصريًا')],
          ['mistake', t('Erreur fréquente', 'Common mistake', 'خطأ شائع')],
        ] as const).map(([key, title]) => (
          <Button key={key} quiet selected={mode === key} title={title} onPress={() => setMode(mode === key ? null : key)} />
        ))}
      </Row>
      {mode && mode !== 'visual' && <Card style={{ borderWidth: 0 }}><Label selectable>{support[mode]}</Label></Card>}
      {mode === 'visual' && (
        <Card style={{ borderWidth: 0 }}>
          <Label muted size={12}>{t('Touchez une étape pour la comprendre.', 'Tap a step to explore it.', 'اضغط على أي خطوة لفهم دورها.')}</Label>
          {support.diagram.map((node, i) => (
            <Pressable key={node.title} accessibilityRole="button" accessibilityLabel={node.title}
              accessibilityState={{ expanded: step === i }} onPress={() => setStep(i)}
              style={{ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: step === i ? colors.soft : colors.neutral, gap: 8 }}>
              <Label bold size={14}>{node.title}</Label>
              {step === i && <Label selectable size={14}>{node.detail}</Label>}
            </Pressable>
          ))}
        </Card>
      )}
      <Label muted size={12}>{t('Mots à explorer', 'Tap a technical term', 'اضغط على المصطلح لفهمه')}</Label>
      <Row>{support.terms.map(item => <Button key={item.term} quiet selected={term === item.term} title={item.term} onPress={() => setTerm(term === item.term ? null : item.term)} />)}</Row>
      {support.terms.filter(item => item.term === term).map(item => <Card key={item.term} style={{ borderWidth: 0 }}>
        <Label bold>{item.term}</Label><Label>{item.definition}</Label><Label muted>{item.example}</Label>
      </Card>)}
      {support.sources.length > 0 && <Row>{support.sources.map(source => <Button key={source.url} variant="ghost" title={source.title} onPress={() => {
        setLinkError(false);
        void Linking.openURL(source.url).catch(() => setLinkError(true));
      }} />)}</Row>}
      {linkError && <Label muted>{t('Lien indisponible. Le cours reste disponible hors ligne.', 'Link unavailable. The lesson remains available offline.', 'تعذّر فتح الرابط. يظل الدرس متاحًا دون إنترنت.')}</Label>}
    </View>
  );
}
