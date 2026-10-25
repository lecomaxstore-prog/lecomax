import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { library, normalizeCourseQuery } from '../services/course-library';
import { courseGroups, courseLearning } from '../services/course-learning';
import { Button, Card, EmptyState, Field, Label, Page, ProgressBar, Row } from '../components/UI';
import { ContinueLearning } from '../components/ContinueLearning';

export default function Courses() {
  const { state, t, colors, update } = useSchool();
  const [filter, setFilter] = useState<'all' | 'mine' | 'completed'>(() => library.some(c => {
    const p = courseLearning(c, state);
    return p.started || p.saved;
  }) ? 'mine' : 'all');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [showCategories, setShowCategories] = useState(false);
  const items = library.map(course => ({ course, progress: courseLearning(course, state) }));
  const mine = items.filter(i => i.progress.started || i.progress.saved || i.progress.complete);
  const completed = items.filter(i => i.progress.complete);
  const visible = items.filter(({ course, progress }) =>
    (filter === 'all' || (filter === 'completed' ? progress.complete : progress.started || progress.saved || progress.complete)) &&
    normalizeCourseQuery(course.title.join(' ') + ' ' + course.summary.join(' ')).includes(normalizeCourseQuery(query)));
  const activeGroup = courseGroups.find(g => g.id === group);
  return <Page compactSpacing title={t('Mes cours', 'Courses', 'دوراتي')} subtitle={t('Un point de départ clair. Votre progression, toujours à portée de main.', 'A clear place to start, and a saved place to continue.', 'بداية واضحة، وتقدّم محفوظ، وخطوة تالية تعرفها.')}>
    <ContinueLearning showLibraryLink={false} />
    <View style={{ gap: 12 }}>
    <Row>
      {([
        ['all', t('Tous les cours', 'All courses', 'كل الدورات'), items.length],
        ['mine', t('Mes cours', 'My courses', 'دوراتي'), mine.length],
        ['completed', t('Terminés', 'Completed', 'المكتملة'), completed.length],
      ] as const).map(([id, title, count]) => <Button key={id} quiet selected={filter === id} title={`${title} (${count})`} onPress={() => setFilter(id)} />)}
    </Row>
    <Field value={query} onChangeText={setQuery} placeholder={t('Rechercher un cours', 'Search courses', 'ابحث عن دورة')} />
    <Button quiet icon="options-outline" title={activeGroup ? t(activeGroup.title[0], activeGroup.title[1], activeGroup.title[2]) : t('Toutes les catégories', 'All categories', 'كل التصنيفات')} onPress={() => setShowCategories(value => !value)} />
    {showCategories && <Row>
      <Button quiet selected={group === 'all'} title={t('Toutes les catégories', 'All categories', 'كل التصنيفات')} onPress={() => setGroup('all')} />
      {courseGroups.map(g => <Button key={g.id} quiet selected={group === g.id} title={t(g.title[0], g.title[1], g.title[2])} onPress={() => setGroup(g.id)} />)}
    </Row>}
    </View>
    {courseGroups.filter(g => group === 'all' || group === g.id).map(g => {
      const courses = g.courses.flatMap(id => visible.filter(i => i.course.id === id));
      if (!courses.length) return null;
      return <View key={g.id} style={{ gap: 12 }}>
        <Label bold size={21} accessibilityRole="header">{t(g.title[0], g.title[1], g.title[2])}</Label>
        {courses.map(({ course, progress }) => <Card key={course.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label bold size={13} style={{ color: colors.accent }}>{progress.complete ? t('Terminé', 'Completed', 'مكتملة') : progress.started ? t('En cours', 'In progress', 'قيد التعلّم') : progress.saved ? t('Dans mon plan', 'Saved for later', 'في خطتي') : t('Pas encore commencé', 'Not started', 'لم تبدأ بعد')}</Label>
            {course.id === 'academy-foundations' && <Label muted size={12}>{t('Conseillé pour débuter', 'Recommended first', 'بداية مقترحة')}</Label>}
          </Row>
          <Label bold size={20}>{t(course.title[0], course.title[1], course.title[2])}</Label>
          <Label muted size={14}>{t(course.summary[0], course.summary[1], course.summary[2])}</Label>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label size={13}>{t(`${progress.done} / ${progress.total} leçons terminées`, `${progress.done} / ${progress.total} lessons completed`, `أكملت ${progress.done} من ${progress.total} درسًا`)}</Label>
            <Label bold size={13}>{Math.round(progress.done / Math.max(1, progress.total) * 100)}%</Label>
          </Row>
          <ProgressBar value={progress.done / Math.max(1, progress.total)} />
          {progress.next && progress.started && <Label size={14}>{t('À suivre : ', 'Up next: ', 'خطوتك التالية: ')}{progress.next.title[state.language]}</Label>}
          <Button title={progress.complete ? t('Revoir le cours', 'Review course', 'راجع الدورة') : progress.started ? t('Continuer ce cours', 'Continue this course', 'تابع هذه الدورة') : t('Commencer ce cours', 'Start this course', 'ابدأ هذه الدورة')} onPress={() => progress.next ? router.push({ pathname: '/lesson/[id]', params: { id: progress.next.id, course: course.id } }) : router.push({ pathname: '/course/[id]', params: { id: course.id } })} />
          <Row>
            <Button quiet title={t('Plan du cours', 'Course outline', 'خطة الدورة')} onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })} />
            <Button quiet selected={progress.saved} title={progress.saved ? t('Retirer de mon plan', 'Remove from my plan', 'إزالة من خطتي') : t('Garder pour plus tard', 'Save for later', 'احفظها لوقت لاحق')} onPress={() => update(p => ({ ...p, academy: { ...p.academy, enrolled: p.academy.enrolled.includes(course.id) ? p.academy.enrolled.filter(id => id !== course.id) : [...p.academy.enrolled, course.id] } }))} />
          </Row>
        </Card>)}
      </View>;
    })}
    {!visible.some(i => courseGroups.some(g => (group === 'all' || group === g.id) && (g.courses as readonly string[]).includes(i.course.id))) && <EmptyState title={t('Aucun cours ici pour le moment', 'No courses here yet', 'لا توجد دورات هنا بعد')} description={t('Choisissez un cours ou changez les filtres.', 'Start or save a course, or change your filters.', 'ابدأ دورة أو احفظها في خطتك، أو غيّر خيارات البحث.')} action={t('Voir tous les cours', 'Show all courses', 'عرض كل الدورات')} onAction={() => { setFilter('all'); setGroup('all'); setQuery(''); }} />}
    {!!state.academy.plans.length && <Card>
      <Label bold size={20}>{t('Mes parcours personnalisés', 'My personal learning plans', 'مساراتي الشخصية')}</Label>
      {state.academy.plans.map(plan => <Button key={plan.id} quiet title={plan.title} onPress={() => router.push({ pathname: '/learning-journey', params: { id: plan.id } })} />)}
    </Card>}
    <Card>
      <Label bold>{t('Explorer davantage', 'Explore more', 'اكتشف المزيد')}</Label>
      <Label muted size={13}>{t('Les catégories suggèrent un ordre. Vous pouvez choisir librement. Les leçons communes conservent leur progression.', 'Categories suggest an order; choose freely. Progress on shared lessons carries across courses.', 'التصنيفات تقترح ترتيبًا للتعلّم، ويمكنك اختيار ما يناسبك. يُحتسب تقدّم الدروس المشتركة في الدورات الأخرى.')}</Label>
      <Button quiet title={t('Sujets et découvertes', 'Subjects & discoveries', 'المواضيع والاكتشافات')} onPress={() => router.push('/explore')} />
      <Button quiet title={t('Tous les modules', 'All modules & learning paths', 'كل الوحدات ومسارات التعلّم')} onPress={() => router.push('/path')} />
      <Button quiet title={t('Historique et révisions', 'Study history & reviews', 'سجل التعلّم والمراجعات')} onPress={() => router.push('/my-learning')} />
    </Card>
  </Page>;
}
