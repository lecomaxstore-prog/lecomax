import React, { useDeferredValue, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { phaseTitles } from '../data/university/curriculum';
import { searchPaths, pathLessons } from '../services/curriculum';
import { useSchool } from '../store/School';
import { Button, Card, EmptyState, Label, Page, Row } from './UI';
import { LearningPathCard, SearchBar } from './LearningUI';
import { teacherLessonRoute } from '../services/teacher-navigation';
import { StudioVisual } from './StudioVisual';

export function CurriculumLibrary({ onBrowse }: { onBrowse: () => void }) {
  const { state, t, colors, rtl } = useSchool();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.5;
  const [showPhases, setShowPhases] = useState(false);
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query);
  const [phase, setPhase] = useState(-1);
  const [availableOnly, setAvailableOnly] = useState(true);
  const resumePath = searchPaths('', state.language).find(p => pathLessons(p).some(l => l.id === state.lastLesson) && !state.completed.includes(state.lastLesson));
  const resumeLesson = resumePath && pathLessons(resumePath).find(l => l.id === state.lastLesson);
  const paths = searchPaths(search, state.language).filter(p =>
    (phase === -1 || p.phase === phase) && (!availableOnly || pathLessons(p).length > 0));
  return (
    <Page wide scroll={false} title={t('Votre parcours', 'Your learning path', 'مسارك للتعلّم')} header={false} compactSpacing>
      <FlatList key={wide ? 'grid' : 'list'} numColumns={wide ? 2 : 1} columnWrapperStyle={wide ? { gap: 16, flexDirection: rtl ? 'row-reverse' : 'row' } : undefined} style={{ flex: 1 }} data={paths} keyExtractor={p => p.id}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        ListHeaderComponent={<View style={{ gap: 18, paddingBottom: 8 }}>
          <View style={{ gap: 20, padding: wide ? 30 : 22, borderRadius: 24, backgroundColor: colors.hero, flexDirection: wide ? (rtl ? 'row-reverse' : 'row') : 'column' }}>
          <View style={{ flex: 1, gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Label bold size={12} style={{ color: colors.heroGold }}>{t('APPRENDRE & CONSTRUIRE', 'LEARN & BUILD', 'تعلّم وطبّق')}</Label>
              <Button icon="library-outline" title={t('Bibliothèque', 'Library', 'المكتبة')} onPress={onBrowse} style={{ backgroundColor: colors.heroAccent, borderRadius: 12 }} />
            </Row>
            <Label accessibilityRole="header" bold size={wide ? 36 : 28} style={{ color: colors.onPrimary }}>{t('La programmation, pas à pas', 'Your programming path', 'مسارك لتعلّم البرمجة')}</Label>
            <Label size={14} style={{ color: colors.heroText }}>{t('Des bases à l’IA. Un sujet à la fois, à votre rythme.', 'From the basics to AI. One topic at a time, at your pace.', 'من الأساسيات إلى الذكاء الاصطناعي. خطوة بخطوة، على إيقاعك.')}</Label>
          </View>
          {wide && <View style={{ flex: 0.8, justifyContent: 'center' }}><StudioVisual compact /></View>}
          </View>
          {!query && phase === -1 && <View style={{ gap: 10 }}>
            {resumeLesson && resumePath && <Card style={{ padding: 16, gap: 8, backgroundColor: colors.soft, shadowOpacity: 0, elevation: 0 }}>
              <Label bold size={14}>{t('Reprendre votre leçon', 'Pick up where you left off', 'أكمل من حيث توقفت')}</Label>
              <Label size={14}>{resumeLesson.title[state.language]}</Label>
              <Button icon="play-circle-outline" title={t('Continuer', 'Continue learning', 'متابعة التعلّم')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: resumeLesson.id, course: 'path:' + resumePath.id } })} />
            </Card>}
            <Label bold size={15}>{t('Que voulez-vous apprendre ?', 'What would you like to learn?', 'ماذا تريد أن تتعلّم؟')}</Label>
            <Row style={{ gap: 6 }}>
              {([
                [0, t('Partir de zéro', 'Start from zero', 'أبدأ من الصفر')],
                [1, t('Créer un site', 'Build a website', 'أبني موقعًا')],
                [4, t('Comprendre l’IA', 'Understand AI', 'أفهم الذكاء الاصطناعي')],
              ] as const).map(([id, label]) => <Button key={id} quiet title={label} style={{ flexGrow: 1, paddingHorizontal: 10 }} onPress={() => { setPhase(id); setAvailableOnly(true); }} />)}
            </Row>
            <Button variant="ghost" icon="sparkles-outline" title={t('Aide-moi à choisir', 'Help me choose', 'ساعدني على الاختيار')} onPress={() => router.push(teacherLessonRoute(t('apprendre la programmation', 'learning programming', 'تعلّم البرمجة'), state.language, undefined, 'plan'))} />
          </View>}
          <View style={{ gap: 10 }}>
            <SearchBar value={query} onChangeText={setQuery} placeholder={t('Rechercher un sujet…', 'Search for a topic…', 'ابحث عن موضوع…')} />
            <Row style={{ flexWrap: 'nowrap', gap: 6, padding: 4, borderRadius: 16, backgroundColor: colors.neutral }}>
              <Button quiet selected={!availableOnly} style={{ flex: 1, paddingHorizontal: 8 }} title={t('Tous les sujets', 'All topics', 'كل المواضيع')} onPress={() => setAvailableOnly(false)} />
              <Button quiet selected={availableOnly} style={{ flex: 1, paddingHorizontal: 8 }} title={t('Disponibles', 'Available now', 'متاحة الآن')} onPress={() => setAvailableOnly(true)} />
            </Row>
            <Button quiet icon={showPhases ? 'chevron-up' : 'options-outline'} title={phaseTitles[phase]?.[state.language] ?? t('Toutes les étapes', 'All learning phases', 'كل مراحل التعلّم')} onPress={() => setShowPhases(value => !value)} />
            {showPhases && <View style={{ gap: 6 }}>
              <Button quiet selected={phase === -1} title={t('Toutes les étapes', 'All learning phases', 'كل مراحل التعلّم')} onPress={() => { setPhase(-1); setShowPhases(false); }} />
              {phaseTitles.map((label, i) => <Button key={i} quiet selected={phase === i} title={label[state.language]} onPress={() => { setPhase(i); setShowPhases(false); }} />)}
            </View>}
          </View>
          <Row style={{ justifyContent: 'space-between' }}>
            <Label bold size={17}>{t('Explorez les sujets', 'Explore the topics', 'اكتشف المواضيع')}</Label>
            <Label muted size={12} accessibilityLiveRegion="polite">{paths.length} {t('sujets', 'topics', 'موضوعًا')}</Label>
          </Row>
        </View>}
        renderItem={({ item }) => {
          const lessons = pathLessons(item);
          const done = lessons.filter(l => state.completed.includes(l.id)).length;
          return <View style={{ flex: 1, minWidth: 0 }}><LearningPathCard compact title={item.title[state.language]}
            description={item.syllabus.slice(0, 2).join(' · ')}
            icon={(['desktop-outline', 'code-slash-outline', 'server-outline', 'phone-portrait-outline', 'sparkles-outline', 'construct-outline'] as const)[item.phase]}
            meta={lessons.length ? t(`${done} sur ${lessons.length} leçons terminées`, `${done} of ${lessons.length} lessons completed`, `أكملت ${done} من ${lessons.length} دروس`) : t('Programme prévu · leçons à venir', 'Planned topic · lessons coming later', 'موضوع مخطّط · الدروس لم تُنشر بعد')}
            progress={lessons.length ? done / lessons.length : 0}
            showProgress={lessons.length > 0 && done > 0}
            tone={item.phase > 3 ? 'violet' : item.phase > 1 ? 'amber' : 'green'} action={t('Explorer', 'Explore', 'استكشف')}
            onPress={() => router.push({ pathname: '/learning-path/[id]', params: { id: item.id } })} /></View>;
        }}
        ListEmptyComponent={<View style={{ gap: 12 }}><EmptyState title={t('Aucun parcours', 'No matching paths', 'لا توجد مسارات مطابقة')} description={t('Essayez un autre mot ou une autre étape.', 'Try another term or phase.', 'جرّب كلمة أخرى أو مرحلة مختلفة.')} /><Button quiet title={t('Réinitialiser les filtres', 'Reset filters', 'إعادة ضبط الفلاتر')} onPress={() => { setQuery(''); setPhase(-1); setAvailableOnly(false); }} /></View>} />
    </Page>
  );
}
