import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Field,
  Label,
  Page,
  ProgressBar,
  Row,
  EmptyState,
} from '../../components/UI';
import { useSchool } from '../../store/School';
import { getLesson, index, lessons } from '../../services/content';
import glossary from '../../data/glossary.json';
import { Quiz } from '../../features/Quiz';
import { CodeViewer } from '../../components/CodeViewer';
import { errorExercises } from '../../constants/errors';
import { streak } from '../../utils/progress';
import { openLearningItem } from '../../components/AcademyDashboard';
export default function Collection() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { state, t, colors } = useSchool();
  const [q, setQ] = useState('');
  const [card, setCard] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const translate = (v: readonly string[]) =>
    v[state.language === 'fr' ? 0 : state.language === 'en' ? 1 : 2] || '';
  const titles: Record<string, string> = {
    bookmarks: t('Favoris', 'Bookmarks', 'المحفوظات'),
    notes: t('Mes résumés', 'My summaries', 'ملخصاتي'),
    mistakes: t('Revoir mes erreurs', 'Review mistakes', 'راجع أخطاءك'),
    difficult: t('À revoir', 'Review later', 'للمراجعة'),
    flashcards: t('Cartes mémoire', 'Flashcards', 'بطاقات الذاكرة'),
    glossary: t('Dictionnaire du code', 'Glossary', 'قاموس البرمجة'),
    errors: t('Trouver le bug', 'Error trainer', 'تعلّم من الأخطاء'),
    statistics: t('Statistiques', 'Statistics', 'الإحصائيات'),
  };
  const ids =
    kind === 'bookmarks'
      ? state.bookmarks
      : kind === 'difficult'
        ? state.difficult
        : kind === 'notes'
          ? Object.keys(state.notes).filter((id) => state.notes[id]?.trim())
          : [];
  const mistakes = Object.values(state.answers)
    .filter((a) => !a.correct)
    .sort((a, b) => b.attempts - a.attempts);
  const entry = glossary[card % glossary.length]!;
  return (
    <Page title={titles[kind] || kind}>
      {['bookmarks', 'notes', 'difficult'].includes(kind) && (
        <>
          {!ids.length && !(kind === 'bookmarks' && state.codeBookmarks.length) && (
            <EmptyState
              icon="bookmark-outline"
              action={t('Explorer les cours', 'Explore courses', 'اكتشف الدورات')}
              onAction={() => router.push('/explore')}
              title={t('Ton espace de révision', 'Your review space', 'مساحتك للمراجعة')}
              description={t(
                'Rien ici pour le moment. Enregistre une leçon ou écris une note.',
                'Nothing here yet. Save a lesson or write a note.',
                'لا شيء هنا بعد. احفظ درسًا أو اكتب ملاحظة.',
              )}
            />
          )}
          {ids.map((id) => (
            <Card key={id}>
              <Label bold>{lessons.find((l) => l.id === id)?.title[state.language] || state.academy.plans.flatMap(p => p.lessons.map((l, i) => ({ id: p.id + ':' + i, title: l.title }))).find(l => l.id === id)?.title || id}</Label>
              {kind === 'notes' && <Label>{state.notes[id]}</Label>}
              <Button
                quiet
                title={t('Ouvrir', 'Open', 'افتح')}
                onPress={() => openLearningItem(id)}
              />
            </Card>
          ))}
          {kind === 'bookmarks' &&
            state.codeBookmarks.map((path) => (
              <Button
                key={path}
                quiet
                title={path}
                onPress={() =>
                  path.startsWith('collection:')
                    ? router.push({
                        pathname: '/collection/[kind]',
                        params: { kind: path.slice(11) },
                      })
                    : path.startsWith('lesson:')
                      ? router.push({ pathname: '/lesson/[id]', params: { id: path.slice(7) } })
                      : router.push({
                          pathname: '/file',
                          params: { path: path.replace(/^file:/, '') },
                        })
                }
              />
            ))}
        </>
      )}
      {kind === 'mistakes' && (
        <>
          {!mistakes.length && (
            <EmptyState
              icon="checkmark-circle-outline"
              action={t('Passer à la pratique', 'Try a practice challenge', 'جرّب تحدّيًا عمليًا')}
              onAction={() => router.push('/practice-lab')}
              title={t(
                'Aucune erreur à revoir.',
                'No mistakes to review.',
                'لا توجد أخطاء للمراجعة.',
              )}
            />
          )}
          {mistakes.map((a) => {
            const lesson = getLesson(a.lessonId, state.language);
            const question = lesson?.quiz.find((q) => q.id === a.questionId);
            const errorIndex = /^error-(\d+)$/.exec(a.lessonId);
            const errorExercise = errorIndex ? errorExercises[Number(errorIndex[1])] : undefined;
            if (errorExercise)
              return (
                <Quiz
                  key={a.lessonId}
                  lessonId={a.lessonId}
                  question={{
                    id: 'q',
                    question: translate(errorExercise.question),
                    options: errorExercise.options.map(translate),
                    correctIndex: errorExercise.correct,
                    explanation: translate(errorExercise.explanation),
                  }}
                />
              );
            return question ? (
              <Quiz key={a.lessonId + a.questionId} lessonId={a.lessonId} question={question} />
            ) : null;
          })}
        </>
      )}
      {kind === 'glossary' && (
        <>
          <Field
            value={q}
            onChangeText={setQ}
            placeholder={t('Rechercher un terme', 'Search a term', 'ابحث عن مصطلح')}
          />
          {glossary
            .filter((e) => JSON.stringify(e).toLowerCase().includes(q.toLowerCase()))
            .map(([term, definition]) => (
              <Card key={String(term)}>
                <Label bold size={22}>
                  {String(term)}
                </Label>
                <Label>{translate(definition as string[])}</Label>
              </Card>
            ))}
        </>
      )}
      {kind === 'flashcards' && (
        <View style={{ gap: 16 }}>
          <View style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label bold size={13}>
                {t(
                  `Carte ${(card % glossary.length) + 1} sur ${glossary.length}`,
                  `Card ${(card % glossary.length) + 1} of ${glossary.length}`,
                  `البطاقة ${(card % glossary.length) + 1} من ${glossary.length}`,
                )}
              </Label>
              <Label muted size={12}>
                {t('À ton rythme', 'At your pace', 'على مهلك')}
              </Label>
            </Row>
            <ProgressBar value={((card % glossary.length) + 1) / glossary.length} />
          </View>
          <Card style={{ padding: 24, minHeight: 230, gap: 18 }}>
            <Label muted size={12} style={{ textAlign: 'center' }}>
              {revealed
                ? t('LA DÉFINITION', 'THE DEFINITION', 'المعنى')
                : t('RAPPEL DE MÉMOIRE', 'QUICK RECALL', 'اختبر ذاكرتك')}
            </Label>
            <View style={{ flexGrow: 1, justifyContent: 'center', gap: 14, paddingVertical: 12 }}>
              <Label bold size={30} style={{ textAlign: 'center', writingDirection: 'ltr' }}>
                {String(entry[0])}
              </Label>
              <Label
                key={revealed ? 'answer' : 'hint'}
                accessibilityLiveRegion="polite"
                muted={!revealed}
                size={revealed ? 17 : 14}
                style={{ textAlign: 'center' }}
              >
                {revealed
                  ? translate(entry[1] as string[])
                  : t(
                      'Comment expliquerais-tu ce terme ?',
                      'How would you explain this term?',
                      'كيف تشرح هذا المصطلح بكلماتك؟',
                    )}
              </Label>
            </View>
            <Button
              quiet={revealed}
              icon={revealed ? 'eye-off-outline' : 'eye-outline'}
              title={
                revealed
                  ? t('Masquer la réponse', 'Hide answer', 'إخفاء الإجابة')
                  : t('Voir la réponse', 'Show answer', 'أظهر الإجابة')
              }
              onPress={() => setRevealed(!revealed)}
            />
          </Card>
          <Row style={{ flexWrap: 'nowrap', gap: 12 }}>
            <Button
              quiet
              style={{ flex: 1 }}
              icon="refresh-outline"
              title={t('Revoir', 'Review again', 'راجع مجددًا')}
              onPress={() => setRevealed(false)}
            />
            <Button
              style={{ flex: 1 }}
              title={t('Carte suivante', 'Next card', 'البطاقة التالية')}
              onPress={() => {
                setCard(card + 1);
                setRevealed(false);
              }}
            />
          </Row>
          <View style={{ gap: 6, borderRadius: 20, padding: 16, backgroundColor: colors.soft }}>
            <Button
              variant="ghost"
              icon="sparkles-outline"
              title={t(
                'Approfondir avec le prof IA',
                'Explore with AI teacher',
                'افهم أكثر مع المعلّم الذكي',
              )}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/teacher',
                  params: {
                    question: t(
                      `Explique-moi davantage cette carte mémoire : « ${String(entry[0])} ». Définition : ${translate(entry[1] as string[])}. Explique simplement, étape par étape, avec un exemple concret, puis pose-moi une question pour vérifier ma compréhension.`,
                      `Teach me more about this flashcard: “${String(entry[0])}”. Definition: ${translate(entry[1] as string[])}. Explain simply, step by step, with a concrete example, then ask me one question to check my understanding.`,
                      `اشرح لي المزيد عن بطاقة الذاكرة «${String(entry[0])}». التعريف: ${translate(entry[1] as string[])}. اشرح ببساطة خطوة بخطوة مع مثال عملي، ثم اسألني سؤالًا واحدًا للتأكد من فهمي.`,
                    ),
                    explain: String(Date.now()),
                  },
                })
              }
            />
            <Label muted size={12} style={{ textAlign: 'center' }}>
              {t(
                'Une explication simple et un exemple de cette carte.',
                'A simple explanation and example of this card.',
                'شرح مبسّط ومثال عملي عن هذه البطاقة.',
              )}
            </Label>
          </View>
        </View>
      )}
      {kind === 'errors' &&
        errorExercises.map((e, i) => (
          <Card key={e.file}>
            <Label muted>
              {t(
                'Exemple volontairement incorrect',
                'Intentionally broken teaching example',
                'مثال تعليمي خاطئ عمدًا',
              )}
            </Label>
            <CodeViewer code={e.code} filename={e.file} />
            <Quiz
              lessonId={`error-${i}`}
              question={{
                id: 'q',
                question: translate(e.question),
                options: e.options.map(translate),
                correctIndex: e.correct,
                explanation: translate(e.explanation),
              }}
            />
            {state.answers[`error-${i}::q`]?.correct && (
              <CodeViewer code={e.solution} filename="Correction" />
            )}
          </Card>
        ))}
      {kind === 'statistics' && (
        <>
          <Card>
            <Label size={28} bold>
              {state.completed.length} / {lessons.length} {t('leçons', 'lessons', 'درسًا')}
            </Label>
            <ProgressBar value={state.completed.length / lessons.length} />
            <Label>
              {streak(state.days)} {t('jours de suite', 'day streak', 'أيام متتالية')}
            </Label>
            <Label>
              {Math.floor(Object.values(state.days).reduce((a, b) => a + b, 0) / 60)} min
            </Label>
            <Label>
              {Object.values(state.answers).filter((a) => a.correct).length} /{' '}
              {Object.keys(state.answers).length}{' '}
              {t('réponses correctes', 'correct answers', 'إجابة صحيحة')}
            </Label>
          </Card>
          {index.map((m) => (
            <Card key={m.id}>
              <Label>{m.title[state.language]}</Label>
              <ProgressBar
                value={
                  m.lessons.filter((l) => state.completed.includes(l.id)).length / m.lessons.length
                }
              />
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
