import { useState } from 'react';
import { Linking } from 'react-native';
import { Button, Card, Label, Row } from '../../components/UI';
import { lifeLessons } from './life-lessons';
export function LifeAcademy({ date = new Date().toISOString().slice(0, 10) }: { date?: string }) {
  const daily =
    lifeLessons[Math.floor(Date.parse(date + 'T12:00:00Z') / 86400000) % lifeLessons.length]!;
  const [selected, setSelected] = useState<string>('sleep'),
    [answer, setAnswer] = useState<number | null>(null),
    [error, setError] = useState('');
  const lesson = lifeLessons.find((l) => l.id === selected)!;
  return (
    <>
      <Card>
        <Label bold>Did you know? · {date}</Label>
        <Label>{daily.title}</Label>
        <Label>{daily.body}</Label>
        <Button
          quiet
          title="Explore today's knowledge"
          onPress={() => {
            setSelected(daily.id);
            setAnswer(null);
            setError('');
          }}
        />
      </Card>
      <Card>
        <Label bold size={24}>
          Healthy Life Academy
        </Label>
        <Label>
          Short educational lessons, with sources and an optional knowledge check. General wellness
          education, not diagnosis or treatment. These new lessons are currently authored in
          English.
        </Label>
        <Row>
          {lifeLessons.map((l) => (
            <Button
              key={l.id}
              quiet
              selected={l.id === selected}
              title={l.category + ' · ' + l.title}
              onPress={() => {
                setSelected(l.id);
                setAnswer(null);
                setError('');
              }}
            />
          ))}
        </Row>
      </Card>
      <Card>
        <Label muted>{lesson.category}</Label>
        <Label bold size={24}>
          {lesson.title}
        </Label>
        <Label>{lesson.body}</Label>
        <Label bold>Try or reflect</Label>
        <Label>{lesson.practice}</Label>
        <Label bold>Check your understanding</Label>
        <Label>{lesson.question}</Label>
        {lesson.options.map((option, i) => (
          <Button
            key={option}
            quiet
            selected={answer === i}
            title={option}
            onPress={() => setAnswer(i)}
          />
        ))}
        {answer !== null && (
          <Label accessibilityLiveRegion="polite">
            {answer === lesson.correct ? 'Yes. ' : 'Try another perspective. '}
            {lesson.explanation}
          </Label>
        )}
        <Button
          quiet
          title={`Read source: ${lesson.source}`}
          onPress={() =>
            void Linking.openURL(lesson.url).catch(() =>
              setError('Unable to open source. Check your connection.'),
            )
          }
        />
        {!!error && <Label accessibilityRole="alert">{error}</Label>}
        <Label muted>
          Sources require Internet. The lesson is bundled for offline reading within an accessible
          app session. A quiz answer here is practice, not a medical qualification or proof of
          mastery.
        </Label>
      </Card>
    </>
  );
}
