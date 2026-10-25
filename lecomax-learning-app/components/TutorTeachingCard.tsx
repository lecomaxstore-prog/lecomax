import React, { useState } from 'react';
import { router } from 'expo-router';
import { Button, Card, Label } from './UI';
import { TeacherMessage } from './TeacherMessage';
import { useSchool } from '../store/School';
import type { TutorSession } from '../utils/tutor-memory';
import { createCard } from '../utils/flashcards';

export function TutorTeachingCard({ session, busy }: { session: TutorSession; busy: boolean }) {
  const { state, update, t } = useSchool();
  const [localHints, setLocalHints] = useState(0);
  const [showVerification, setShowVerification] = useState(false);
  const turn = session.reply?.teaching;
  if (!turn) return null;
  const labels = {
    explanation: t('Explication', 'Explanation', 'شرح'),
    question: t('À vous', 'Your turn', 'دورك'),
    hint: t('Indice', 'Hint', 'تلميح'),
    example: t('Exemple', 'Example', 'مثال'),
    'code-challenge': t('Défi code', 'Code challenge', 'تحدي برمجي'),
    quiz: t('Vérifier', 'Check understanding', 'تحقق من الفهم'),
    reflection: t('Réflexion', 'Learning reflection', 'تأمل التعلم'),
    'memory-card': t('Carte mémoire', 'Retrieval card', 'بطاقة استدعاء'),
    progress: t('Preuves observées', 'Observed evidence', 'الأدلة المسجلة'),
    recommendation: t('Prochaine étape', 'Next activity', 'النشاط التالي'),
  };
  const shown = session.coach ? session.coach.hintsUsed || 0 : localHints;
  const source = `tutor:${session.id}`;
  const exists =
    !!turn.memory &&
    state.flashcards.cards.some((c) => c.source === source && c.question === turn.memory!.question);
  return (
    <Card>
      <Label bold size={21}>
        {labels[turn.kind]}
      </Label>
      <Label bold>{turn.objective}</Label>
      <Label muted>{turn.concept}</Label>
      {!!turn.prerequisites.length && (
        <Label>
          {t('Bases utiles', 'Relevant prerequisites', 'المتطلبات المفيدة')}:{' '}
          {turn.prerequisites.join(' · ')}
        </Label>
      )}
      {!!turn.missingPrerequisite && (
        <Label>
          {t('Base à vérifier', 'Prerequisite to check', 'متطلب للتحقق')}:{' '}
          {turn.missingPrerequisite}
        </Label>
      )}
      <TeacherMessage content={turn.body} />
      {!!turn.question && <Label bold>{turn.question}</Label>}
      {turn.hints.slice(0, shown).map((hint, i) => (
        <Label key={i}>{hint}</Label>
      ))}
      {shown < turn.hints.length && (
        <Button
          quiet
          disabled={busy}
          title={t('Indice suivant', 'Next teaching hint', 'التلميح التعليمي التالي')}
          onPress={() => {
            if (!session.coach) setLocalHints((n) => n + 1);
            else
              update((p) => ({
                ...p,
                tutor: {
                  ...p.tutor,
                  sessions: p.tutor.sessions.map((s) =>
                    s.id === session.id && s.coach
                      ? {
                          ...s,
                          coach: {
                            ...s.coach,
                            hintsUsed: Math.min(3, (s.coach.hintsUsed || 0) + 1),
                          },
                        }
                      : s,
                  ),
                },
              }));
          }}
        />
      )}
      {turn.kind === 'code-challenge' && (
        <Button
          quiet
          title={t(
            'Ouvrir le studio pour exécuter le code',
            'Open the studio to run code',
            'افتح الاستوديو لتشغيل الكود',
          )}
          onPress={() => router.push('/interactive-studio')}
        />
      )}
      <Button
        quiet
        title={t('Comment vérifier cette réponse', 'How to check this answer', 'كيف تتحقق من هذه الإجابة')}
        onPress={() => setShowVerification((value) => !value)}
      />
      {showVerification && (
        <>
          <Label>
            {t(
              'Copiez le code dans le studio, prédisez le résultat, puis exécutez-le vous-même. Revenez ici avec le code, le résultat et votre raisonnement. Ouvrir un outil ne valide pas la réponse et ne modifie pas votre progression.',
              'Copy the code into the studio, predict the result, then run it yourself. Return here with the code, output and your reasoning. Opening a tool does not verify the answer or change your progress.',
              'انسخ الكود إلى الاستوديو، وتوقع النتيجة، ثم شغّله بنفسك. عد هنا بالكود والنتيجة وتفسيرك. فتح الأداة لا يتحقق من الإجابة ولا يغيّر تقدمك.',
            )}
          </Label>
          {(['javascript', 'python', 'math'] as const).map((tool) => (
            <Button
              key={tool}
              quiet
              title={tool === 'math' ? t('Outils mathématiques', 'Math tools', 'أدوات الرياضيات') : tool === 'python' ? 'Python' : 'JavaScript'}
              onPress={() => router.push({ pathname: '/interactive-studio', params: { tool } })}
            />
          ))}
          <Label muted>
            {t(
              'Les outils mathématiques couvrent uniquement les opérations proposées. Pour une affirmation factuelle, consultez une source fiable et vérifiez sa date. Une réponse IA ou un résultat copié reste à examiner ; le tuteur ne reçoit pas automatiquement les résultats des outils.',
              'Math tools cover only their supported operations. For factual claims, check a reliable source and its date. AI feedback and pasted results still need review; tool results are not automatically sent to the tutor.',
              'تغطي أدوات الرياضيات العمليات المتاحة فيها فقط. تحقق من الادعاءات الواقعية في مصدر موثوق ومن تاريخه. تحتاج ملاحظات الذكاء الاصطناعي والنتائج المنسوخة إلى مراجعة؛ لا تُرسل نتائج الأدوات تلقائيًا إلى المعلم.',
            )}
          </Label>
        </>
      )}
      {turn.memory && (
        <Button
          quiet
          disabled={busy || exists || state.flashcards.cards.length >= 5000}
          title={
            exists
              ? t('Carte enregistrée', 'Retrieval card saved', 'حُفظت البطاقة')
              : t('Enregistrer la carte', 'Save retrieval card', 'احفظ بطاقة الاستدعاء')
          }
          onPress={() =>
            update((p) => {
              if (
                p.flashcards.cards.length >= 5000 ||
                p.flashcards.cards.some(
                  (c) => c.source === source && c.question === turn.memory!.question,
                )
              )
                return p;
              const card = createCard(
                `teaching-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                turn.memory!.question,
                turn.memory!.answer,
                source,
              );
              return {
                ...p,
                flashcards: { ...p.flashcards, cards: [...p.flashcards.cards, card] },
              };
            })
          }
        />
      )}
      <Label>{turn.nextActivity}</Label>
      <Label muted>{turn.limitations}</Label>
    </Card>
  );
}
