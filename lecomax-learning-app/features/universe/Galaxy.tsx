import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { Button, Card, Field, Label, Page, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { library } from '../../services/course-library';
import { getLesson } from '../../services/content';
import { skillState, skillLabels } from './model';
export default function Galaxy() {
  const { state, t, colors, rtl } = useSchool();
  const { fontScale } = useWindowDimensions();
  const [courseId, setCourseId] = useState(
    library.find((c) => c.lessons.some((l) => l.id === state.lastLesson))?.id || library[0]?.id,
  );
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState('');
  const course = library.find((c) => c.id === courseId);
  const nodes = useMemo(
    () =>
      (course?.lessons || []).map((l) => ({
        ...l,
        prerequisites: getLesson(l.id, state.language)?.academy?.prerequisites || [],
      })),
    [course, state.language],
  );
  const shown = nodes.slice(offset, offset + 10);
  const active = nodes.find((n) => n.id === selected);
  const open = (id: string) =>
    router.push({ pathname: '/lesson/[id]', params: { id, course: courseId } });
  return (
    <Page
      wide
      title={t('Galaxie du savoir', 'Knowledge Galaxy', 'مجرة المعرفة')}
      subtitle={t(
        'Chaque idée ouvre une nouvelle voie.',
        'Every idea opens another path.',
        'كل فكرة تفتح مساراً جديداً.',
      )}
    >
      <Card style={{ backgroundColor: colors.hero }}>
        <Label bold size={28} style={{ color: colors.onPrimary }}>
          {course
            ? t(course.title[0]!, course.title[1]!, course.title[2]!)
            : t('Choisissez une constellation', 'Choose a constellation', 'اختر كوكبة معرفية')}
        </Label>
        <Label style={{ color: colors.heroText }}>
          {t(
            'Explorez les connexions. Le rappel répété, pas le temps passé, construit les preuves.',
            'Explore the connections. Repeated recall, not time spent, builds evidence.',
            'استكشف الروابط. الاسترجاع المتكرر، لا الوقت وحده، يبني الدليل.',
          )}
        </Label>
      </Card>
      <Button
        quiet
        expanded={choosing}
        title={t('Changer de constellation', 'Change constellation', 'غيّر الكوكبة')}
        onPress={() => setChoosing(!choosing)}
      />
      {choosing && (
        <>
          <Field
            value={query}
            onChangeText={setQuery}
            placeholder={t('Rechercher un cours', 'Find a course', 'ابحث عن دورة')}
          />
          <Row>
            {library
              .filter(
                (c) =>
                  c.lessons.length &&
                  c.title.join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()),
              )
              .map((c) => (
                <Button
                  key={c.id}
                  quiet
                  selected={c.id === courseId}
                  title={t(c.title[0]!, c.title[1]!, c.title[2]!)}
                  onPress={() => {
                    setCourseId(c.id);
                    setOffset(0);
                    setSelected('');
                    setChoosing(false);
                  }}
                />
              ))}
          </Row>
        </>
      )}
      <Label muted>
        {t(
          'Trait plein : prérequis déclaré. Pointillé : ordre conseillé du cours. Les prérequis restent consultables.',
          'Solid line: declared prerequisite. Dotted: suggested course order. Prerequisites can always be opened.',
          'خط متصل: متطلب سابق معلن. متقطع: ترتيب مقترح. يمكنك فتح المتطلبات السابقة دائماً.',
        )}
      </Label>
      {!!shown.length && (
        <Card>
          <Svg
            width="100%"
            height={Math.ceil(shown.length / 2) * 80 + 30}
            viewBox={`0 0 300 ${Math.ceil(shown.length / 2) * 80 + 30}`}
            accessibilityLabel={t(
              'Carte interactive des concepts',
              'Interactive concept map',
              'خريطة مفاهيم تفاعلية',
            )}
          >
            {shown.flatMap((node, i) => {
              const parents = node.prerequisites
                .map((id) => shown.findIndex((n) => n.id === id))
                .filter((n) => n >= 0);
              const links = parents.length ? parents : i ? [i - 1] : [];
              return links.map((parent) => (
                <Line
                  key={`${node.id}:${parent}`}
                  x1={rtl ? (parent % 2 ? 80 : 220) : parent % 2 ? 220 : 80}
                  y1={Math.floor(parent / 2) * 80 + 40}
                  x2={rtl ? (i % 2 ? 80 : 220) : i % 2 ? 220 : 80}
                  y2={Math.floor(i / 2) * 80 + 40}
                  stroke={colors.accent}
                  strokeWidth={2}
                  strokeDasharray={parents.length ? undefined : '3 6'}
                />
              ));
            })}
            {shown.map((node, i) => {
              const status = skillState(state, node.id, node.prerequisites);
              const fill = {
                locked: colors.neutral,
                available: colors.soft,
                progress: colors.violetSoft,
                mastered: colors.accent,
                review: colors.amberSoft,
              }[status];
              const stroke = {
                locked: colors.muted,
                available: colors.accent,
                progress: colors.violet,
                mastered: colors.accent,
                review: colors.amber,
              }[status];
              return (
                <React.Fragment key={node.id}>
                  <Circle
                    cx={rtl ? (i % 2 ? 80 : 220) : i % 2 ? 220 : 80}
                    cy={Math.floor(i / 2) * 80 + 40}
                    r={23}
                    fill={selected === node.id ? colors.accent : fill}
                    stroke={stroke}
                    strokeWidth={selected === node.id ? 4 : 2}
                    strokeDasharray={status === 'locked' ? '3 3' : undefined}
                    onPress={() => setSelected(node.id)}
                    accessibilityLabel={`${node.title[state.language]} · ${t(...skillLabels[status])}`}
                  />
                  <SvgText
                    pointerEvents="none"
                    x={rtl ? (i % 2 ? 80 : 220) : i % 2 ? 220 : 80}
                    y={Math.floor(i / 2) * 80 + 45}
                    textAnchor="middle"
                    fill={selected === node.id || status === 'mastered' ? colors.card : colors.text}
                    fontSize={14}
                  >
                    {offset + i + 1}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
          <Label muted size={12}>
            {t(
              'Touchez un nœud puis ouvrez sa fiche ci-dessous.',
              'Tap a node, then open its details below.',
              'اضغط على عقدة ثم افتح تفاصيلها أدناه.',
            )}
          </Label>
        </Card>
      )}
      {shown.map((node, i) => {
        const status = skillState(state, node.id, node.prerequisites);
        const declared = i > 0 && node.prerequisites.includes(shown[i - 1]!.id);
        return (
          <View
            key={node.id}
            style={{
              gap: 8,
              marginStart: fontScale > 1.3 ? 0 : i % 2 ? 28 : 0,
              marginEnd: fontScale > 1.3 ? 0 : i % 2 ? 0 : 28,
            }}
          >
            {i > 0 && (
              <Svg width="100%" height={32} accessible={false}>
                <Line
                  x1="50%"
                  y1={0}
                  x2="50%"
                  y2={32}
                  stroke={colors.accent}
                  strokeWidth={2}
                  strokeDasharray={declared ? undefined : '3 5'}
                />
                <Circle cx="50%" cy={16} r={4} fill={colors.gold} />
              </Svg>
            )}
            <Card
              style={{
                borderColor: selected === node.id ? colors.accent : colors.line,
                backgroundColor: status === 'mastered' ? colors.soft : colors.card,
              }}
            >
              <Row style={{ flexWrap: 'nowrap' }}>
                <Label size={26} bold style={{ color: colors.accent }}>
                  {String(offset + i + 1).padStart(2, '0')}
                </Label>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Label bold size={20}>
                    {node.title[state.language]}
                  </Label>
                  <Label muted size={12}>
                    {t(...skillLabels[status])}
                  </Label>
                </View>
              </Row>
              <Button
                quiet
                selected={selected === node.id}
                title={t('Explorer ce concept', 'Explore this concept', 'استكشف هذا المفهوم')}
                onPress={() => setSelected(selected === node.id ? '' : node.id)}
              />
              {active?.id === node.id && (
                <>
                  <Label>
                    {t(
                      'Leçon disponible hors ligne. La maîtrise exige une leçon terminée et au moins deux rappels espacés réussis pour chaque question évaluée.',
                      'Lesson available offline. Mastery requires completion and at least two successful spaced recalls for every assessed question.',
                      'درس متاح دون اتصال. يتطلب الإتقان إكمال الدرس واسترجاعين متباعدين صحيحين لكل سؤال مقيّم.',
                    )}
                  </Label>
                  {node.prerequisites.map((id) => (
                    <Button
                      key={id}
                      quiet
                      icon={rtl ? 'arrow-back' : 'arrow-forward'}
                      title={getLesson(id, state.language)?.title || id}
                      onPress={() => open(id)}
                    />
                  ))}
                  <Button
                    title={
                      status === 'locked'
                        ? t('Aperçu de la leçon', 'Preview lesson', 'معاينة الدرس')
                        : t('Entrer dans la leçon', 'Enter lesson', 'افتح الدرس')
                    }
                    onPress={() => open(node.id)}
                  />
                </>
              )}
            </Card>
          </View>
        );
      })}
      {!shown.length && (
        <Label>
          {t(
            'Aucune leçon publiée dans cette collection.',
            'No published lessons in this collection.',
            'لا توجد دروس منشورة في هذه المجموعة.',
          )}
        </Label>
      )}
      <Row>
        <Button
          quiet
          disabled={offset === 0}
          title={t('Précédent', 'Previous constellation', 'الكوكبة السابقة')}
          onPress={() => {
            setOffset((v) => Math.max(0, v - 10));
            setSelected('');
          }}
        />
        <Button
          quiet
          disabled={offset + 10 >= nodes.length}
          title={t('Suivant', 'Next constellation', 'الكوكبة التالية')}
          onPress={() => {
            setOffset((v) => v + 10);
            setSelected('');
          }}
        />
      </Row>
    </Page>
  );
}
