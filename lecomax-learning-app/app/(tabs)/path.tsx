import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, EmptyState, Page, Row } from '../../components/UI';
import { LearningPathCard, SearchBar } from '../../components/LearningUI';
import { useSchool } from '../../store/School';
import { index, normalized } from '../../services/content';
import { CurriculumLibrary } from '../../components/CurriculumLibrary';
export default function Path() {
  const { state, t } = useSchool();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('curriculum');
  const { collection } = useLocalSearchParams<{ collection?: string }>();
  const academy = collection === 'website';
  if (!academy && kind === 'curriculum') return <CurriculumLibrary onBrowse={() => setKind('course')} />;
  return (
    <Page
      scroll={false}
      title={
        academy
          ? t('Comment mon site a été construit', 'How my site was built', 'كيف تم بناء موقعي')
          : t('Mon parcours', 'My learning path', 'مساري')
      }
      subtitle={
        academy
          ? t(
              'Les mêmes modules et leçons que sur le site.',
              'The same modules and lessons as the website.',
              'نفس الوحدات والدروس الموجودة على الموقع.',
            )
          : `${index.length} ${t('modules · Zero → Hero', 'modules · Zero → Hero', 'وحدة · من الصفر إلى الاحتراف')}`
      }
    >
      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder={t('Trouver un module', 'Find a module', 'ابحث عن وحدة')}
      />
      {academy ? (
        <Button
          quiet
          title={t('Tous les parcours', 'All learning paths', 'كل مسارات التعلّم')}
          onPress={() => { setKind('curriculum'); router.setParams({ collection: '' }); }}
        />
      ) : (
        <Row>
          {(
            [
              ['curriculum', t('Programme', 'Curriculum', 'الخريطة')],
              ['course', t('Cours', 'Courses', 'الدروس')],
              ['reference', t('Références', 'References', 'المراجع')],
              ['archive', t('Archives', 'Archives', 'الأرشيف')],
            ] as const
          ).map(([value, title]) => (
            <Button
              key={value}
              quiet
              selected={kind === value}
              title={title}
              onPress={() => setKind(value)}
            />
          ))}
        </Row>
      )}
      <FlatList
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        data={index
          .filter((m) => (academy ? m.academy : (m.kind || 'course') === kind))
          .filter((m) =>
            normalized(m.title[state.language] + ' ' + m.summary[state.language]).includes(
              normalized(q),
            ),
          )}
        keyExtractor={(m) => m.id}
        renderItem={({ item: m, index: i }) => {
          const done = m.lessons.filter((l) => state.completed.includes(l.id)).length;
          return (
            <LearningPathCard
              compact
              title={m.title[state.language]}
              description={m.summary[state.language]}
              meta={
                String(i + 1).padStart(2, '0') +
                ' · ' +
                done +
                ' / ' +
                m.lessons.length +
                ' ' +
                t('leçons', 'lessons', 'درسًا')
              }
              progress={done / Math.max(m.lessons.length, 1)}
              tone={i % 3 === 1 ? 'violet' : i % 3 === 2 ? 'amber' : 'green'}
              action={t('Explorer', 'Explore', 'استكشف')}
              onPress={() => router.push({ pathname: '/module/[id]', params: { id: m.id } })}
            />
          );
        }}
        ListEmptyComponent={<EmptyState title={t('Aucun module', 'No modules', 'لا توجد وحدات')} />}
      />
    </Page>
  );
}
