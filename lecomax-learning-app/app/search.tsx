import React, { useDeferredValue, useState } from 'react';
import { FlatList } from 'react-native';
import { router, type Href } from 'expo-router';
import { Button, Label, Page, ListItem, EmptyState, Row } from '../components/UI';
import { personalSearch, subjects } from '../services/discovery';
import { openLearningItem } from '../components/AcademyDashboard';
import { project, searchLessons, normalized } from '../services/content';
import { SearchBar } from '../components/LearningUI';
import { useSchool } from '../store/School';
import { searchPaths, pathLessons } from '../services/curriculum';
import { glossaryEntries } from '../services/glossary';
export default function Search() {
  const [q, setQ] = useState('');
  const query = useDeferredValue(q);
  const { state, update, t } = useSchool();
  const [conversation, setConversation] = useState('');
  const remember = () => { const value = q.trim().slice(0, 500); if (value) update(p => ({ ...p, academy: { ...p.academy, recentSearches: [value, ...p.academy.recentSearches.filter(x => x !== value)].slice(0, 12) } })); };
  const found = query.trim()
    ? [
        ...personalSearch(state, query, state.language),
        ...searchPaths(query, state.language).map(p => ({
          id: p.id, title: p.title[state.language], kind: 'path',
          description: pathLessons(p).length ? t('Parcours · premières leçons disponibles', 'Path · starting lessons available', 'مسار · دروس البداية متاحة') : t('Programme à rédiger', 'Planned curriculum', 'محور مخطّط'),
        })),
        ...glossaryEntries(state.language).filter(term => normalized(term.term + ' ' + term.definition).includes(normalized(query))).map(term => ({
          id: term.term, title: term.term, kind: 'term', description: term.definition,
        })),
        ...searchLessons(query, state.language).map((l) => ({
          id: l.id,
          title: l.title[state.language],
          kind: 'lesson',
          description: t('Leçon · explication, pratique et quiz', 'Lesson · explanation, practice and quiz', 'درس · شرح وتطبيق واختبار'),
        })),
        ...project
          .filter((f) =>
            normalized(f.path + ' ' + f.description[state.language]).includes(normalized(query)),
          )
          .map((f) => ({ id: f.path, title: f.path, kind: 'file', description: t('Code du projet', 'Project code', 'كود المشروع') })),
      ]
    : [];
  return (
    <Page scroll={false} title={t('Tout rechercher', 'Search everything', 'ابحث في كل شيء')}>
      <SearchBar value={q} onChangeText={value => { setQ(value); setConversation(''); }} placeholder={t('Sujet, cours, note, conversation…', 'Subject, course, note, conversation…', 'موضوع، دورة، ملاحظة، محادثة…')} />
      {!query.trim() && <Row>{(state.academy.recentSearches.length ? state.academy.recentSearches : subjects.slice(0, 3).map(s => t(s.title[0], s.title[1], s.title[2]))).map(value => <Button key={value} quiet title={value} onPress={() => setQ(value)} />)}</Row>}
      {!!query.trim() && <Button quiet title={t('Apprendre ce sujet avec l’IA', 'Learn this topic with AI', 'تعلّم هذا الموضوع مع المعلّم')} onPress={() => { remember(); router.push({ pathname: '/study-plan', params: { goal: q } }); }} />}
      {!!conversation && <Label selectable>{conversation}</Label>}
      <Label muted>
        {found.length} {t('résultats', 'results', 'نتيجة')}
      </Label>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10 }}
        data={found}
        keyExtractor={(f) => f.kind + ':' + f.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListItem
            icon={item.kind === 'file' ? 'code-slash-outline' : item.kind === 'path' ? 'map-outline' : item.kind === 'term' ? 'text-outline' : 'book-outline'}
            title={item.title}
            highlightQuery={query}
            subtitle={item.description}
            onPress={() => {
              remember();
              if (item.kind === 'conversation') { setConversation(state.teacher.history[Number(item.id)]?.content || ''); return; }
              if (item.kind === 'note') { openLearningItem(item.id); return; }
              if (item.kind === 'tool') { router.push(item.id as Href); return; }
              if (item.kind === 'plan') { router.push({ pathname: '/study-plan', params: { id: item.id } }); return; }
              if (item.kind === 'subject') { router.push({ pathname: '/explore', params: { subject: item.id } }); return; }
              return item.kind === 'path'
                ? router.push({ pathname: '/learning-path/[id]', params: { id: item.id } })
                : item.kind === 'term'
                ? router.push({ pathname: '/definition/[term]', params: { term: item.id } })
                : item.kind === 'file'
                ? router.push({ pathname: '/file', params: { path: item.id } })
                : router.push({ pathname: '/lesson/[id]', params: { id: item.id } });
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={
              query
                ? t('Aucun résultat', 'No results', 'لا توجد نتائج')
                : t('Une idée, un début.', 'Every idea starts here.', 'كل فكرة لها بداية.')
            }
            description={t(
              'Cherche un concept, un extrait ou un fichier.',
              'Search a concept, excerpt or file.',
              'ابحث عن فكرة أو كود أو ملف.',
            )}
          />
        }
      />
    </Page>
  );
}
