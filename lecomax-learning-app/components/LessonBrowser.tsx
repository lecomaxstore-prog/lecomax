import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { lessonSequence } from '../services/course-navigation';
import { Label, Row } from './UI';

export function LessonBrowser({ id, course }: { id: string; course?: string }) {
  const { state, colors, rtl, t } = useSchool();
  const sequence = lessonSequence(course, id);
  if (!sequence) return null;
  const { lessons, position } = sequence;
  return <Pressable accessibilityRole="button" accessibilityLabel={t('Toutes les leçons du cours', 'All course lessons', 'جميع دروس الدورة')}
    onPress={() => router.push({ pathname: sequence.courseId?.startsWith('path:') ? '/learning-path/[id]' : sequence.courseId ? '/course/[id]' : '/module/[id]', params: { id: sequence.courseId?.replace(/^path:/, '') || sequence.moduleId } })}
    style={({ pressed }) => ({ paddingVertical: 10, minHeight: 48, opacity: pressed ? 0.7 : 1 })}>
    <Row style={{ justifyContent: 'space-between', gap: 8 }}>
      <Row style={{ gap: 6 }}>
        <Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} color={colors.accent} size={18} />
        <Label bold size={13} style={{ color: colors.accent }}>{t('Toutes les leçons', 'All course lessons', 'جميع دروس الدورة')}</Label>
      </Row>
      <Label muted size={12}>{t('Leçon ', 'Lesson ', 'الدرس ') + (position + 1) + t(' sur ', ' of ', ' من ') + lessons.length}{state.completed.includes(id) ? ' ✓' : ''}</Label>
    </Row>
  </Pressable>;
}
