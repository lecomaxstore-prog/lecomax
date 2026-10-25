import { useLocalSearchParams } from 'expo-router';
import { courses } from '../../constants/courses';
import { index } from '../../services/content';
import { useSchool } from '../../store/School';
import { Page } from '../../components/UI';
import { CourseOverview } from '../../components/CourseOverview';
import { CourseWorkspace } from '../../components/CourseWorkspace';

export default function Course() {
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const course = courses.find(c => c.id === id);
  const { t } = useSchool();
  if (!course) return <Page title={t('Cours introuvable', 'Course not found', 'الدورة غير موجودة')} />;
  const modules = course.modules.flatMap(id => {
    const module = index.find(m => m.id === id);
    return module ? [module] : [];
  });
  const lessons = [...new Map(modules.flatMap(m => m.lessons).map(l => [l.id, l])).values()];
  return <Page title={t(course.title[0], course.title[1], course.title[2])} compactSpacing header={<CourseOverview course={course} lessons={lessons} />}>
    <CourseProgram courseId={course.id} />
    <CourseWorkspace key={course.id + ':' + (section || 'lessons')} course={course} modules={modules} requestedSection={section} />
  </Page>;
}
import { CourseProgram } from '../../components/CourseProgram';
