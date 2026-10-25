import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { useSchool } from '../store/School';
import { createCard, dueCards, reviewCard, scheduleCard, type Rating } from '../utils/flashcards';
import { GentleReveal } from '../features/universe/Motion';

export default function MemoryStudio() {
  const { state, update, t, ready, saveStatus, retry } = useSchool();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = typeof params.source === 'string' ? params.source.slice(0, 500) : '';
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editing, setEditing] = useState('');
  const [revealed, setRevealed] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [difficultOnly, setDifficultOnly] = useState(false);
  const [sessionStart] = useState(Date.now);
  const [limit, setLimit] = useState(20);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const cards = state.flashcards.cards;
  const due = dueCards(state.flashcards, now);
  const current = due[0];
  const difficultIds = new Set(
    state.flashcards.events
      .filter((e) => e.rating === 'again' || e.rating === 'hard')
      .map((e) => e.cardId),
  );
  const reviewedToday = state.flashcards.events.filter((e) => e.at >= sessionStart).length;
  const nextAt = cards.filter((c) => c.dueAt > now).sort((a, b) => a.dueAt - b.dueAt)[0]?.dueAt;
  const matches = cards
    .filter((c) => !difficultOnly || difficultIds.has(c.id))
    .filter((c) =>
      `${c.question} ${c.answer}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    );
  const date = (at: number) =>
    new Intl.DateTimeFormat(state.language, { dateStyle: 'medium', timeStyle: 'short' }).format(at);
  const save = () => {
    const at = Date.now();
    const id = editing || `card-${at.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const card = createCard(id, question, answer, source, at);
    update((p) => {
      const prior = p.flashcards.cards.find((c) => c.id === id);
      // Editing meaning invalidates the old schedule, but preserves review history.
      return {
        ...p,
        flashcards: {
          ...p.flashcards,
          cards: prior
            ? p.flashcards.cards.map((c) =>
                c.id === id ? { ...card, source: prior.source, createdAt: prior.createdAt } : c,
              )
            : [...p.flashcards.cards, card],
        },
      };
    });
    setQuestion('');
    setAnswer('');
    setEditing('');
    setRevealed('');
    setNow(at);
    setNotice(
      t('Carte enregistrée.', 'Card added to your collection.', 'أُضيفت البطاقة إلى مجموعتك.'),
    );
  };
  const rate = (rating: Rating, at: number) => {
    if (!current || revealed !== current.id) return;
    update((p) => {
      const latest = p.flashcards.cards.find((c) => c.id === current.id);
      return !latest || latest.dueAt > at
        ? p
        : { ...p, flashcards: reviewCard(p.flashcards, current.id, rating, at) };
    });
    setRevealed('');
    setNow(at);
    setNotice(t('Révision enregistrée.', 'Review recorded.', 'تم تسجيل المراجعة.'));
  };
  return (
    <Page title={t('Studio mémoire', 'Memory Studio', 'استوديو الذاكرة')}>
      <Card>
        <Label bold size={24}>
          {t('Que vais-je oublier ?', 'What am I about to forget?', 'ما الذي قد أنساه؟')}
        </Label>
        <Label>
          {due.length} {t('cartes à revoir', 'cards due', 'بطاقات للمراجعة')} · {cards.length}{' '}
          {t('cartes', 'cards', 'بطاقات')}
        </Label>
        <Label muted>
          {t(
            'Rappelez-vous avant de révéler la réponse. Vos évaluations personnelles ne sont pas une preuve de maîtrise.',
            'Recall before revealing the answer. Self-ratings are not evidence of demonstrated mastery.',
            'حاول التذكر قبل إظهار الإجابة. التقييم الذاتي ليس دليلاً على الإتقان.',
          )}
        </Label>
        {saveStatus === 'error' ? (
          <Button
            title={t('Réessayer la sauvegarde', 'Retry saving', 'أعد محاولة الحفظ')}
            onPress={retry}
          />
        ) : (
          <Label muted>
            {saveStatus === 'saved'
              ? t('Enregistré sur cet appareil', 'Saved on this device', 'محفوظ على هذا الجهاز')
              : t('Sauvegarde en cours…', 'Saving…', 'جارٍ الحفظ…')}
          </Label>
        )}
        {!!notice && <Label accessibilityLiveRegion="polite">{notice}</Label>}
        <ProgressBar value={reviewedToday / Math.max(1, reviewedToday + due.length)} />
        <Label muted>
          {reviewedToday}{' '}
          {t('révisions dans cette session', 'reviews this session', 'مراجعات في هذه الجلسة')}
        </Label>
        {!!nextAt && (
          <Label muted>
            {t('Prochaine carte prévue', 'Next scheduled card', 'البطاقة التالية المقررة')}:{' '}
            {date(nextAt)}
          </Label>
        )}
      </Card>
      {current ? (
        <GentleReveal key={`${current.id}:${revealed}`}>
          <Card>
            <Label bold size={21}>
              {current.question}
            </Label>
            {revealed !== current.id ? (
              <Button
                title={t('Afficher la réponse', 'Reveal answer', 'إظهار الإجابة')}
                onPress={() => setRevealed(current.id)}
              />
            ) : (
              <>
                <Label selectable>{current.answer}</Label>
                <Row>
                  {(['again', 'hard', 'good', 'easy'] as Rating[]).map((rating, i) => (
                    <Button
                      key={rating}
                      quiet
                      disabled={!ready || state.flashcards.events.length >= 100000}
                      title={
                        [
                          t('Encore', 'Again', 'مرة أخرى'),
                          t('Difficile', 'Hard', 'صعب'),
                          t('Bien', 'Good', 'جيد'),
                          t('Facile', 'Easy', 'سهل'),
                        ][i] || rating
                      }
                      onPress={() => rate(rating, Date.now())}
                    />
                  ))}
                </Row>
                <Label muted size={12}>
                  {t('Échéances estimées', 'Estimated next reviews', 'مواعيد المراجعة المتوقعة')}:{' '}
                  {(['again', 'hard', 'good', 'easy'] as Rating[])
                    .map(
                      (rating, i) =>
                        `${[t('Encore', 'Again', 'مرة أخرى'), t('Difficile', 'Hard', 'صعب'), t('Bien', 'Good', 'جيد'), t('Facile', 'Easy', 'سهل')][i]}: ${date(scheduleCard(current, rating, Math.max(now, current.dueAt)).dueAt)}`,
                    )
                    .join(' · ')}
                </Label>
              </>
            )}
          </Card>
        </GentleReveal>
      ) : (
        <Card>
          <Label bold>
            {t(
              'Aucune carte à revoir maintenant',
              'No cards due right now',
              'لا توجد بطاقات مستحقة الآن',
            )}
          </Label>
          <Label>
            {t(
              'Ajoutez une carte ou revenez à sa prochaine échéance.',
              'Add a card or return at its next review date.',
              'أضف بطاقة أو عُد في موعد المراجعة القادم.',
            )}
          </Label>
        </Card>
      )}
      <Card>
        <Label bold>
          {editing
            ? t(
                'Modifier la carte · réinitialise son échéance',
                'Edit card · resets its schedule',
                'تعديل البطاقة · يعيد جدولة المراجعة',
              )
            : t('Une idée à retenir', 'One idea to remember', 'فكرة تستحق التذكر')}
        </Label>
        {!!source && !!state.notes[source] && (
          <Button
            quiet
            title={t('Utiliser ma note', 'Use my saved note', 'استخدم ملاحظتي المحفوظة')}
            onPress={() => setAnswer((state.notes[source] || '').slice(0, 6000))}
          />
        )}
        <Field
          placeholder={t(
            'Question ou phrase à compléter',
            'Question or fill-in-the-gap prompt',
            'سؤال أو عبارة لإكمالها',
          )}
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={2000}
        />
        <Field
          placeholder={t('Réponse', 'Answer', 'الإجابة')}
          value={answer}
          onChangeText={setAnswer}
          multiline
          maxLength={6000}
        />
        <Button
          disabled={
            !ready || !question.trim() || !answer.trim() || (!editing && cards.length >= 5000)
          }
          title={t('Enregistrer la carte', 'Save card', 'حفظ البطاقة')}
          onPress={save}
        />
        {!!editing && (
          <Button
            quiet
            title={t('Annuler', 'Cancel edit', 'إلغاء التعديل')}
            onPress={() => {
              setEditing('');
              setQuestion('');
              setAnswer('');
            }}
          />
        )}
        <Label muted>
          {t(
            'Contenu personnel. Vérifiez les réponses avant de les mémoriser.',
            'Personal content. Check answers before memorizing them.',
            'محتوى شخصي. تحقق من الإجابات قبل حفظها.',
          )}
        </Label>
      </Card>
      <Field
        placeholder={t('Rechercher mes cartes', 'Search my cards', 'ابحث في بطاقاتي')}
        value={search}
        onChangeText={(s) => {
          setSearch(s);
          setLimit(20);
        }}
      />
      <Button
        quiet
        selected={difficultOnly}
        title={
          difficultOnly
            ? t('Afficher toutes les cartes', 'Show all cards', 'اعرض كل البطاقات')
            : t('Collection difficile', 'Difficult collection', 'مجموعة البطاقات الصعبة')
        }
        onPress={() => {
          setDifficultOnly(!difficultOnly);
          setLimit(20);
        }}
      />
      {!matches.length && (
        <Label>
          {t(
            'Aucune carte dans cette sélection.',
            'No cards in this selection.',
            'لا توجد بطاقات في هذا الاختيار.',
          )}
        </Label>
      )}
      {matches.slice(0, limit).map((c) => (
        <Card key={c.id}>
          <Label bold>{c.question}</Label>
          <Label muted>
            {t('Prochaine révision', 'Next review', 'المراجعة القادمة')}: {date(c.dueAt)}
          </Label>
          <Button
            quiet
            title={t('Modifier', 'Edit', 'تعديل')}
            onPress={() => {
              setEditing(c.id);
              setQuestion(c.question);
              setAnswer(c.answer);
              setRevealed('');
            }}
          />
        </Card>
      ))}
      {matches.length > limit && (
        <Button
          quiet
          title={t('Afficher plus', 'Show more', 'عرض المزيد')}
          onPress={() => setLimit((n) => n + 20)}
        />
      )}
    </Page>
  );
}
