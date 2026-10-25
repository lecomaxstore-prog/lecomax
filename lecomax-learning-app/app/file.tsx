import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Label, Page, Row } from '../components/UI';
import { CodeViewer } from '../components/CodeViewer';
import { project, getSource, resolveImport } from '../services/content';
import { useSchool } from '../store/School';
export default function File() {
  const { path, line } = useLocalSearchParams<{ path: string; line?: string }>();
  return <FileContent key={`${path}:${line || ''}`} path={path} line={line} />;
}
function FileContent({ path, line }: { path: string; line?: string }) {
  const { state, t, rtl } = useSchool();
  const [page, setPage] = useState(() => {
    const requested = Number(line);
    const total = getSource(path)?.content.split('\n').length || 1;
    return Number.isFinite(requested) ? Math.floor((Math.min(total, Math.max(1, requested)) - 1) / 100) : 0;
  });
  const f = project.find((f) => f.path === path);
  const source = getSource(path);
  return (
    <Page title={path?.split('/').pop() || 'Source'} subtitle={path}>
      {f && source ? (
        <>
          <Card>
            <Label>{f.description[state.language]}</Label>
            {!!f.route && <Label>Route: {f.route}</Label>}
            <Label muted size={12}>
              SHA256: {f.hash.slice(0, 16)} · {f.lines} lines
            </Label>
          </Card>
          <CodeViewer
            key={`${path}-${page}`}
            code={source.content
              .split('\n')
              .slice(page * 100, (page + 1) * 100)
              .join('\n')}
            filename={path}
            start={page * 100 + 1}
          />
          <Row>
            <Button
              quiet
              disabled={!page}
              title={rtl ? '100 →' : '← 100'}
              onPress={() => setPage(page - 1)}
            />
            <Label>
              {page + 1} / {Math.ceil(f.lines / 100)}
            </Label>
            <Button
              quiet
              disabled={(page + 1) * 100 >= f.lines}
              title={rtl ? '← 100' : '100 →'}
              onPress={() => setPage(page + 1)}
            />
          </Row>
          <Card>
            <Label bold>{t('Importe', 'Imports', 'يستورد')}</Label>
            {f.imports.map((s, i) =>
              resolveImport(path, s) ? (
                <Button
                  key={i}
                  quiet
                  title={s}
                  onPress={() =>
                    router.push({ pathname: '/file', params: { path: resolveImport(path, s)! } })
                  }
                />
              ) : (
                <Label key={i} size={13}>
                  {s}
                </Label>
              ),
            )}
            <Label bold>{t('Utilisé par', 'Used by', 'يُستخدم في')}</Label>
            {f.importedBy.map((s) => (
              <Button
                key={s}
                quiet
                title={s}
                onPress={() => {
                  setPage(0);
                  router.setParams({ path: s });
                }}
              />
            ))}
          </Card>
          <Button
            disabled={!/^(app|lib|components)\/.+\.(tsx?|jsx?)$/.test(path)}
            title={t('Expliquer avec AI Teacher', 'Ask AI Teacher', 'اشرح مع الأستاذ الذكي')}
            onPress={() => router.push({ pathname: '/(tabs)/teacher', params: { file: path } })}
          />
        </>
      ) : (
        <Card>
          <Label>
            {t(
              'Ce fichier est absent du snapshot ou exclu par le contrôle des données sensibles.',
              'This file is absent from the snapshot or excluded by sensitive data checks.',
              'هذا الملف غير موجود في النسخة أو استُبعد لحماية البيانات السرية.',
            )}
          </Label>
        </Card>
      )}
    </Page>
  );
}
