import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../components/UI';
import { IconTile, ToolCard } from '../components/AcademySignature';
import { useSchool } from '../store/School';
import { CodeLab } from '../features/interactive/CodeLab';
import { PythonLab } from '../features/interactive/PythonLab';
import { Flashcards, MathLab, QuizLab, Whiteboard } from '../features/interactive/StudyLabs';
import { Projects } from '../features/interactive/Projects';
import { studioTools, type ToolId } from '../features/interactive/model';
import { toolPresentation } from '../features/interactive/presentation';
export default function InteractiveStudio() {
  const { state, update, ready, error, retry, t, rtl, colors } = useSchool();
  const [notesOpen, setNotesOpen] = useState(false);
  const params = useLocalSearchParams<{ tool?: string }>();
  const [active, setActive] = useState<ToolId | null>(
    studioTools.some((tool) => tool[0] === params.tool) ? (params.tool as ToolId) : null,
  );
  const tool = active ? toolPresentation[active] : null;
  return (
    <Page
      key={active || 'hub'}
      wide
      title={t('Studio interactif', 'Interactive Learning Studio', 'استوديو التعلم التفاعلي')}
      subtitle={t(
        'Un espace pour transformer vos idées en savoir-faire.',
        'A space to turn your ideas into understanding.',
        'مساحة لتحويل أفكارك إلى معرفة ومهارة.',
      )}
    >
      {!active && (
        <Card>
          <Label bold>
            {t(
              'Votre espace d’apprentissage connecté',
              'Your connected learning workspace',
              'مساحة تعلّمك المتصلة',
            )}
          </Label>
          <Row>
            <Button
              quiet
              title={t('Mon professeur IA', 'My AI tutor', 'معلمي الذكي')}
              onPress={() => router.push('/tutor')}
            />
            <Button
              quiet
              title={t('Mes révisions', 'My memory reviews', 'مراجعاتي')}
              onPress={() => router.push('/memory-studio')}
            />
            <Button
              quiet
              title={t('Mes jeux', 'My learning games', 'ألعابي التعليمية')}
              onPress={() => router.push('/games')}
            />
          </Row>
        </Card>
      )}
      {!active && (
        <Card>
          <Button
            quiet
            expanded={notesOpen}
            icon="document-text-outline"
            title={t('Mon carnet de studio', 'My studio notebook', 'دفتر الاستوديو')}
            onPress={() => setNotesOpen(!notesOpen)}
          />
          {notesOpen && (
            <>
              <Field
                multiline
                maxLength={6000}
                placeholder={t(
                  'Hypothèse, observation, prochaine expérience…',
                  'Prediction, observation, next experiment…',
                  'توقعي، ملاحظتي، تجربتي القادمة…',
                )}
                value={state.drafts['universe:studio-notes'] || ''}
                onChangeText={(value) =>
                  update((p) => ({ ...p, drafts: { ...p.drafts, 'universe:studio-notes': value } }))
                }
              />
              <Label muted>
                {t(
                  'Notes sauvegardées avec votre progression.',
                  'Notes save with your learning progress.',
                  'تُحفظ الملاحظات مع تقدمك التعليمي.',
                )}
              </Label>
            </>
          )}
        </Card>
      )}
      {!!error && (
        <Card>
          <Label accessibilityRole="alert">{error}</Label>
          <Button title={t('Réessayer', 'Retry', 'أعد المحاولة')} onPress={retry} />
        </Card>
      )}
      {!ready ? null : active && tool ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Button
              quiet
              icon={rtl ? 'arrow-forward' : 'arrow-back'}
              title={t('Tous les outils', 'All studio tools', 'كل الأدوات')}
              onPress={() => setActive(null)}
            />
            <Label muted size={12}>
              {state.lastLesson || t('Pratique libre', 'Independent practice', 'تدريب حر')}
            </Label>
          </Row>
          <Row
            style={{
              flexWrap: 'nowrap',
              paddingBottom: 18,
              borderBottomWidth: 1,
              borderColor: colors.line,
            }}
          >
            <IconTile icon={tool.icon} large />
            <View style={{ flex: 1 }}>
              <Label bold size={25}>
                {t(...tool.title)}
              </Label>
              <Label muted size={13}>
                {t(...tool.description)}
              </Label>
            </View>
          </Row>
          <View key={active} style={{ gap: 16 }}>
            {active === 'python' ? (
              <PythonLab />
            ) : ['javascript', 'typescript', 'web', 'sql', 'react'].includes(active) ? (
              <CodeLab language={active} />
            ) : active === 'math' || active === 'science' ? (
              <MathLab science={active === 'science'} />
            ) : active === 'quiz' || active === 'language' ? (
              <QuizLab language={active === 'language'} />
            ) : active === 'cards' ? (
              <Flashcards />
            ) : active === 'board' ? (
              <Whiteboard />
            ) : (
              <Projects />
            )}
          </View>
        </>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Label bold size={26}>
              {t('Apprendre en pratiquant', 'Learn by doing', 'تعلّم بالممارسة')}
            </Label>
            <Label muted>
              {t(
                'Choisissez un outil. Essayez, observez, recommencez.',
                'Choose a tool. Try, observe, try again.',
                'اختر أداة. جرّب، لاحظ، وحاول من جديد.',
              )}
            </Label>
          </View>
          <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 16 }}>
            {studioTools.map(([id]) => {
              const item = toolPresentation[id];
              const title = t(...item.title);
              return (
                <ToolCard
                  key={id}
                  icon={item.icon}
                  title={t('Ouvrir ', 'Open ', 'افتح ') + title}
                  description={t(...item.description)}
                  style={{ flexBasis: 260, flexGrow: 1 }}
                  onPress={() => setActive(id)}
                />
              );
            })}
          </View>
          <Label muted size={12}>
            {t(
              'Votre travail est enregistré sur cet appareil et inclus dans vos exports de progression.',
              'Your work is saved on this device and included in progress exports.',
              'يُحفظ عملك على هذا الجهاز ويُضمّن في تصدير تقدّمك.',
            )}
          </Label>
        </>
      )}
    </Page>
  );
}
