import { View, Pressable, Image, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { library, courseProgress } from '../services/course-library';
import { courseLessons } from '../services/content';
import { dueReviews } from '../utils/learning-memory';
import { Button, Card, Label, Page, ProgressBar, Row } from './UI';
import { StudioVisual } from './StudioVisual';
import { DailyRoutineCard } from '../features/wellness/DailyRoutineCard';
import { PracticeLaunchpad } from './PracticeLaunchpad';
import { LearningReminder } from '../features/LearningReminder';
import { ConnectionStatus } from '../features/ConnectionStatus';

const coursePhotos: Record<string, number> = {
  'academy-foundations': require('../assets/course-photos/programming-foundations.png'),
  'real-site': require('../assets/course-photos/real-website.png'),
  python: require('../assets/course-photos/python.png'),
};

export function StudyDashboard() {
  const { state, update, colors, t, rtl } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 900 && fontScale < 1.5;
  const row = rtl ? 'row-reverse' : 'row';
  const stackActions = width < 380 || fontScale >= 1.3;
  const current = library.find(c => c.lessons.some(l => l.id === state.lastLesson)) || library[0];
  if (!current) return <Page title={t('Mon studio', 'My learning studio', 'استوديو التعلّم')} />;
  const progress = courseProgress(current, state.completed, state.lastLesson);
  const next = progress.next;
  const due = dueReviews(state).length;
  const budget = [15, 30, 60].includes(Number(state.drafts['studio:minutes'])) ? Number(state.drafts['studio:minutes']) : 30;
  const completed = courseLessons.filter(l => state.completed.includes(l.id)).length;
  const openCourse = (id: string, section?: string) => router.push({ pathname: '/course/[id]', params: { id, ...(section ? { section } : {}) } });
  const openNext = () => next ? router.push({ pathname: '/lesson/[id]', params: { id: next.id, course: current.id } }) : openCourse(current.id, 'practice');
  const heading = <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', gap: 14 }}>
    <Row style={{ flexWrap: 'nowrap', flex: 1 }}>
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.hero, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="school-outline" size={23} color="#D9EDBD" /></View>
      <View style={{ flex: 1 }}><Label bold size={15} style={{ writingDirection: 'ltr', textAlign: rtl ? 'right' : 'left' }}><Label size={15} style={{ color: colors.accent }}>ACADEMY</Label></Label><Label muted size={10}>{t('VOTRE STUDIO D’APPRENTISSAGE', 'YOUR PERSONAL LEARNING STUDIO', 'مساحتك للفهم والإبداع')}</Label></View>
    </Row>
    <Pressable accessibilityRole="button" accessibilityLabel={t('Paramètres', 'Settings', 'الإعدادات')} onPress={() => router.push('/settings')} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Label bold size={13}>ZZ</Label></Pressable>
  </Row>;
  return <Page wide compactSpacing title={t('Mon studio', 'My learning studio', 'استوديو التعلّم')} header={heading}>
    <View style={{ backgroundColor: '#102E29', borderRadius: 24, padding: wide ? 36 : 20, gap: 20, overflow: 'hidden', flexDirection: wide ? row : 'column' }}>
      <View style={{ flex: wide ? 1.2 : undefined, gap: wide ? 18 : 12 }}>
        <Row><View style={{ width: 22, height: 2, backgroundColor: '#D6BD8C' }} /><Label bold size={10} style={{ color: '#D6BD8C', letterSpacing: rtl ? 0 : 2 }}>{t('DE L’IDÉE AU PROJET', 'FROM CURIOSITY TO CREATION', 'من الفضول إلى الإنجاز')}</Label></Row>
        <Label accessibilityRole="header" bold size={wide ? 43 : 28} style={{ color: '#FFFFFF', lineHeight: wide ? 55 : 39, letterSpacing: rtl ? 0 : -1 }}>{t('Apprenez avec un but.\nConstruisez avec confiance.', 'Learn with purpose.\nBuild with confidence.', 'تعلّم بهدف.\nوابنِ بثقة.')}</Label>
        <Label size={14} style={{ color: '#C1D4CB', lineHeight: 24 }}>{t('Bienvenue, Zakaria. Une idée à comprendre, un projet à construire.', 'Welcome, Zakaria. One idea to understand. One project to build.', 'مرحبًا زكريا. فكرة كتفهمها اليوم، ومشروع كتبنيه خطوة بخطوة.')}</Label>
        <Row style={{ gap: 10, flexDirection: stackActions ? 'column' : row, alignItems: 'stretch', flexWrap: 'nowrap', marginTop: 4 }}><Button title={next ? t('Ma leçon', 'Start learning', 'ابدأ التعلّم') : t('Passer à la pratique', 'Go to practice', 'انتقل للتطبيق')} icon="play-circle-outline" onPress={openNext} style={{ flex: stackActions ? undefined : 1, backgroundColor: '#28765D', borderColor: '#59917C', borderRadius: 14, minHeight: 48 }} /><Button title={t('Explorer', 'Explore paths', 'اكتشف المسارات')} onPress={() => router.push('/path')} style={{ flex: stackActions ? undefined : 1, backgroundColor: 'transparent', borderColor: '#54746B', borderRadius: 14, minHeight: 48 }} /></Row>
      </View>
      {wide && <View style={{ flex: 1, justifyContent: 'center' }}><StudioVisual /></View>}
    </View>
    <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap', gap: 0, paddingVertical: 14, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line }}>
      {[
        [String(completed), t('leçons terminées', 'lessons completed', 'دروس مكتملة')],
        [String(due), t('révisions à faire', 'reviews due', 'مراجعات مستحقة')],
        [String(state.bookmarks.length), t('leçons sauvegardées', 'saved lessons', 'دروس محفوظة')],
      ].map(([value, label], i) => <View key={label} style={{ flex: 1, minWidth: 0, paddingHorizontal: 4, gap: 2, alignItems: 'center', borderLeftWidth: i < 2 && rtl ? 1 : 0, borderRightWidth: i < 2 && !rtl ? 1 : 0, borderColor: colors.line }}><Label bold size={22} style={{ lineHeight: 30 }}>{value}</Label><Label muted size={11} style={{ textAlign: 'center' }}>{label}</Label></View>)}
    </Row>
    <PracticeLaunchpad />
    <View style={{ flexDirection: wide ? row : 'column', gap: 20 }}>
      <Card style={{ flex: wide ? 1.15 : undefined, padding: wide ? 24 : 18, gap: 12, borderRadius: 20, shadowOpacity: 0, borderTopWidth: 3, borderTopColor: colors.accent }}>
        <Row style={{ justifyContent: 'space-between' }}><Label bold size={11} style={{ color: colors.accent }}>{t('VOTRE SALLE DE CLASSE', 'YOUR CLASSROOM', 'درسك التالي')}</Label><Ionicons name="book-outline" size={22} color={colors.accent} /></Row>
        <Label muted size={12}>{t(current.title[0], current.title[1], current.title[2])}</Label>
        <Label bold size={21} style={{ lineHeight: 31 }}>{next ? next.title[state.language] : t('Prêt à construire votre projet', 'Ready to build your project', 'جاهز لبناء مشروعك')}</Label>
        <Row style={{ justifyContent: 'space-between' }}><Label muted size={12}>{progress.done} / {progress.total} {t('leçons', 'lessons', 'دروس')}</Label><Label bold size={12} style={{ color: colors.accent }}>{Math.round(progress.done / Math.max(1, progress.total) * 100)}%</Label></Row>
        <ProgressBar value={progress.done / Math.max(1, progress.total)} />
        <Label muted size={12}>{next ? t(`${next.minutes} min de lecture estimée · avancez à votre rythme`, `${next.minutes} min estimated reading · work at your own pace`, `${next.minutes} دقيقة قراءة تقريبًا · تعلّم على إيقاعك`) : t('Les lectures sont terminées. Vérifiez vos acquis dans l’atelier.', 'Readings complete. Demonstrate your skills in the workshop.', 'أكملت القراءة. طبّق المهارات ديالك فالورشة.')}</Label>
        <Button title={next ? t('Continuer la leçon', 'Continue learning', 'تابع تعلّمك') : t('Ouvrir le projet', 'Open project', 'افتح المشروع')} onPress={openNext} icon={rtl ? 'arrow-back-outline' : 'arrow-forward-outline'} />
      </Card>
      <View style={{ flex: wide ? 1 : undefined, backgroundColor: colors.soft, padding: 24, borderRadius: 20, gap: 16 }}>
        <Label bold size={20}>{t('Une séance qui vous ressemble', 'Make time for your next skill', 'وقت صغير. خطوة حقيقية.')}</Label>
        <Label muted size={13}>{t('Choisissez votre temps. Voici une répartition suggérée, sans chronomètre.', 'Choose your time. This is a suggested plan, not a countdown.', 'اختار الوقت المناسب. هادي خطة مقترحة بلا مؤقّت.')}</Label>
        <Row style={{ gap: 8 }}>{[15, 30, 60].map(minutes => <Button key={minutes} quiet selected={budget === minutes} title={`${minutes} ${t('min', 'min', 'دقيقة')}`} onPress={() => update(p => ({ ...p, drafts: { ...p.drafts, 'studio:minutes': String(minutes) } }))} style={{ flex: 1, paddingHorizontal: 8, borderRadius: 10 }} />)}</Row>
        {[
          [t('Comprendre une idée', 'Understand one idea', 'فهم فكرة واحدة'), Math.round(budget * 0.4), openNext],
          [t('Essayer dans le projet', 'Try it in your project', 'جرّب فالمشروع'), Math.round(budget * 0.4), () => openCourse(current.id, 'practice')],
          [t('Rappeler et réviser', 'Recall and review', 'تذكّر وراجع'), budget - 2 * Math.round(budget * 0.4), () => router.push('/knowledge')],
        ].map(([title, minutes, action], i) => <Pressable key={i} accessibilityRole="button" accessibilityLabel={String(title)} onPress={action as () => void} style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, paddingVertical: 8, minHeight: 48 })}><Row style={{ flexWrap: 'nowrap' }}><Label bold size={12} style={{ color: colors.accent }}>{String(i + 1).padStart(2, '0')}</Label><Label size={14} style={{ flex: 1 }}>{String(title)}</Label><Label muted size={12}>{String(minutes)} {t('min', 'min', 'د')}</Label><Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={colors.accent} /></Row></Pressable>)}
      </View>
    </View>
    <Row style={{ justifyContent: 'space-between' }}><View style={{ gap: 3 }}><Label bold size={23} accessibilityRole="header">{t('Votre prochain chapitre', 'Your next chapter', 'الفصل القادم من رحلتك')}</Label><Label muted size={13}>{t('Des fondations à vos propres créations.', 'From solid foundations to your own creations.', 'من أساسيات واضحة إلى مشاريعك الخاصة.')}</Label></View><Button variant="ghost" title={t('Tout explorer', 'Browse all', 'عرض الكل')} onPress={() => router.push('/path')} /></Row>
    <View style={{ flexDirection: wide ? row : 'column', gap: 16 }}>{library.filter(c => ['academy-foundations', 'python', 'real-site'].includes(c.id)).map((course, i) => {
      const p = courseProgress(course, state.completed, state.lastLesson);
      const tones = ['#183F35', '#313650', '#5A4330'];
      return <Pressable key={course.id} accessibilityRole="button" accessibilityLabel={t(course.title[0], course.title[1], course.title[2])} onPress={() => openCourse(course.id)} style={({ pressed }) => ({ flex: wide ? 1 : undefined, borderWidth: 1, borderColor: colors.line, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 })}>
        <View style={{ width: '100%', aspectRatio: 1.8, overflow: 'hidden', backgroundColor: tones[i] }}>
          <Image source={coursePhotos[course.id]} resizeMode="cover" accessible={false} style={{ width: '100%', height: '100%' }} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ backgroundColor: 'rgba(12, 30, 27, 0.88)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Label bold size={10} style={{ color: '#F0E6C8', letterSpacing: 1.5, writingDirection: 'ltr' }}>ACADEMY / {String(i + 1).padStart(2, '0')}</Label>
            </View>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(12, 30, 27, 0.88)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={course.icon} size={22} color="#F0E6C8" />
            </View>
          </View>
        </View>
        <View style={{ flex: 1, padding: 20, gap: 12, backgroundColor: colors.card }}>
          <Label bold size={20} style={{ lineHeight: 30 }}>{t(course.title[0], course.title[1], course.title[2])}</Label>
          <Label muted size={13} style={{ lineHeight: 23 }}>{t(course.summary[0], course.summary[1], course.summary[2])}</Label>
          <Row style={{ justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Label muted size={12}>{p.total} {t('leçons', 'lessons', 'دروس')}</Label>
            <View style={{ flexDirection: row, alignItems: 'center', gap: 6, backgroundColor: colors.soft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
              <Label bold size={12} style={{ color: colors.accent }}>{t('Voir le parcours', 'View course', 'اكتشف الدورة')}</Label>
              <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={colors.accent} />
            </View>
          </Row>
          {p.started && <ProgressBar value={p.done / Math.max(1, p.total)} />}
        </View>
      </Pressable>;
    })}</View>
    <View style={{ gap: 14 }}><Label bold size={21}>{t('Votre boîte à outils', 'Your learning toolkit', 'أدواتك للتعلّم')}</Label><Row style={{ gap: 10 }}>{([
      ['sparkles-outline', t('Mon professeur', 'AI professor', 'أستاذي الذكي'), '/teacher'],
      ['search-outline', t('Rechercher', 'Search lessons', 'ابحث عن درس'), '/search'],
      ['code-slash-outline', t('Mes projets', 'My projects', 'مشاريعي'), '/project'],
      ['document-text-outline', t('Mon carnet', 'My notes', 'ملاحظاتي'), '/collection/notes'],
    ] as const).map(([icon, title, route]) => <Button key={route} quiet icon={icon as React.ComponentProps<typeof Ionicons>['name']} title={title} onPress={() => router.push(route as '/teacher')} style={{ flexGrow: 1, borderRadius: 12 }} />)}</Row></View>
    <Card style={{ backgroundColor: colors.soft, gap: 10 }}>
      <Label bold size={21}>{t('Explorez un téléphone en 3D', 'Explore a phone in 3D', 'اكتشف الهاتف بثلاثة أبعاد')}</Label>
      <Label muted>{t('Touchez les composants et découvrez iPhone et Android, du matériel aux apps.', 'Tap the parts and learn about iPhone and Android, from hardware to apps.', 'اضغط على المكوّنات وتعلّم كيفاش كيخدم iPhone وAndroid، من العتاد للتطبيقات.')}</Label>
      <Button icon="phone-portrait-outline" title={t('Ouvrir le labo téléphone', 'Open phone lab', 'افتح مختبر الهاتف')} onPress={() => router.push('/phone-lab')} />
    </Card>
    <Card style={{ backgroundColor: colors.soft, gap: 10 }}>
      <Label bold size={21}>{t('À l’intérieur de votre PC', 'Inside your computer', 'اكتشف شنو داخل الحاسوب')}</Label>
      <Label muted>{t('Ouvrez la tour, tournez les pièces en 3D et découvrez le rôle de chaque composant.', 'Open the tower, rotate parts in 3D and learn what each component does.', 'افتح الصندوق، دوّر القطع بثلاثة أبعاد وتعلّم دور كل مكوّن.')}</Label>
      <Button icon="desktop-outline" title={t('Ouvrir le labo PC', 'Open PC lab', 'افتح مختبر الحاسوب')} onPress={() => router.push('/pc-lab')} />
    </Card>
    <DailyRoutineCard compact />
    {next && <LearningReminder lessonId={next.id} />}
    <ConnectionStatus />
  </Page>;
}
