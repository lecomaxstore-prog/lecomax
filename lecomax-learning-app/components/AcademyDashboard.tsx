import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { router, type Href } from 'expo-router';
import { useSchool } from '../store/School';
import { Button, Card, IconButton, Label, ListItem, Page, ProgressBar, Row } from './UI';
import { PracticeLaunchpad } from './PracticeLaunchpad';
import { DailyRoutineCard } from '../features/wellness/DailyRoutineCard';
import { ConnectionStatus } from '../features/ConnectionStatus';
import { LearningReminder } from '../features/LearningReminder';
import { analytics } from '../utils/academy';
import { recommendation, subjects } from '../services/discovery';
import { lessons } from '../services/content';
import { library } from '../services/course-library';
import { courseLearning } from '../services/course-learning';
import { dueReviews } from '../utils/learning-memory';
import { ChangesMade } from './ChangeHistory';
import { AcademyEmblem, IconTile, MetricCard, ToolCard } from './AcademySignature';
import { SectionHeader } from './LearningUI';
import { UniverseOverview } from '../features/universe/Overview';
import { CuriosityEntry } from '../features/curiosity/CuriosityScreen';
import { AcademyDestinations } from './AcademyDestinations';
import { ContinueLearning } from './ContinueLearning';

export function openLearningItem(id: string) {
  if (id.startsWith('plan-') && id.includes(':')) {
    const [plan, step] = id.split(':');
    router.push({ pathname: '/plan-lesson', params: { plan, step } });
  } else router.push({ pathname: '/lesson/[id]', params: { id } });
}
export function WeeklyChart() {
  const { state, colors, t, rtl } = useSchool();
  const data = analytics(state);
  const max = Math.max(60, ...data.week.map((d) => d.seconds));
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label bold size={19}>
          {t('Votre semaine', 'Your week', 'أسبوعك')}
        </Label>
        <Label muted>
          {data.activeDays} / 7 {t('jours actifs', 'active days', 'أيام نشطة')}
        </Label>
      </Row>
      <View
        style={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          gap: 10,
          height: 135,
        }}
      >
        {data.week.map((d) => (
          <View
            key={d.day}
            accessible
            accessibilityLabel={`${d.day}: ${Math.floor(d.seconds / 60)} ${t('minutes', 'minutes', 'دقائق')}`}
            style={{ flex: 1, alignItems: 'center', gap: 5 }}
          >
            <Label size={11} muted>
              {Math.floor(d.seconds / 60)}
            </Label>
            <View
              style={{
                width: '100%',
                maxWidth: 40,
                height: Math.max(3, (d.seconds / max) * 82),
                borderRadius: 6,
                backgroundColor: d.seconds ? colors.accent : colors.line,
              }}
            />
            <Label size={10} muted>
              {new Intl.DateTimeFormat(state.language, { weekday: 'narrow' }).format(
                new Date(d.day + 'T12:00:00'),
              )}
            </Label>
          </View>
        ))}
      </View>
      <Label muted size={12}>
        {t(
          'Minutes dans les écrans d’apprentissage. L’historique antérieur peut inclure d’autres écrans.',
          'Minutes on learning screens. Earlier records may include time on other screens.',
          'دقائق داخل شاشات التعلّم. قد تشمل السجلات القديمة وقتًا في شاشات أخرى.',
        )}
      </Label>
    </Card>
  );
}
export function AcademyDashboard() {
  const [reviewTime, setReviewTime] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setReviewTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const { state, t, colors, rtl } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const dashboardWide = width >= 1000 && fontScale < 1.4;
  const profile = state.academy.profile;
  const stats = analytics(state);
  const next = recommendation(state);
  const returning = !!state.lastLesson || state.completed.length > 0 || profile.onboarded;
  const due = [...new Set(dueReviews(state).map((r) => r.lessonId))];
  const resumePlan =
    state.academy.plans.find((p) => state.lastLesson.startsWith(p.id + ':')) ||
    state.academy.plans.at(-1);
  const titleFor = (id: string) =>
    lessons.find((l) => l.id === id)?.title[state.language] ||
    state.academy.plans
      .flatMap((p) => p.lessons.map((l, i) => ({ id: p.id + ':' + i, title: l.title })))
      .find((l) => l.id === id)?.title;
  const reasons = {
    review: t(
      'Un rappel est arrivé à échéance.',
      'A spaced review is due.',
      'حان موعد مراجعة متباعدة.',
    ),
    support: t(
      'Une explication plus simple vous aidera.',
      'Your attempts suggest a simpler explanation would help.',
      'قد يساعدك شرح أبسط.',
    ),
    resume: t(
      'Reprenez à votre étape enregistrée.',
      'Pick up at your saved lesson stage.',
      'تابع من المرحلة المحفوظة.',
    ),
    goal: t(
      'La prochaine étape de votre parcours.',
      'The next step in your selected learning path.',
      'الخطوة التالية في مسارك.',
    ),
  };
  return (
    <Page
      wide
      compactSpacing
      title="ACADEMY"
      header={
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Label
              bold
              size={10}
              style={{ color: colors.accent, letterSpacing: 1.8, writingDirection: 'ltr' }}
            >
              ACADEMY
            </Label>
            <Label bold size={20}>
              {profile.name
                ? t(`Bonjour, ${profile.name}`, `Hello, ${profile.name}`, `مرحبًا، ${profile.name}`)
                : t('Heureux de vous retrouver', 'A good day to learn', 'يوم جميل للتعلّم')}
            </Label>
          </View>
          <IconButton
            icon="notifications-outline"
            label={t('Rappels', 'Reminders', 'التذكيرات')}
            onPress={() => router.push('/wellness/notifications')}
          />
          <IconButton
            icon="person-circle-outline"
            label={t('Mon profil', 'My profile', 'ملفي')}
            onPress={() => router.push('/profile')}
          />
        </Row>
      }
    >
      <View
        style={{
          flexDirection: dashboardWide ? (rtl ? 'row-reverse' : 'row') : 'column',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        <View style={{ flex: dashboardWide ? 1.35 : undefined, minWidth: 0 }}>
          <Card
            style={{
              backgroundColor: colors.hero,
              padding: width < 360 ? 20 : width < 480 ? 24 : 36,
              gap: 16,
              flexGrow: 1,
              overflow: 'hidden',
              borderWidth: 0,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: colors.heroAccent,
                opacity: 0.16,
                top: -140,
                [rtl ? 'left' : 'right']: -90,
              }}
            />
            {width >= 700 && !dashboardWide && (
              <View style={{ position: 'absolute', [rtl ? 'left' : 'right']: 32, top: 30 }}>
                <AcademyEmblem />
              </View>
            )}
            <Label size={11} bold style={{ color: colors.heroGold, letterSpacing: rtl ? 0 : 1.5 }}>
              {t('VOTRE MISSION DU JOUR', 'TODAY’S LEARNING MISSION', 'مهمتك التعليمية اليوم')}
            </Label>
            <Label
              accessibilityRole="header"
              bold
              size={width < 360 ? 28 : width < 480 ? 30 : 40}
              style={{
                color: colors.onPrimary,
                lineHeight: rtl ? (width < 360 ? 46 : 54) : width < 480 ? 39 : 49,
                maxWidth: width >= 700 && !dashboardWide ? '70%' : '100%',
              }}
            >
              {next?.lesson.title[state.language] ||
                t(
                  'Chaque jour, un peu plus loin.',
                  'Every day, a little further.',
                  'كل يوم، خطوة نحو الأفضل',
                )}
            </Label>
            <Label
              size={15}
              style={{
                color: colors.heroText,
                maxWidth: width >= 700 && !dashboardWide ? '68%' : '100%',
              }}
            >
              {profile.goal ||
                t(
                  'Votre curiosité, votre rythme. Apprenez ce qui vous inspire, avec votre professeur IA.',
                  'Your curiosity. Your pace. Learn what inspires you, with your AI teacher by your side.',
                  'ابدأ رحلتك التعليمية مع أستاذك الذكي، وتعلّم ما تحب بطريقتك الخاصة.',
                )}
            </Label>
            <Row>
              <Button
                style={{ backgroundColor: colors.heroAccent }}
                title={
                  !profile.onboarded
                    ? t('Personnaliser mon parcours', 'Personalize my learning', 'خصّص رحلتي')
                    : t('Continuer à apprendre', 'Continue learning', 'تابع تعلّمك')
                }
                onPress={() =>
                  !profile.onboarded
                    ? router.push('/onboarding')
                    : router.push('/courses')
                }
              />
              <Button
                title={t('Mes cours', 'My courses', 'دوراتي')}
                quiet
                onPress={() => router.push('/courses')}
              />
            </Row>
          </Card>
        </View>
        <View
          style={{ flex: dashboardWide ? 1 : undefined, minWidth: 0, justifyContent: 'center' }}
        >
          <View style={{ gap: 14 }}>
            <SectionHeader
              title={t('Votre prochaine étape', 'Continue learning', 'تابع تعلّمك')}
              action={t('Mes cours', 'My learning', 'تعلّمي')}
              onPress={() => router.push('/courses')}
            />
            <ContinueLearning />
          </View>
        </View>
      </View>
      <Button
        quiet
        icon="search-outline"
        title={t(
          'Que voulez-vous apprendre aujourd’hui ?',
          'What would you like to learn today?',
          'ماذا تريد أن تتعلّم اليوم؟',
        )}
        onPress={() => router.push('/search')}
      />
      <Row style={{ alignItems: 'stretch', gap: 12 }}>
        <MetricCard
          icon="checkmark-done-outline"
          value={state.completed.length}
          label={t('Leçons terminées', 'Lessons completed', 'دروس مكتملة')}
        />
        <MetricCard
          icon="flame-outline"
          tone="gold"
          value={stats.streak}
          label={t('Jours de suite', 'Day streak', 'أيام متتالية')}
        />
        <MetricCard
          icon="time-outline"
          value={stats.todayMinutes}
          label={t('Minutes aujourd’hui', 'Minutes today', 'دقائق اليوم')}
        />
        <MetricCard
          icon="albums-outline"
          tone="violet"
          value={due.length}
          label={t('Leçons à réviser', 'Lessons due for review', 'دروس للمراجعة')}
        />
      </Row>
      <AcademyDestinations />
      <UniverseOverview />
      <CuriosityEntry />
      {returning && (
        <>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label bold>
                {t('Objectif quotidien', 'Daily learning goal', 'هدف التعلّم اليومي')}
              </Label>
              <Button
                quiet
                title={t('Modifier', 'Edit', 'تعديل')}
                onPress={() => router.push('/onboarding')}
              />
            </Row>
            <Label>
              {stats.todayMinutes} / {profile.dailyMinutes} {t('minutes', 'minutes', 'دقيقة')}
            </Label>
            <ProgressBar value={stats.todayMinutes / profile.dailyMinutes} />
          </Card>
          {resumePlan && (
            <ListItem
              title={resumePlan.title}
              subtitle={t(
                'Continuer votre parcours personnalisé',
                'Continue your personal learning plan',
                'تابع مسارك المخصص',
              )}
              onPress={() =>
                router.push({ pathname: '/learning-journey', params: { id: resumePlan.id } })
              }
            />
          )}
          {next && (
            <Card>
              <Label bold size={12} style={{ color: colors.accent }}>
                {t('RECOMMANDÉ POUR VOUS', 'RECOMMENDED FOR YOU', 'مقترح لك')}
              </Label>
              <Label bold size={23}>
                {next.lesson.title[state.language]}
              </Label>
              <Label muted>{reasons[next.reason]}</Label>
              <Label muted size={12}>
                {next.lesson.minutes} {t('min estimées', 'estimated minutes', 'دقائق تقديرية')}
              </Label>
              <Button
                title={t('Ouvrir la leçon', 'Open lesson', 'افتح الدرس')}
                onPress={() => openLearningItem(next.lesson.id)}
              />
              {next.reason === 'support' && (
                <Button
                  quiet
                  title={t('Une explication plus simple', 'A simpler explanation', 'شرح أبسط')}
                  onPress={() =>
                    router.push({
                      pathname: '/teacher',
                      params: {
                        lesson: next.lesson.id,
                        question: t(
                          'Explique plus simplement et vérifie les prérequis.',
                          'Explain more simply and check the prerequisites.',
                          'اشرح ببساطة وتحقّق من فهمي للأساسيات.',
                        ),
                      },
                    })
                  }
                />
              )}
            </Card>
          )}
        </>
      )}
      <Card style={{ backgroundColor: colors.soft, padding: 24, gap: 18 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconTile icon="sparkles" large />
          <Label bold size={10} style={{ color: colors.accent, letterSpacing: 1.2 }}>
            ACADEMY AI
          </Label>
        </Row>
        <Label bold size={22}>
          {t('Votre professeur personnel', 'Your personal AI teacher', 'أستاذك الذكي')}
        </Label>
        <Label>
          {t(
            'Une explication, une question, un retour sur votre travail — dans votre langue.',
            'An explanation, a question, feedback on your work — in your language.',
            'شرح وسؤال وملاحظات على عملك — بلغتك.',
          )}
        </Label>
        <Row>
          {[
            t('Explique simplement', 'Explain simply', 'اشرح ببساطة'),
            t('Donne un exemple', 'Give me an example', 'أعطني مثالًا'),
          ].map((question) => (
            <Button
              key={question}
              quiet
              title={question}
              onPress={() => router.push({ pathname: '/teacher', params: { question } })}
            />
          ))}
        </Row>
        <Button
          title={t('Parler à mon professeur', 'Talk to my teacher', 'تحدّث مع معلّمي')}
          icon="sparkles-outline"
          onPress={() => router.push('/teacher')}
        />
        <Label muted size={12}>
          {t(
            'Connexion Internet requise.',
            'Internet connection required.',
            'يتطلب اتصالًا بالإنترنت.',
          )}
        </Label>
      </Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label bold size={22}>
          {t('Vos parcours', 'Your learning paths', 'مساراتك التعليمية')}
        </Label>
        <Button
          quiet
          title={t('Tout voir', 'View all', 'عرض الكل')}
          onPress={() => router.push('/my-learning')}
        />
      </Row>
      {library
        .filter(
          (c) =>
            state.academy.enrolled.includes(c.id) ||
            courseLearning(c, state).started || courseLearning(c, state).complete,
        )
        .slice(0, 3)
        .map((c) => (
          <ListItem
            key={c.id}
            title={t(c.title[0], c.title[1], c.title[2])}
            subtitle={`${courseLearning(c, state).done} / ${c.lessons.length}`}
            onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id } })}
          />
        ))}
      {!state.lastLesson && !state.academy.plans.length && (
        <Label muted>
          {t(
            'Explorez un sujet pour commencer votre premier parcours.',
            'Explore a subject to start your first learning path.',
            'اختر موضوعًا لتبدأ مسارك الأول.',
          )}
        </Label>
      )}
      {state.academy.plans.slice(-2).map((p) => (
        <ListItem
          key={p.id}
          title={p.title}
          onPress={() => router.push({ pathname: '/study-plan', params: { id: p.id } })}
        />
      ))}
      <Label bold size={22}>
        {t('À découvrir', 'Subjects to explore', 'مواضيع للاكتشاف')}
      </Label>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: rtl ? 'row-reverse' : 'row',
          gap: 12,
          paddingBottom: 6,
        }}
      >
        {[...subjects]
          .sort(
            (a, b) =>
              Number(state.academy.favorites.includes(b.id)) -
              Number(state.academy.favorites.includes(a.id)),
          )
          .map((s) => (
            <ToolCard
              key={s.id}
              icon={s.icon}
              title={t(s.title[0], s.title[1], s.title[2])}
              description={t('Explorer ce sujet', 'Explore this subject', 'اكتشف هذا الموضوع')}
              style={{ width: 185 }}
              onPress={() => router.push({ pathname: '/explore', params: { subject: s.id } })}
            />
          ))}
      </ScrollView>
      <Card>
        <Label bold>{t('Studio mémoire', 'Memory Studio', 'استوديو الذاكرة')}</Label>
        <Label>
          {state.flashcards.cards.filter((c) => c.dueAt <= reviewTime).length}{' '}
          {t('cartes à revoir', 'cards due', 'بطاقات للمراجعة')}
        </Label>
        <Button
          title={t('Ouvrir mes cartes', 'Open my flashcards', 'افتح بطاقاتي')}
          onPress={() => router.push('/memory-studio')}
        />
      </Card>
      {!!due.length && (
        <Card>
          <Label bold>{t('Révisions à faire', 'Reviews due', 'مراجعات مستحقة')}</Label>
          {due
            .slice(0, 3)
            .filter((id) => titleFor(id))
            .map((id) => (
              <ListItem key={id} title={titleFor(id)!} onPress={() => openLearningItem(id)} />
            ))}
          <Button
            quiet
            title={t('Toutes les révisions', 'All reviews', 'كل المراجعات')}
            onPress={() => router.push('/my-learning')}
          />
        </Card>
      )}
      {!!state.bookmarks.length && (
        <Card>
          <Label bold>
            {t('Dernières leçons sauvegardées', 'Recently saved lessons', 'آخر الدروس المحفوظة')}
          </Label>
          {state.bookmarks
            .slice(-3)
            .reverse()
            .filter((id) => titleFor(id))
            .map((id) => (
              <ListItem key={id} title={titleFor(id)!} onPress={() => openLearningItem(id)} />
            ))}
        </Card>
      )}
      {!!stats.achievements.length && (
        <Card>
          <Label bold>{t('Vos réussites', 'Your achievements', 'إنجازاتك')}</Label>
          <Label>
            {stats.achievements.length}{' '}
            {t('étapes franchies', 'milestones earned', 'إنجازات مستحقة')}
          </Label>
          <Button
            quiet
            title={t('Voir mes progrès', 'See my progress', 'اعرض تقدّمي')}
            onPress={() => router.push('/my-learning')}
          />
        </Card>
      )}
      <PracticeLaunchpad />
      <WeeklyChart />
      <View style={{ gap: 14 }}>
        <SectionHeader
          title={t('À votre rythme', 'Made for your next step', 'خطوتك القادمة')}
          action={t('Explorer', 'Explore', 'اكتشف')}
          onPress={() => router.push('/explore')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: rtl ? 'row-reverse' : 'row',
            gap: 14,
            paddingBottom: 6,
          }}
        >
          {[...library]
            .sort(
              (a, b) =>
                Number(state.academy.enrolled.includes(b.id)) -
                Number(state.academy.enrolled.includes(a.id)),
            )
            .slice(0, 4)
            .map((c) => (
              <ToolCard
                key={c.id}
                icon="library-outline"
                title={t(c.title[0], c.title[1], c.title[2])}
                description={`${courseLearning(c, state).done} / ${c.lessons.length} ${t('leçons terminées', 'lessons completed', 'دروس مكتملة')}`}
                eyebrow={
                  state.academy.enrolled.includes(c.id)
                    ? t('VOTRE COURS', 'YOUR COURSE', 'دورتك')
                    : t('À DÉCOUVRIR', 'DISCOVER', 'للاكتشاف')
                }
                style={{ width: width < 480 ? 260 : 300 }}
                onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id } })}
              />
            ))}
        </ScrollView>
      </View>
      <Row>
        {[
          ['/project', t('Mes projets', 'My projects', 'مشاريعي')],
          ['/phone-lab', t('Labo téléphone', 'Phone lab', 'مختبر الهاتف')],
          ['/pc-lab', t('Labo PC', 'PC lab', 'مختبر الحاسوب')],
          ['/car-studio', '3D Car Studio'],
          ['/change-history', t('Historique des changements', 'Changes Made', 'سجل التغييرات')],
        ].map(([route, title]) => (
          <Button key={route} quiet title={title!} onPress={() => router.push(route as Href)} />
        ))}
      </Row>
      <DailyRoutineCard compact />
      {next && <LearningReminder lessonId={next.lesson.id} />}
      <ConnectionStatus />
      <ChangesMade />
    </Page>
  );
}
