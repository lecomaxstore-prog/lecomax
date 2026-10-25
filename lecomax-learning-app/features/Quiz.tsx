import { Button, Card, Label } from '../components/UI';
import { useSchool } from '../store/School';
import { recordAnswer } from '../utils/progress';
import type { Question } from '../types/content';
export function Quiz({ question: q, lessonId }: { question: Question; lessonId: string }) {
  const { state, update, t } = useSchool();
  const answer = state.answers[lessonId + '::' + q.id];
  return (
    <Card>
      <Label bold size={19}>
        {q.question}
      </Label>
      {q.options.map((option, i) => (
        <Button
          key={i}
          quiet
          selected={answer?.choice === i}
          title={`${answer?.choice === i ? (answer.correct ? '✓ ' : '× ') : ''}${option}`}
          onPress={() => update((p) => recordAnswer(p, lessonId, q.id, i, i === q.correctIndex))}
        />
      ))}
      {answer && (
        <Label accessibilityLiveRegion="polite">
          {answer.correct
            ? t('Correct. ', 'Correct. ', 'إجابة صحيحة. ')
            : t('À revoir. ', 'Try again. ', 'حاول مجددًا. ')}
          {q.answerExplanations?.[answer.choice] || q.explanation}
        </Label>
      )}
    </Card>
  );
}
