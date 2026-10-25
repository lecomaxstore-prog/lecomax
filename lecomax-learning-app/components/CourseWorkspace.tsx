import { useState } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Label, Row } from './UI';
import { useSchool } from '../store/School';
import { courseGuidance } from '../constants/course-guidance';
import type { courses } from '../constants/courses';
import type { IndexModule } from '../types/content';
import { CourseLessonList } from './CourseLessonList';
import { CourseWorkshop } from './CourseWorkshop';
import { LessonTeacherHelp } from './LessonTeacherHelp';
import { IptvCoursePlan } from './IptvCoursePlan';

export function CourseWorkspace({ course, modules, requestedSection }: { course: (typeof courses)[number]; modules: IndexModule[]; requestedSection?: string }) {
  const { t, colors } = useSchool();
  const [section, setSection] = useState<'lessons' | 'practice' | 'prepare'>(requestedSection === 'practice' || requestedSection === 'prepare' ? requestedSection : 'lessons');
  const guidance = courseGuidance[course.id];
  return <View style={{ gap: 22 }}>
    <View style={{ gap: 10, paddingHorizontal: 4 }}>
      <Row style={{ gap: 8 }}>
        <Ionicons name="flag-outline" size={18} color={colors.accent} />
        <Label bold size={12} style={{ color: colors.accent }}>{t('VOTRE OBJECTIF', 'WHAT YOU WILL BUILD', 'شنو غادي تنجز')}</Label>
      </Row>
      <Label size={16}>{t(...guidance.outcome)}</Label>
    </View>
    <Row style={{ gap: 6, padding: 6, borderRadius: 16, backgroundColor: colors.neutral }}>
      {([
        ['lessons', t('Leçons', 'Lessons', 'الدروس'), 'book-outline'],
        ['practice', t('Pratique', 'Practice', 'التطبيق'), 'hammer-outline'],
        ['prepare', t('Préparation', 'Preparation', 'الاستعداد'), 'compass-outline'],
      ] as const).map(([id, title, icon]) => <Button key={id} quiet selected={section === id} title={title} icon={icon} onPress={() => setSection(id)} style={{ flexGrow: 1, borderRadius: 11, paddingHorizontal: 10 }} />)}
    </Row>
    <View style={{ display: section === 'lessons' ? 'flex' : 'none', gap: 20 }}>
      <CourseLessonList modules={modules} courseId={course.id} />
      <Card style={{ backgroundColor: colors.soft, shadowOpacity: 0, elevation: 0 }}>
        <Label bold size={17}>{t('Transformez la lecture en savoir-faire', 'Turn your reading into a working project', 'حوّل اللي تعلمتي لمشروع خدام')}</Label>
        <Label muted size={14}>{t('Construisez, testez et expliquez vos choix dans l’atelier de cette formation.', 'Build, test, and explain your decisions in this course’s project workshop.', 'ابنِ وجرّب وفسّر الاختيارات ديالك فورشة هاد الدورة.')}</Label>
        <Button quiet icon="hammer-outline" title={t('Découvrir le projet', 'Explore the project', 'اكتشف المشروع')} onPress={() => setSection('practice')} />
      </Card>
    </View>
    <View style={{ display: section === 'practice' ? 'flex' : 'none', gap: 20 }}>
      <CourseWorkshop courseId={course.id} />
      {course.id === 'iptv-live' && <IptvCoursePlan />}
    </View>
    <View style={{ display: section === 'prepare' ? 'flex' : 'none', gap: 20 }}>
      <Card>
        <Label bold size={20} accessibilityRole="header">{t('Avant de commencer', 'Before you start', 'قبل ما تبدا')}</Label>
        <Label size={15}>{t(...guidance.prerequisite)}</Label>
      </Card>
      <Card style={{ shadowOpacity: 0, elevation: 0 }}>
        <Label bold size={18}>{t('Une méthode, trois étapes', 'A practical learning method', 'طريقة عملية للتعلّم')}</Label>
        {[
          [t('Comprendre', 'Understand', 'فهم'), t('Lisez une leçon et reformulez l’idée avec vos mots.', 'Read a lesson and explain the idea in your own words.', 'قرا الدرس وشرح الفكرة بالكلمات ديالك.')],
          [t('Construire', 'Build', 'طبّق'), t('Essayez l’exercice et gardez une trace de votre résultat.', 'Try the exercise and keep a record of your result.', 'جرّب التمرين وسجّل النتيجة ديالك.')],
          [t('Vérifier', 'Verify', 'تحقّق'), t('Testez le résultat, comparez la revue et corrigez votre travail.', 'Test the result, compare the worked review, and improve your work.', 'اختبر النتيجة وقارن مع المراجعة وصحّح الخدمة ديالك.')],
        ].map(([title, detail], i) => <Row key={title} style={{ flexWrap: 'nowrap', alignItems: 'flex-start', paddingVertical: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}><Label bold size={13} style={{ color: colors.accent }}>{i + 1}</Label></View>
          <View style={{ flex: 1, gap: 3 }}><Label bold size={15}>{title}</Label><Label muted size={13}>{detail}</Label></View>
        </Row>)}
      </Card>
    </View>
    <LessonTeacherHelp title={t(course.title[0], course.title[1], course.title[2])} />
  </View>;
}
