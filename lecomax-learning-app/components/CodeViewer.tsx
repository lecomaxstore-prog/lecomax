import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Label, Row } from './UI';
import { useSchool } from '../store/School';
import { toggle } from '../utils/progress';
import { explainSourceLine } from '../services/source-guide';
import { useLocalSearchParams } from 'expo-router';
import { fonts, radius, space } from '../constants/design';
import { highlight } from '../utils/highlight';
import { RunOutcome } from './RunOutcome';
type CodeViewerProps = { code: string; filename: string; annotations?: { lines: string; label: string }[]; start?: number };
export function CodeViewer(props: CodeViewerProps) {
  return <CodeViewerContent key={props.filename + (props.start || 1) + props.code} {...props} />;
}
function CodeViewerContent({
  code,
  filename,
  annotations = [],
  start = 1,
}: {
  code: string;
  filename: string;
  annotations?: { lines: string; label: string }[];
  start?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const { state, update, t, colors } = useSchool();
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const bookmarkKey = params.id
    ? `lesson:${params.id}`
    : params.kind
      ? `collection:${params.kind}`
      : `file:${filename}`;
  const lines = code.split('\n');
  const tokens = useMemo(() => highlight(code), [code]);
  const visible = expanded ? lines : lines.slice(0, 16);
  const codeLines = (
    <View style={wrap ? { width: '100%', minWidth: 0 } : undefined}>
      {visible.map((line, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 }}>
          <Text style={{ color: '#79968B', fontFamily: fonts.code, width: 30, lineHeight: 26, fontSize: 12, textAlign: 'left' }}>{i + start}</Text>
          <Text accessibilityRole="button" accessibilityLabel={t('Expliquer la ligne', 'Explain line', 'اشرح السطر') + ' ' + (i + start) + ': ' + line}
            onPress={() => setActive(i)} style={{ fontFamily: fonts.code, fontSize: 14, lineHeight: 26, color: '#E2EEE6', backgroundColor: active === i ? '#315849' : 'transparent', writingDirection: 'ltr', textAlign: 'left', ...(wrap ? { flex: 1, minWidth: 0 } : {}) }}>
            {tokens[i]?.map((part, j) => <Text key={j} style={{ color: part.color }}>{part.text}</Text>)}
          </Text>
        </View>
      ))}
    </View>
  );
  return (
    <View
      style={{
        backgroundColor: colors.code,
        borderRadius: radius.card,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <Text style={{ color: '#BBE2CA', fontSize: 12, fontFamily: fonts.code }}>
        {filename}
      </Text>
      <Row>
        <Button
          quiet
          title={copied ? t('Copié ✓', 'Copied ✓', 'تم النسخ ✓') : t('Copier', 'Copy', 'نسخ')}
          onPress={() => {
            setCopyError(false);
            Clipboard.setStringAsync(code)
              .then(() => setCopied(true))
              .catch(() => { setCopied(false); setCopyError(true); });
          }}
        />
        <Button
          quiet
          icon={state.codeBookmarks.includes(bookmarkKey) ? 'bookmark' : 'bookmark-outline'}
          title={t('Enregistrer', 'Save code', 'حفظ الكود')}
          onPress={() =>
            update((p) => ({ ...p, codeBookmarks: toggle(p.codeBookmarks, bookmarkKey) }))
          }
        />
      </Row>
      <Label size={12} style={{ color: '#BBE2CA' }}>{t('Appuie sur une ligne pour son explication. Copie conserve le code original.', 'Tap a line for its explanation. Copy preserves the original code.', 'اضغط على سطر لشرح معناه. النسخ يحافظ على الكود الأصلي.')}</Label>
      <Button quiet title={wrap ? t('Voir les lignes originales', 'Show original lines', 'عرض الأسطر الأصلية') : t('Adapter à mon écran', 'Fit to my screen', 'ملاءمة شاشة الهاتف')} onPress={() => setWrap(!wrap)} />
      <RunOutcome filename={filename} code={code} />
      {wrap ? codeLines : <ScrollView horizontal>{codeLines}</ScrollView>}
      {copyError && <Label style={{ color: '#FFD4AD' }} accessibilityRole="alert">{t('Copie impossible. Réessaie.', 'Could not copy. Try again.', 'تعذّر النسخ. حاول مجددًا.')}</Label>}
      {active !== null && (
        <Label style={{ color: '#DCECDF' }}>
          {annotations.find((a) => {
            const [a1, a2] = a.lines.split(/[-–—]/).map(Number);
            return active + start >= (a1 || 0) && active + start <= (a2 || a1 || 0);
          })?.label || explainSourceLine(filename, lines, active + 1, state.language).meaning}
        </Label>
      )}
      {lines.length > 16 && (
        <Button
          quiet
          title={
            expanded
              ? t('Réduire', 'Collapse', 'طي')
              : t(
                  `Afficher ${lines.length} lignes`,
                  `Show ${lines.length} lines`,
                  `عرض ${lines.length} سطرًا`,
                )
          }
          onPress={() => setExpanded(!expanded)}
        />
      )}
    </View>
  );
}
