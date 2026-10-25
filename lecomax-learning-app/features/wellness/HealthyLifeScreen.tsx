import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { Button, Card, Label, Page, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { useJourney } from './useJourney';
import { dateKey, ensureDay, initialJourney, shiftDate } from './engine';
import { newLife, readLife, type LifeState } from './life-model';
import { DayTimeline, HabitsView, PlannerView, InsightsView } from './LifeEditors';
import { LifeFocus } from './LifeFocus';
import { LifeAcademy } from './LifeAcademy';
import { LifePrograms } from './LifePrograms';
import { LifeOverview } from './LifeOverview';
import { syncNotifications } from './notifications';
export default function HealthyLifeScreen() {
  const calendar = useRef<ScrollView>(null);
  const j = useJourney(),
    { t, colors, state: school } = useSchool();
  const [section, setSection] = useState('day'),
    [selectedDate, setDate] = useState<string | null>(null),
    [week, setWeek] = useState(0),
    [message, setMessage] = useState(''),
    [deleting, setDeleting] = useState(false),
    [busy, setBusy] = useState(false);
  const date = selectedDate || j.today;
  const commit = async (fn: (s: LifeState) => LifeState) => {
    setMessage('');
    setBusy(true);
    try {
      await j.update((s) => ({ ...s, life: readLife(fn(s.life || newLife())) }));
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'TIME_CONFLICT') {
        setMessage(
          'That time overlaps another activity or your protected busy interval. Choose another time, or mark the other activity as rest.',
        );
        return false;
      }
      setMessage(
        t(
          'Enregistrement impossible. Vérifiez les champs et réessayez. Les données précédentes sont conservées.',
          'Could not save. Check the fields and retry. Previously saved data is preserved.',
          'تعذر الحفظ. تحقق من الحقول وأعد المحاولة. البيانات السابقة محفوظة.',
        ),
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const tabs = [
    ['day', t('Ma journée', 'My Day', 'يومي')],
    ['habits', t('Habitudes', 'Habits', 'العادات')],
    ['planner', t('Planifier', 'Planner', 'التخطيط')],
    ['focus', t('Concentration', 'Focus', 'التركيز')],
    ['learn', t('Apprendre', 'Learn', 'تعلّم')],
    ['programs', t('Bouger et apprendre', 'Move & learn', 'الحركة والتعلّم')],
    ['insights', t('Bilan', 'Insights', 'ملخص')],
    ['privacy', t('Confidentialité', 'Privacy', 'الخصوصية')],
  ];
  const life = j.state?.life || newLife();
  const props = { life, date, commit };
  return (
    <Page
      title={t('Vie saine', 'Healthy Life', 'حياة صحية')}
      subtitle={t(
        'Votre rythme. Vos choix. De petits pas durables.',
        'Your rhythm. Your choices. Small, sustainable steps.',
        'وتيرتك. اختياراتك. خطوات صغيرة مستدامة.',
      )}
    >
      <Card style={{ backgroundColor: colors.soft, gap: 18 }}>
        <Row>
          <Button
            quiet
            icon="notifications-outline"
            title={t('Rappels', 'Reminders', 'التذكيرات')}
            onPress={() => router.push('/wellness/notifications')}
          />
          <Button
            quiet
            title={t(
              'Mes routines guidées existantes',
              'My existing guided routines',
              'روتيني الموجّه السابق',
            )}
            onPress={() => router.push('/wellness/guided' as Href)}
          />
        </Row>
      </Card>
      {school.language !== 'en' && (
        <Label muted>
          {t(
            'Ce nouvel espace est actuellement en anglais. Les routines guidées restent disponibles dans votre langue.',
            'This new workspace is currently in English. Guided routines remain available in your language.',
            'هذه المساحة الجديدة متاحة حالياً بالإنجليزية. تظل الروتينات الموجّهة متاحة بلغتك.',
          )}
        </Label>
      )}
      <Row>
        {tabs.map(([id, title]) => (
          <Button
            key={id}
            quiet
            selected={section === id}
            title={title!}
            onPress={() => {
              setSection(id!);
              setMessage('');
            }}
          />
        ))}
      </Row>
      {!!(message || j.error) && (
        <Card>
          <Label accessibilityRole="alert">
            {message || 'Your wellness data could not be loaded or saved.'}
          </Label>
          <Button title="Retry storage" onPress={j.retry} />
        </Card>
      )}
      {busy && <Label accessibilityLiveRegion="polite">Saving…</Label>}
      {!j.state ? (
        <ActivityIndicator accessibilityLabel="Loading saved wellness data" />
      ) : (
        <>
          {['day', 'habits', 'insights'].includes(section) && (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <Button
                  quiet
                  title="Earlier week"
                  onPress={() => {
                    setWeek(week - 1);
                    setDate(shiftDate(date, -7));
                  }}
                />
                <Label bold>{date}</Label>
                <Button
                  quiet
                  title="Later week"
                  disabled={week >= 0}
                  onPress={() => {
                    setWeek(Math.min(0, week + 1));
                    setDate(shiftDate(date, 7));
                  }}
                />
              </Row>
              <ScrollView
                ref={calendar}
                onContentSizeChange={() => calendar.current?.scrollToEnd({ animated: false })}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
                accessibilityLabel="Choose a calendar day"
              >
                {Array.from({ length: 7 }, (_, i) => shiftDate(j.today, week * 7 + i - 6)).map(
                  (d) => (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityLabel={
                        d + '; ' + Object.keys(life.checks[d] || {}).length + ' habit check-ins'
                      }
                      accessibilityState={{ selected: d === date }}
                      onPress={() => setDate(d)}
                      style={{
                        width: 56,
                        minHeight: 76,
                        padding: 6,
                        gap: 2,
                        alignItems: 'center',
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: d === date ? colors.primary : colors.line,
                        backgroundColor: d === date ? colors.soft : colors.card,
                      }}
                    >
                      <Label size={12}>
                        {new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })}
                      </Label>
                      <Label bold size={20}>
                        {d.slice(8)}
                      </Label>
                      <Label muted size={11}>
                        {Object.keys(life.checks[d] || {}).length} logs
                      </Label>
                    </Pressable>
                  ),
                )}
              </ScrollView>
              <Button
                quiet
                title="Back to today"
                onPress={() => {
                  setWeek(0);
                  setDate(null);
                }}
              />
            </Card>
          )}
          {section === 'day' && (
            <>
              <LifeOverview life={life} date={date} />
              <DayTimeline
                {...props}
                onFocus={(a) => {
                  void commit((s) => ({
                    ...s,
                    focus:
                      !s.focus.id || s.sessions.some((session) => session.id === s.focus.id)
                        ? {
                            ...s.focus,
                            minutes: Math.max(1, Math.min(180, a.minutes)),
                            remaining: Math.max(1, Math.min(180, a.minutes)) * 60000,
                            since: null,
                            id: '',
                          }
                        : s.focus,
                    focusNotes: { task: a.title, distractions: s.focusNotes?.distractions || '' },
                  })).then((ok) => {
                    if (ok) setSection('focus');
                  });
                }}
              />
            </>
          )}
          {section === 'habits' && <HabitsView {...props} />}
          {section === 'planner' && <PlannerView {...props} />}
          {section === 'focus' && <LifeFocus {...props} date={j.today} />}
          {section === 'learn' && <LifeAcademy date={j.today} />}
          {section === 'programs' && <LifePrograms {...props} />}
          {section === 'insights' && <InsightsView {...props} />}
          {section === 'privacy' && (
            <Card>
              <Label bold size={22}>
                Your data, your choice
              </Label>
              <Label>
                These routines, habits and reflections stay in this device’s existing wellness
                store. They are not sent to the AI tutor, an analytics service, or a health
                platform. There are no biometric integrations or background sensor collection.
              </Label>
              <Label>
                Local app storage is not an encrypted medical vault. Browser storage is accessible
                to someone using this browser profile. Use device access protection and avoid
                entering diagnoses or sensitive medical details. Clearing app/browser data or
                uninstalling can remove these records.
              </Label>
              <Label>
                Delete individual habits and activities from their editors. Deleting all wellness
                data below also removes the older guided-routine check-ins, preferences and focus
                reflections, and turns wellness reminders off. Academy lessons and Change History
                remain.
              </Label>
              <Button quiet title="Delete all wellness data" onPress={() => setDeleting(true)} />
              {deleting && (
                <>
                  <Label accessibilityRole="alert">
                    Permanently delete all wellness data on this device?
                  </Label>
                  <Button
                    title="Confirm all wellness deletion"
                    disabled={busy}
                    onPress={() => {
                      setBusy(true);
                      const fresh = ensureDay(initialJourney(), dateKey());
                      void j
                        .update(() => fresh)
                        .then(() => syncNotifications(fresh.notifications, school.language))
                        .then(() => {
                          setDeleting(false);
                          setMessage('Wellness data deleted and reminders disabled.');
                        })
                        .catch(() =>
                          setMessage(
                            'Deletion or reminder cancellation could not finish. Retry; check Reminders before leaving.',
                          ),
                        )
                        .finally(() => setBusy(false));
                    }}
                  />
                  <Button quiet title="Keep my data" onPress={() => setDeleting(false)} />
                </>
              )}
            </Card>
          )}
        </>
      )}
    </Page>
  );
}
