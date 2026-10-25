import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { journeys, selectedJourney } from './model';
export function JourneyPicker() {
  const { state, update, t } = useSchool();
  const [expanded, setExpanded] = useState(false);
  const selected = selectedJourney(state);
  const current = journeys.find((j) => j[0] === selected)!;
  return (
    <Card>
      <Label bold>
        {t('Votre rythme, votre chemin', 'Your rhythm. Your route.', 'تعلّم بالوتيرة التي تناسبك')}
      </Label>
      <Label>
        {t(current[1][0], current[1][1], current[1][2])} ·{' '}
        {t(current[2][0], current[2][1], current[2][2])}
      </Label>
      <Button
        quiet
        expanded={expanded}
        title={t('Changer de parcours', 'Change learning journey', 'غيّر مسار التعلّم')}
        onPress={() => setExpanded(!expanded)}
      />
      {expanded &&
        journeys.map(([id, title, description]) => (
          <Button
            key={id}
            quiet
            selected={selected === id}
            title={`${t(title[0], title[1], title[2])} · ${t(description[0], description[1], description[2])}`}
            onPress={() => {
              update((p) => ({ ...p, drafts: { ...p.drafts, 'universe:journey': id } }));
              setExpanded(false);
            }}
          />
        ))}
    </Card>
  );
}
export function LessonJourney({
  id,
  title,
  stage,
  onStage,
}: {
  id: string;
  title: string;
  stage: number;
  onStage: (n: number) => void;
}) {
  const { state, update, t } = useSchool();
  const mode = selectedJourney(state);
  const current = journeys.find((j) => j[0] === mode)!;
  const stages = [
    t('Comprendre', 'Understand', 'افهم'),
    t('Exemple', 'Example', 'مثال'),
    t('Pratiquer', 'Practice', 'تدرّب'),
    t('Vérifier', 'Checkpoint', 'تحقق'),
  ];
  const noteKey = `universe:reflection:${id}:${mode}`;
  return (
    <Card>
      <Label bold size={17}>
        {t(current[1][0], current[1][1], current[1][2])}
      </Label>
      <Label muted>{t(current[2][0], current[2][1], current[2][2])}</Label>
      <Row>
        {current[3].map((step, i) => (
          <Button
            key={step}
            quiet
            selected={stage === step}
            title={`${i + 1} · ${stages[step]}`}
            onPress={() => onStage(step)}
          />
        ))}
      </Row>
      {mode === 'micro' && (
        <Label>
          {t(
            'Aujourd’hui : un concept et la première question du quiz. Les autres étapes restent disponibles ; une courte session ne termine pas automatiquement la leçon.',
            'Today: one concept and the first quiz question. Other steps stay available; a short session does not automatically complete the lesson.',
            'اليوم: مفهوم واحد وأول سؤال. تبقى الخطوات الأخرى متاحة؛ الجلسة القصيرة لا تكمل الدرس تلقائيًا.',
          )}
        </Label>
      )}
      {mode === 'exam' && (
        <Label>
          {t(
            'Commencez par le quiz sans consulter les exemples. Revenez ensuite aux explications des réponses incorrectes.',
            'Start with the quiz before looking at examples. Then revisit explanations for incorrect answers.',
            'ابدأ بالاختبار قبل الأمثلة. ثم ارجع إلى شرح الإجابات الخاطئة.',
          )}
        </Label>
      )}
      {['deep', 'career', 'project', 'curiosity'].includes(mode) && (
        <>
          <Field
            multiline
            maxLength={2000}
            value={state.drafts[noteKey] || ''}
            onChangeText={(value) =>
              update((p) => ({ ...p, drafts: { ...p.drafts, [noteKey]: value } }))
            }
            placeholder={
              mode === 'deep'
                ? t(
                    'Expliquez le mécanisme et un contre-exemple.',
                    'Explain the mechanism and a counterexample.',
                    'اشرح الآلية ومثالاً مضاداً.',
                  )
                : mode === 'curiosity'
                  ? t(
                      'Quelle nouvelle question ce concept vous inspire-t-il ?',
                      'What new question does this concept raise?',
                      'ما السؤال الجديد الذي يثيره هذا المفهوم؟',
                    )
                  : t(
                      'Mon livrable, son résultat attendu et comment le vérifier.',
                      'My deliverable, expected result and verification plan.',
                      'عملي المطلوب والنتيجة المتوقعة وطريقة التحقق.',
                    )
            }
          />
          {['career', 'project'].includes(mode) && (
            <Button
              quiet
              title={t('Construire dans le studio', 'Build in the studio', 'ابنِ في الاستوديو')}
              onPress={() =>
                router.push({ pathname: '/interactive-studio', params: { tool: 'projects' } })
              }
            />
          )}
          {mode === 'curiosity' && (
            <Button
              quiet
              title={t(
                'Explorer ma question avec le tuteur',
                'Explore my question with the tutor',
                'استكشف سؤالي مع المعلم',
              )}
              onPress={() =>
                router.push({
                  pathname: '/tutor',
                  params: { goal: `${title}: ${state.drafts[noteKey] || ''}`.slice(0, 300) },
                })
              }
            />
          )}
        </>
      )}
      <Label muted size={12}>
        {t(
          'Vos étapes et vos notes sont sauvegardées sur cet appareil.',
          'Your lesson stage and notes save on this device.',
          'تُحفظ مرحلة الدرس وملاحظاتك على هذا الجهاز.',
        )}
      </Label>
    </Card>
  );
}
