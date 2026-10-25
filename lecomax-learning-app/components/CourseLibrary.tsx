import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { library, courseProgress, normalizeCourseQuery } from '../services/course-library';
import { useSchool } from '../store/School';
import { Button, Card, EmptyState, Field, Label, ProgressBar, Row } from './UI';

export function CourseLibrary() {
  const { state, t, colors, rtl } = useSchool();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const entries = library.map((course) => ({
    course,
    ...courseProgress(course, state.completed, state.lastLesson),
  }));
  const normalized = normalizeCourseQuery(query);
  const visible = entries.filter(
    ({ course, done, total, started }) =>
      (filter === 'all' ||
        (filter === 'active' ? started && done < total : total > 0 && done === total)) &&
      normalizeCourseQuery([...course.title, ...course.summary].join(' ')).includes(normalized),
  );
  const active = entries.filter((entry) => entry.started && entry.done < entry.total);
  const resume =
    active.find(({ course }) => course.lessons.some((lesson) => lesson.id === state.lastLesson)) ||
    active[0];
  const openLesson = (courseId: string, id: string) =>
    router.push({ pathname: '/lesson/[id]', params: { id, course: courseId } });
  return (
    <>
      {resume?.next && (
        <Card style={{ backgroundColor: colors.hero, borderColor: colors.hero, gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label size={12} bold style={{ color: colors.heroText }}>
              {t('REPRENDRE', 'CONTINUE LEARNING', 'واصل التعلّم')}
            </Label>
            <Ionicons name="play-circle-outline" size={24} color={colors.heroText} />
          </Row>
          <Label size={19} bold style={{ color: '#FFFFFF' }}>
            {resume.next.title[state.language]}
          </Label>
          <Label size={12} style={{ color: colors.heroText }}>
            {t(resume.course.title[0], resume.course.title[1], resume.course.title[2])} ·{' '}
            {resume.next.minutes} {t('min', 'min', 'دقيقة')}
          </Label>
          <Button
            title={t('Continuer ma leçon', 'Resume lesson', 'أكمل درسك')}
            icon={rtl ? 'arrow-back' : 'arrow-forward'}
            onPress={() => openLesson(resume.course.id, resume.next!.id)}
          />
        </Card>
      )}
      <View style={{ gap: 4 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Label bold size={21} accessibilityRole="header">
            {t('Explore tes cours', 'Explore your courses', 'اكتشف دوراتك')}
          </Label>
          <Label size={12} muted>
            {library.length} {t('parcours', 'paths', 'مسارات')}
          </Label>
        </Row>
        <Label muted size={14}>
          {t(
            'Un sujet, un peu de pratique, un pas de plus.',
            'One topic, a little practice, one step forward.',
            'موضوع جديد، تطبيق بسيط، وخطوة للأمام.',
          )}
        </Label>
      </View>
      <View style={{ gap: 10 }}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder={t('Rechercher un cours…', 'Search courses…', 'ابحث عن دورة…')}
        />
        <Row>
          {(
            [
              ['all', t('Tous', 'All', 'الكل')],
              ['active', t('En cours', 'In progress', 'قيد التعلّم')],
              ['done', t('Terminés', 'Completed', 'المكتملة')],
            ] as const
          ).map(([id, title]) => (
            <Button
              key={id}
              quiet
              selected={filter === id}
              title={title}
              onPress={() => setFilter(id)}
              style={{ borderRadius: 99 }}
            />
          ))}
        </Row>
        <Label muted size={12} accessibilityLiveRegion="polite">
          {visible.length} {t('cours affichés', 'courses shown', 'دورات معروضة')}
        </Label>
      </View>
      {visible.length === 0 && (
        <Card>
          <EmptyState
            title={t(
              'Aucun cours ici pour le moment',
              'No courses here yet',
              'لا توجد دورات هنا بعد',
            )}
            description={t(
              'Essaie un autre mot ou explore tous les cours.',
              'Try another search or explore all courses.',
              'جرّب كلمة أخرى أو استعرض جميع الدورات.',
            )}
          />
          <Button
            quiet
            title={t('Afficher tous les cours', 'Show all courses', 'عرض كل الدورات')}
            onPress={() => {
              setQuery('');
              setFilter('all');
            }}
          />
        </Card>
      )}
      {visible.map(({ course, done, total, started, next }) => {
        const violet = ['python', 'javascript'].includes(course.id);
        const amber = ['database', 'api'].includes(course.id);
        const tint = violet ? colors.violet : amber ? colors.amber : colors.accent;
        const fill = violet ? colors.violetSoft : amber ? colors.amberSoft : colors.soft;
        return (
          <Card key={course.id} style={{ gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t(course.title[0], course.title[1], course.title[2])} onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <View style={{ padding: 12, borderRadius: 16, backgroundColor: fill }}>
                <Ionicons name={course.icon} size={24} color={tint} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Label bold size={17}>
                  {t(course.title[0], course.title[1], course.title[2])}
                </Label>
                <Label size={12} style={{ color: done === total ? colors.accent : colors.muted }}>
                  {done === total
                    ? t('Parcours terminé', 'Path completed', 'مسار مكتمل')
                    : started
                      ? t('En cours', 'In progress', 'قيد التعلّم')
                      : t('À découvrir', 'Ready to explore', 'جاهز للاكتشاف')}
                </Label>
              </View>
            </Row>
            </Pressable>
            <Label muted size={14}>
              {t(course.summary[0], course.summary[1], course.summary[2])}
            </Label>
            <Label muted size={12}>
              {course.modules.length} {t('modules', 'modules', 'وحدات')} · {total}{' '}
              {t('leçons', 'lessons', 'درسًا')} ·{' '}
              {Math.round(course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0) / 60)}{' '}
              {t('h estimées', 'estimated hours', 'ساعة تقديرية')}
            </Label>
            <ProgressBar value={total ? done / total : 0} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Label muted size={12}>
                {done} / {total} {t('terminées', 'completed', 'مكتمل')}
              </Label>
              <Label bold size={12} style={{ color: colors.accent }}>
                {Math.round(total ? (done / total) * 100 : 0)}%
              </Label>
            </Row>
            <Row>
              {next && (
                <Button
                  title={
                    started
                      ? t('Continuer', 'Continue', 'متابعة')
                      : t('Commencer', 'Start learning', 'ابدأ التعلّم')
                  }
                  onPress={() => openLesson(course.id, next.id)}
                  style={{ flexGrow: 1 }}
                />
              )}
              <Button
                quiet
                title={t('Programme', 'Curriculum', 'البرنامج')}
                onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                style={{ flexGrow: 1 }}
              />
            </Row>
          </Card>
        );
      })}
    </>
  );
}
