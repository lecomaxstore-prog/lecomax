import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { router } from 'expo-router';
import { Button, Page, ListItem, EmptyState } from '../../components/UI';
import { SearchBar } from '../../components/LearningUI';
import { project, normalized } from '../../services/content';
import { useSchool } from '../../store/School';
export default function Explorer() {
  const [folder, setFolder] = useState('');
  const [q, setQ] = useState('');
  const { t } = useSchool();
  const entries = q
    ? project
        .filter((f) => normalized(f.path).includes(normalized(q)))
        .map((f) => ({ path: f.path, isFolder: false }))
    : [
        ...new Set(
          project
            .filter((f) => f.path.startsWith(folder))
            .map((f) => folder + f.path.slice(folder.length).split('/')[0]),
        ),
      ]
        .sort()
        .map((p) => ({ path: p, isFolder: project.some((f) => f.path.startsWith(p + '/')) }));
  return (
    <Page
      scroll={false}
      title={t('Explore mon projet', 'Explore my project', 'استكشف مشروعي')}
      subtitle={t(
        'Du fichier au fonctionnement.',
        'From files to understanding.',
        'من الملف إلى فهم طريقة العمل.',
      )}
    >
      <Button
        icon="globe-outline"
        title={t('Mon site L’ECOMAX — explorer et apprendre', 'My L’ECOMAX site — explore and learn', 'موقعي L’ECOMAX — استكشف وتعلّم')}
        onPress={() => router.push('/my-site')}
      />
      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder={t('Fichier ou dossier', 'File or folder', 'ملف أو مجلد')}
      />
      {!!folder && (
        <Button
          quiet
          title={`↑ ${folder}`}
          onPress={() =>
            setFolder(
              folder.split('/').slice(0, -2).join('/') + (folder.split('/').length > 2 ? '/' : ''),
            )
          }
        />
      )}
      <FlatList
        style={{ flex: 1 }}
        data={entries}
        keyExtractor={(f) => f.path}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <ListItem
            icon={item.isFolder ? 'folder-outline' : 'code-slash-outline'}
            title={item.path.split('/').pop() || item.path}
            subtitle={item.path}
            onPress={() =>
              item.isFolder
                ? setFolder(item.path + '/')
                : router.push({ pathname: '/file', params: { path: item.path } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title={t('Aucun fichier', 'No files found', 'لا توجد ملفات')}
          />
        }
      />
    </Page>
  );
}
