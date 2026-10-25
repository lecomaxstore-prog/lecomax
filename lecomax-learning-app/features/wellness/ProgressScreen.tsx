import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Label, ProgressBar, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { dayNumber, percentage, shiftDate, stats } from './engine';
import { achievementNames, JourneyPage, useCopy } from './components';
import { useJourney } from './useJourney';
export default function ProgressScreen() {
  const { state, today } = useJourney(),
    { t, colors } = useSchool(),
    copy = useCopy();
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week');
  if (!state)
    return <JourneyPage title={t('Mes progrès', 'My progress', 'تقدمي')}>{null}</JourneyPage>;
  const summary = stats(state, today, range),
    week = stats(state, today, 'week'),
    month = stats(state, today, 'month');
  const dow = (new Date(`${today}T12:00:00`).getDay() + 6) % 7;
  const start =
    range === 'week'
      ? shiftDate(today, -dow)
      : range === 'month'
        ? `${today.slice(0, 7)}-01`
        : state.startDate;
  const length = Math.max(1, dayNumber(today) - dayNumber(start) + 1);
  const bucketSize = Math.max(1, Math.ceil(length / 31));
  const bars = Array.from({ length: Math.ceil(length / bucketSize) }, (_, i) => {
    const key = shiftDate(start, i * bucketSize);
    const n = Math.min(bucketSize, length - i * bucketSize);
    return {
      key,
      value: Math.round(
        Array.from({ length: n }, (_, j) => percentage(state.days[shiftDate(key, j)])).reduce(
          (a, b) => a + b,
          0,
        ) / n,
      ),
    };
  });
  const values = [
    [t('Série actuelle', 'Current streak', 'الاستمرارية الحالية'), summary.current],
    [t('Meilleure série', 'Longest streak', 'أطول استمرارية'), summary.longest],
    [
      t('Jours validés · total', 'Completed days · total', 'الأيام المكتملة · الكل'),
      summary.completedDays,
    ],
    [t('Cette semaine', 'This week', 'هذا الأسبوع'), `${week.completion}%`],
    [t('Ce mois-ci', 'This month', 'هذا الشهر'), `${month.completion}%`],
    [
      t('Humeur moyenne', 'Average mood', 'متوسط المزاج'),
      summary.mood === null ? '—' : `${summary.mood.toFixed(1)} / 5`,
    ],
    [
      t('Sommeil moyen', 'Average sleep', 'متوسط النوم'),
      summary.sleep === null ? '—' : `${summary.sleep.toFixed(1)} / 5`,
    ],
    [
      t('Concentration moyenne', 'Average focus', 'متوسط التركيز'),
      summary.focus === null ? '—' : `${summary.focus.toFixed(1)} / 5`,
    ],
    [t('Jours avec hydratation', 'Water habit days', 'أيام شرب الماء'), summary.water],
    [t('Leçons terminées', 'Learning sessions', 'جلسات التعلم'), summary.learning],
    [t('Défis mémoire', 'Brain exercises', 'تمارين العقل'), summary.brain],
    [t('Jours actifs', 'Active days', 'أيام النشاط'), summary.active],
  ];
  return (
    <JourneyPage title={t('Mes progrès', 'My progress', 'تقدمي')}>
      <Row>
        {(['week', 'month', 'all'] as const).map((r, i) => (
          <Button
            key={r}
            quiet
            selected={range === r}
            title={
              [
                t('Cette semaine', 'This week', 'هذا الأسبوع'),
                t('Ce mois-ci', 'This month', 'هذا الشهر'),
                t('Tout', 'All time', 'كل الوقت'),
              ][i]!
            }
            onPress={() => setRange(r)}
          />
        ))}
      </Row>
      <Card>
        <Label bold>
          {t('Votre régularité', 'Your consistency', 'استمراريتك')} · {summary.completion}%
        </Label>
        <ProgressBar value={summary.completion / 100} />
        <Label muted>
          {t(
            'Les jours non renseignés comptent pour 0 %. La journée en cours est incluse.',
            'Untracked days count as 0%. Today is included.',
            'الأيام دون تسجيل تحتسب ٠٪. يشمل الحساب اليوم الحالي.',
          )}
        </Label>
        <View style={{ flexDirection: 'row', height: 128, alignItems: 'flex-end', gap: 3 }}>
          {bars.map((b) => (
            <View
              key={b.key}
              accessible
              accessibilityLabel={`${b.key}: ${b.value}%`}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  height: Math.max(3, b.value),
                  backgroundColor: b.value >= 70 ? colors.accent : colors.muted,
                  borderRadius: 4,
                }}
              />
            </View>
          ))}
        </View>
        <Label muted size={12}>
          {start} → {today}
          {bucketSize > 1 ? ` · ${bucketSize} ${t('jours/barre', 'days/bar', 'أيام/عمود')}` : ''}
        </Label>
      </Card>
      <Row style={{ alignItems: 'stretch' }}>
        {values.map(([label, value]) => (
          <Card key={label} style={{ flexGrow: 1, flexBasis: 140, padding: 16 }}>
            <Label muted size={13}>
              {label}
            </Label>
            <Label size={25} bold>
              {value}
            </Label>
          </Card>
        ))}
      </Row>
      <Card>
        <Label bold>🏆 {t('Mes réussites', 'Achievements', 'إنجازاتي')}</Label>
        <Label muted>
          {t(
            'Les réussites restent acquises. « 7 jours équilibrés » compte 7 jours avec fruit, légumes et repas équilibré.',
            'Achievements stay unlocked. “7 balanced food days” counts days with fruit, vegetables and a balanced meal.',
            'تبقى الإنجازات المكتسبة. «٧ أيام غذاء متوازن» تحسب الأيام التي تشمل الفاكهة والخضروات ووجبة متوازنة.',
          )}
        </Label>
        {Object.entries(achievementNames).map(([id, name]) => (
          <Label key={id} muted={!state.achievements.includes(id)}>
            {state.achievements.includes(id) ? '✦' : '○'} {copy(name)}
          </Label>
        ))}
      </Card>
      <Card>
        <Label bold>{t('Mes moments de gratitude', 'My gratitude moments', 'لحظات امتناني')}</Label>
        {Object.values(state.days)
          .filter((d) => d.date >= start && d.dailyMoment?.gratitude)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((d) => (
            <View key={d.date} style={{ gap: 6, paddingVertical: 10 }}>
              <Label muted size={12}>
                {d.date}
              </Label>
              <Label>{d.dailyMoment!.gratitude}</Label>
            </View>
          ))}
        {!Object.values(state.days).some((d) => d.date >= start && d.dailyMoment?.gratitude) && (
          <Label muted>
            {t(
              'Les petits moments que vous gardez apparaîtront ici.',
              'The small moments you save will appear here.',
              'ستظهر هنا اللحظات الصغيرة التي تحفظها.',
            )}
          </Label>
        )}
      </Card>
      <Card>
        <Label bold>{t('Historique des bilans', 'Check-in history', 'سجل الحالات اليومية')}</Label>
        {Object.values(state.days)
          .filter((d) => d.date >= start && d.checkIn)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((d) => (
            <View
              key={d.date}
              style={{
                gap: 5,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: colors.line,
              }}
            >
              <Label bold>
                {d.date} · {d.checkIn?.mood}/5
              </Label>
              <Label muted>
                {t(
                  'Énergie / concentration / sommeil / stress',
                  'Energy / focus / sleep / stress',
                  'طاقة / تركيز / نوم / توتر',
                )}
                :{' '}
                {[d.checkIn?.energy, d.checkIn?.focus, d.checkIn?.sleep, d.checkIn?.stress]
                  .map((v) => v ?? '—')
                  .join(' / ')}
              </Label>
              {!!d.checkIn?.note && <Label>{d.checkIn.note}</Label>}
            </View>
          ))}
        {!Object.values(state.days).some((d) => d.date >= start && d.checkIn) && (
          <Label muted>
            {t(
              'Votre premier bilan apparaîtra ici.',
              'Your first check-in will appear here.',
              'ستظهر حالتك اليومية الأولى هنا.',
            )}
          </Label>
        )}
      </Card>
    </JourneyPage>
  );
}
