import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Label, Row } from './UI';
import { useSchool } from '../store/School';
import { fonts, radius, space } from '../constants/design';
import { teacherBlocks } from '../utils/teacher-markdown';
import { highlight } from '../utils/highlight';
import { labRuntime, type LabSeed } from './TeacherLab';
import type { WebSeed } from './TeacherWebStudio';
import { TeacherFormula } from './TeacherFormula';

function Code({
  text,
  language,
  onExplain,
  onRun,
  onPreview,
}: {
  text: string;
  language?: string;
  onExplain?: (code: string) => void;
  onRun?: (seed: LabSeed) => void;
  onPreview?: (seed: WebSeed) => void;
}) {
  const { t, colors } = useSchool();
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => highlight(text), [text]);
  return (
    <View
      style={{
        backgroundColor: colors.code,
        borderRadius: radius.control,
        padding: space.lg,
        gap: space.md,
        minWidth: 0,
      }}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: '#BBE2CA', fontSize: 12 }}>{language || 'code'}</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: 8,
            opacity: pressed ? 0.6 : 1,
          })}
          accessibilityLabel={
            copied
              ? t('Copié', 'Copied', 'تم النسخ')
              : t('Copier le code', 'Copy code', 'نسخ الكود')
          }
          onPress={() => {
            Clipboard.setStringAsync(text)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          }}
        >
          <Label size={12} style={{ color: '#BBE2CA' }}>
            {copied
              ? t('Copié', 'Copied', 'تم النسخ')
              : t('Copier le code', 'Copy code', 'نسخ الكود')}
          </Label>
        </Pressable>
      </Row>
      <ScrollView horizontal style={{ maxWidth: '100%', direction: 'ltr' }}>
        <Text
          selectable
          style={{
            fontFamily: fonts.code,
            color: '#E2EEE6',
            fontSize: 13,
            lineHeight: 22,
            writingDirection: 'ltr',
            textAlign: 'left',
          }}
        >
          {lines.map((tokens, i) => (
            <Text key={i}>
              {i > 0 ? '\n' : ''}
              {tokens.map((token, j) => (
                <Text key={j} style={{ color: token.color }}>
                  {token.text}
                </Text>
              ))}
            </Text>
          ))}
        </Text>
      </ScrollView>
      {onPreview && /^(html|htm|css|js|javascript)$/i.test(language || '') && (
        <Pressable
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
          onPress={() => onPreview({ language: language!.toLowerCase(), code: text })}
        >
          <Label style={{ color: '#BBE2CA' }}>
            {t('Modifier et prévisualiser', 'Edit and preview', 'عدّل وعاين')}
          </Label>
        </Pressable>
      )}
      {onRun && labRuntime(language) && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onRun({ code: text, runtime: labRuntime(language)! })}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Label style={{ color: '#BBE2CA' }}>
            {t('Ouvrir dans le laboratoire', 'Open in practice lab', 'افتح في المختبر العملي')}
          </Label>
        </Pressable>
      )}
      {onExplain && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Expliquer ce code', 'Explain this code', 'اشرح هذا الكود')}
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: 'center',
            borderTopWidth: 1,
            borderTopColor: '#355147',
            opacity: pressed ? 0.6 : 1,
          })}
          onPress={() => onExplain(text)}
        >
          <Label size={13} style={{ color: '#BBE2CA' }}>
            {t('Expliquer ce code', 'Explain this code', 'اشرح هذا الكود')}
          </Label>
        </Pressable>
      )}
    </View>
  );
}
export function TeacherMessage({
  content,
  onExplain,
  onRun,
  onPreview,
}: {
  content: string;
  onExplain?: (code: string) => void;
  onRun?: (seed: LabSeed) => void;
  onPreview?: (seed: WebSeed) => void;
}) {
  const { colors, rtl } = useSchool();
  const blocks = useMemo(() => teacherBlocks(content), [content]);
  return (
    <View style={{ gap: 12, minWidth: 0 }}>
      {blocks.map((block, i) =>
        block.kind === 'code' ? (
          <Code
            key={i}
            text={block.text}
            language={block.language}
            onExplain={onExplain}
            onRun={onRun}
            onPreview={onPreview}
          />
        ) : block.kind === 'math' ? <TeacherFormula key={i} source={block.text} /> : (
          <View key={i} style={{ gap: 6 }}>
            {block.text
              .split('\n')
              .filter((line) => line.trim())
              .map((line, j) => {
                const heading = /^#{1,4}\s/.test(line);
                const tip = /^>\s?/.test(line);
                const text = line
                  .replace(/^#{1,4}\s+/, '')
                  .replace(/^>\s?/, '')
                  .replace(/^[-*]\s+/, '• ');
                return (
                  <Label
                    key={j}
                    selectable
                    size={heading ? 17 : 15}
                    bold={heading}
                    style={{
                      marginTop: heading ? 10 : 0,
                      lineHeight: heading ? 29 : 27,
                      ...(tip
                        ? {
                            backgroundColor: colors.soft,
                            padding: 12,
                            borderRightWidth: rtl ? 2 : 0,
                            borderLeftWidth: rtl ? 0 : 2,
                            borderColor: colors.accent,
                          }
                        : {}),
                    }}
                    accessibilityRole={heading ? 'header' : undefined}
                  >
                    {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, k) => (
                      <Text
                        key={k}
                        style={
                          part.startsWith('**')
                            ? { fontWeight: '600' }
                            : part.startsWith('`')
                              ? { fontFamily: fonts.code, writingDirection: 'ltr' }
                              : undefined
                        }
                      >
                        {part.startsWith('**')
                          ? part.slice(2, -2)
                          : part.startsWith('`')
                            ? '\u2066' + part.slice(1, -1) + '\u2069'
                            : part.replace(
                                /(?:[\w.-]+\/)+[\w.[\]/:-]+|https?:\/\/\S+/g,
                                (value) => '\u2066' + value + '\u2069',
                              )}
                      </Text>
                    ))}
                  </Label>
                );
              })}
          </View>
        ),
      )}
    </View>
  );
}
