import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { space, radius } from '../constants/design';
import { Card, Label, Row } from './UI';
import { CodeViewer } from './CodeViewer';
import { useSchool } from '../store/School';
import type { Lesson } from '../types/website-course';

// Keep the website's section and block order, including code beside its explanation.
export function WebsiteLesson({ lesson }: { lesson: Lesson }) {
  const { t, colors } = useSchool();
  return (
    <>
      <Card style={{ padding: 20, gap: 18, borderRadius: 20 }}>
        <Row style={{ flexWrap: 'nowrap', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles-outline" size={21} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Label bold size={18} accessibilityRole="header">{t('Objectifs', 'Learning objectives', 'أهداف الدرس')}</Label>
            <Label muted size={12}>{t('Ce que vous saurez faire', 'What you’ll be able to do', 'ما ستتمكن من إنجازه')}</Label>
          </View>
        </Row>
        {lesson.objectives.map((text, i) => (
          <Row key={i} style={{ flexWrap: 'nowrap', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 26, height: 26, marginTop: 3, borderRadius: 13, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Label bold size={12} style={{ color: colors.accent }}>{String(i + 1).padStart(2, '0')}</Label>
            </View>
            <Label selectable size={15} style={{ flex: 1 }}>{text}</Label>
          </Row>
        ))}
        {lesson.prerequisites.length > 0 && (
          <View style={{ backgroundColor: colors.neutral, padding: 16, borderRadius: 14, gap: 8 }}>
            <Row>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Label bold size={14}>{t('Prérequis', 'Before you start', 'قبل أن تبدأ')}</Label>
            </Row>
            {lesson.prerequisites.map((text, i) => (
              <Label key={i} selectable muted size={14}>{text}</Label>
            ))}
          </View>
        )}
      </Card>
      {lesson.sections.map((section) => (
        <Card key={section.id} style={{ gap: space.lg, borderRadius: 20 }}>
          <Label bold size={20} accessibilityRole="header">
            {section.title}
          </Label>
          {section.blocks.map((block) => {
            switch (block.type) {
              case 'code':
                return (
                  <React.Fragment key={block.id}>
                    <Label bold>{block.title}</Label>
                    <CodeViewer
                      code={block.code.source}
                      filename={block.code.filename}
                      annotations={block.code.annotations}
                    />
                  </React.Fragment>
                );
              case 'paragraph':
                return (
                  <Label key={block.id} selectable>
                    {block.text}
                  </Label>
                );
              case 'callout':
                return (
                  <View
                    key={block.id}
                    style={{
                      padding: space.lg,
                      borderRadius: radius.control,
                      backgroundColor: colors.soft,
                      gap: space.sm,
                    }}
                  >
                    <Label bold>{block.title}</Label>
                    <Label selectable>{block.text}</Label>
                  </View>
                );
              case 'list':
                return (
                  <React.Fragment key={block.id}>
                    {!!block.title && <Label bold>{block.title}</Label>}
                    {block.items.map((text, i) => (
                      <Label key={i} selectable>
                        {block.ordered ? `${i + 1}.` : '•'} {text}
                      </Label>
                    ))}
                  </React.Fragment>
                );
              case 'vocabulary':
                return (
                  <React.Fragment key={block.id}>
                    {block.items.map((item, i) => (
                      <React.Fragment key={i}>
                        <Label bold>{item.term}</Label>
                        <Label selectable>{item.definition}</Label>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                );
            }
          })}
        </Card>
      ))}
      {lesson.commands.length > 0 && (
        <CodeViewer filename="Terminal" code={lesson.commands.join('\n')} />
      )}
      <Card>
        <Label bold>{t('Résultat attendu', 'Expected result', 'النتيجة المتوقعة')}</Label>
        <Label selectable>{lesson.expectedResult}</Label>
      </Card>
      {lesson.commonErrors.length > 0 && (
        <Card>
          <Label bold>{t('Erreurs fréquentes', 'Common errors', 'أخطاء شائعة')}</Label>
          {lesson.commonErrors.map((error, i) => (
            <React.Fragment key={i}>
              <Label bold>{error.symptom}</Label>
              <Label selectable>{error.cause}</Label>
              <Label selectable>{error.fix}</Label>
            </React.Fragment>
          ))}
        </Card>
      )}
    </>
  );
}
