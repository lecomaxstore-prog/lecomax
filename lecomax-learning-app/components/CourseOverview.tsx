import { View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSchool } from '../store/School';
import { Button, Label, ProgressBar, Row } from './UI';
import type { IndexModule } from '../types/content';
import { courses } from '../constants/courses';
import { courseLearning } from '../services/course-learning';

export function CourseOverview({
  course,
  lessons,
}: {
  course: (typeof courses)[number];
  lessons: IndexModule['lessons'];
}) {
  const { state, colors, t, rtl } = useSchool();
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const done = lessons.filter((l) => state.completed.includes(l.id)).length;
  const { next, started } = courseLearning({ ...course, lessons }, state);
  const minutes = lessons.reduce((sum, l) => sum + l.minutes, 0);
  const remaining = lessons
    .filter((l) => !state.completed.includes(l.id))
    .reduce((sum, l) => sum + l.minutes, 0);
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const duration = (value: number) =>
    `${Math.floor(value / 60)} ${t('h', 'h', 'س')} ${value % 60} ${t('min', 'min', 'د')}`;

  return (
    <View
      style={{
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <View
        style={{
          backgroundColor: colors.hero,
          padding: compact ? 26 : 36,
          gap: 24,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            width: 250,
            height: 250,
            borderRadius: 125,
            borderWidth: 1,
            borderColor: '#FFFFFF0D',
            top: -105,
            [rtl ? 'left' : 'right']: -95,
          }}
        />
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Row style={{ flexWrap: 'nowrap', gap: 9, flexShrink: 1 }}>
            <Ionicons name={course.icon} size={20} color="#E7C78F" />
            <Label
              bold
              size={10}
              style={{ color: '#E7C78F', letterSpacing: 1.8, writingDirection: 'ltr' }}
            >
              ACADEMY
            </Label>
          </Row>
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: '#FFFFFF12',
            }}
          >
            <Label size={11} style={{ color: '#D9EBE4' }}>
              {t('Formation', 'Course', 'دورة تعليمية')}
            </Label>
          </View>
        </Row>
        <View style={{ gap: 10 }}>
          <Label
            accessibilityRole="header"
            bold
            size={compact ? 27 : 34}
            style={{ color: '#FFFFFF', lineHeight: compact ? 40 : 49 }}
          >
            {t(course.title[0], course.title[1], course.title[2])}
          </Label>
          <Label size={14} style={{ color: '#C1D7CF', lineHeight: 25 }}>
            {t(course.summary[0], course.summary[1], course.summary[2])}
          </Label>
        </View>
        <Row style={{ borderTopWidth: 1, borderTopColor: '#FFFFFF20', paddingTop: 17, gap: 18 }}>
          {[
            {
              icon: 'book-outline' as const,
              text: `${lessons.length} ${t('leçons', 'lessons', 'دروس')}`,
            },
            {
              icon: 'time-outline' as const,
              text: `${duration(minutes)} · ${t('estimé', 'estimated', 'تقريبًا')}`,
            },
            { icon: 'code-slash-outline' as const, text: t('Pratique', 'Hands-on', 'تطبيق عملي') },
          ].map((item) => (
            <Row key={item.icon} style={{ gap: 6 }}>
              <Ionicons name={item.icon} size={15} color="#E7C78F" />
              <Label size={12} style={{ color: '#E2EEE9' }}>
                {item.text}
              </Label>
            </Row>
          ))}
        </Row>
      </View>
      <View style={{ padding: compact ? 20 : 28, gap: 18 }}>
        <Row style={{ flexWrap: 'nowrap', gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: colors.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Label bold size={21} style={{ color: colors.accent }}>
              {percent}%
            </Label>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Label bold size={15}>
              {t('Votre parcours', 'Your learning journey', 'رحلتك التعليمية')}
            </Label>
            <Label muted size={12}>
              {t(
                `${done} sur ${lessons.length} leçons terminées`,
                `${done} of ${lessons.length} lessons completed`,
                `${done} من ${lessons.length} دروس مكتملة`,
              )}
            </Label>
            <ProgressBar value={lessons.length ? done / lessons.length : 0} />
          </View>
        </Row>
        {next ? (
          <>
            <View
              style={{
                padding: 16,
                gap: 7,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.bg,
              }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Label
                  bold
                  size={10}
                  style={{ color: colors.accent, letterSpacing: rtl ? 0 : 1.3 }}
                >
                  {t('VOTRE PROCHAINE LEÇON', 'YOUR NEXT LESSON', 'درسك التالي')}
                </Label>
                <Row style={{ gap: 4 }}>
                  <Ionicons name="time-outline" size={13} color={colors.muted} />
                  <Label muted size={11}>
                    {next.minutes} {t('min', 'min', 'دقيقة')}
                  </Label>
                </Row>
              </Row>
              <Label bold size={16}>
                {next.title[state.language]}
              </Label>
            </View>
            <Button
              icon="play-circle"
              title={
                started
                  ? t('Continuer ce cours', 'Continue this course', 'تابع هذه الدورة')
                  : t('Commencer ce cours', 'Start this course', 'ابدأ هذه الدورة')
              }
              style={{ borderRadius: 12, minHeight: 52 }}
              onPress={() =>
                router.push({
                  pathname: '/lesson/[id]',
                  params: { id: next.id, course: course.id },
                })
              }
            />
            <Label muted size={11} style={{ textAlign: 'center' }}>
              {t(
                `${duration(remaining)} de lecture restante · estimation`,
                `${duration(remaining)} of reading remaining · estimated`,
                `${duration(remaining)} من القراءة المتبقية · تقريبًا`,
              )}
            </Label>
          </>
        ) : (
          <Row
            style={{
              backgroundColor: colors.soft,
              padding: 14,
              borderRadius: 12,
              flexWrap: 'nowrap',
            }}
          >
            <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
            <Label bold size={14} style={{ flex: 1 }}>
              {lessons.length
                ? t(
                    'Lectures terminées. Place à la pratique !',
                    'Readings complete. Put your skills into practice!',
                    'أكملت القراءة. حان وقت التطبيق!',
                  )
                : t(
                    'Le contenu arrive bientôt',
                    'Course content is coming soon',
                    'محتوى الدورة قريبًا',
                  )}
            </Label>
          </Row>
        )}
      </View>
    </View>
  );
}
