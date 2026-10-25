import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { normalized } from '../services/content';
import type { IndexModule } from '../types/content';
import { Button, Card, Label, Row } from './UI';
import { SearchBar } from './LearningUI';
import { teacherLessonRoute } from '../services/teacher-navigation';

export function CourseLessonList({
  modules,
  courseId,
}: {
  modules: IndexModule[];
  courseId?: string;
}) {
  const { state, t, colors, rtl } = useSchool();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'remaining' | 'completed'>('all');
  const all = [...new Map(modules.flatMap((m) => m.lessons).map((l) => [l.id, l])).values()];
  const words = normalized(query).split(/\s+/).filter(Boolean);
  const visible = modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => {
        const text = normalized(module.title[state.language] + ' ' + lesson.title[state.language]);
        const completed = state.completed.includes(lesson.id);
        return (
          words.every((word) => text.includes(word)) &&
          (filter === 'all' || (filter === 'completed' ? completed : !completed))
        );
      }),
    }))
    .filter((module) => module.lessons.length);
  return (
    <View style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Label bold size={20} accessibilityRole="header">
          {t('Toutes les leçons', 'All course lessons', 'جميع دروس الدورة')}
        </Label>
        <Label muted size={12}>
          {all.length} {t('leçons', 'lessons', 'درسًا')}
        </Label>
      </Row>
      <Label muted size={13}>
        {t(
          'Ouvrez une leçon. Votre progression reste enregistrée sur cet appareil.',
          'Open any lesson. Your progress is kept on this device.',
          'افتح أي درس. يُحفظ تقدّمك على هذا الجهاز.',
        )}
      </Label>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t(
          'Rechercher dans les leçons…',
          'Search course lessons…',
          'ابحث في دروس الدورة…',
        )}
      />
      <Row style={{ gap: 8 }}>
        {(
          [
            { id: 'all', title: t('Tout', 'All', 'الكل'), count: all.length },
            {
              id: 'remaining',
              title: t('À terminer', 'Remaining', 'المتبقي'),
              count: all.filter((l) => !state.completed.includes(l.id)).length,
            },
            {
              id: 'completed',
              title: t('Terminé', 'Completed', 'المكتمل'),
              count: all.filter((l) => state.completed.includes(l.id)).length,
            },
          ] as const
        ).map((item) => (
          <Button
            key={item.id}
            quiet
            selected={filter === item.id}
            title={`${item.title} · ${item.count}`}
            onPress={() => setFilter(item.id)}
            style={{ borderRadius: 10, paddingHorizontal: 12 }}
          />
        ))}
      </Row>
      {visible.map((module) => (
        <Card
          key={module.id}
          style={{ padding: 16, gap: 12, borderRadius: 18, shadowOpacity: 0, elevation: 0 }}
        >
          <Row
            style={{
              flexWrap: 'nowrap',
              alignItems: 'flex-start',
              gap: 12,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            }}
          >
            <View
              style={{
                backgroundColor: colors.soft,
                borderRadius: 8,
                paddingHorizontal: 9,
                paddingVertical: 5,
              }}
            >
              <Label bold size={12} style={{ color: colors.accent }}>
                {String(modules.findIndex((m) => m.id === module.id) + 1).padStart(2, '0')}
              </Label>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Label bold size={15}>
                {module.title[state.language]}
              </Label>
              <Label muted size={11}>
                {t('Module', 'Module', 'الوحدة')} ·{' '}
                {
                  modules
                    .find((m) => m.id === module.id)!
                    .lessons.filter((l) => state.completed.includes(l.id)).length
                }
                /{modules.find((m) => m.id === module.id)!.lessons.length}{' '}
                {t('terminées', 'completed', 'مكتملة')}
              </Label>
            </View>
          </Row>
          {module.lessons.map((lesson, lessonIndex) => {
            const completed = state.completed.includes(lesson.id);
            const started =
              !completed &&
              (state.lastLesson === lesson.id || state.stages[lesson.id] !== undefined);
            const status = completed
              ? t('Terminé', 'Completed', 'مكتمل')
              : started
                ? t('En cours', 'In progress', 'قيد التعلّم')
                : t('À commencer', 'Not started', 'لم تبدأ بعد');
            return (
              <View key={lesson.id} style={{ gap: 2, paddingBottom: 8 }}>
                {lessonIndex > 0 && (
                  <View
                    pointerEvents="none"
                    style={{
                      width: 2,
                      height: 16,
                      backgroundColor: colors.line,
                      marginLeft: rtl ? undefined : 26,
                      marginRight: rtl ? 26 : undefined,
                      alignSelf: rtl ? 'flex-end' : 'flex-start',
                    }}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${lesson.title[state.language]} · ${status}`}
                  onPress={() =>
                    router.push({
                      pathname: '/lesson/[id]',
                      params: { id: lesson.id, course: courseId },
                    })
                  }
                  style={({ pressed }) => ({
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    minHeight: 76,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: started ? colors.accent : 'transparent',
                    backgroundColor: pressed || started ? colors.soft : colors.bg,
                  })}
                >
                  <Row style={{ flexWrap: 'nowrap', gap: 12 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 11,
                        backgroundColor: completed || started ? colors.soft : colors.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {completed ? (
                        <Ionicons name="checkmark-circle" size={25} color={colors.accent} />
                      ) : (
                        <Label bold size={14} style={{ color: colors.accent }}>
                          {all.findIndex((l) => l.id === lesson.id) + 1}
                        </Label>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                      <Label bold size={15}>
                        {lesson.title[state.language]}
                      </Label>
                      <Label
                        size={12}
                        style={{ color: completed || started ? colors.accent : colors.muted }}
                      >
                        {status} · {lesson.minutes} {t('min', 'min', 'دقيقة')}
                      </Label>
                    </View>
                    <Ionicons
                      name={rtl ? 'chevron-back' : 'chevron-forward'}
                      size={17}
                      color={colors.muted}
                    />
                  </Row>
                </Pressable>
                <Button
                  variant="ghost"
                  icon="sparkles-outline"
                  title={t('Expliquer cette leçon', 'Explain this lesson', 'اشرح لي هذا الدرس')}
                  onPress={() =>
                    router.push(
                      teacherLessonRoute(lesson.title[state.language], state.language, lesson.id),
                    )
                  }
                />
              </View>
            );
          })}
        </Card>
      ))}
      {!visible.length && (
        <Card>
          <Label muted>
            {all.length
              ? t('Aucune leçon trouvée.', 'No matching lessons.', 'لا توجد دروس مطابقة.')
              : t(
                  'Les leçons de ce sujet ne sont pas encore publiées.',
                  'Lessons for this topic have not been published yet.',
                  'لم تُنشر دروس هذا الموضوع بعد.',
                )}
          </Label>
          {(!!query || filter !== 'all') && (
            <Button
              quiet
              title={t('Effacer la recherche', 'Clear search', 'مسح البحث')}
              onPress={() => {
                setQuery('');
                setFilter('all');
              }}
            />
          )}
        </Card>
      )}
    </View>
  );
}
