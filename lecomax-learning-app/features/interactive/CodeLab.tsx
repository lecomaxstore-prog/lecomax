import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Label, Row } from '../../components/UI';
import { useSchool } from '../../store/School';
import { CodeEditor } from './CodeEditor';
import { Runtime, type RunRequest } from './Runtime';
import { Preview } from './Preview';
import { Mentor } from './Mentor';
import { readSaved, sqlExamples, starters, type RunResult } from './model';
import { studioActions } from './presentation';
export function CodeLab({ language, project = '' }: { language: string; project?: string }) {
  const { state, update, error, colors, t } = useSchool();
  const key = `interactive:code:${project || language}`;
  const copy = (value: string) => studioActions[value] ? t(...studioActions[value]) : value;
  const code = state.drafts[key] ?? starters[language] ?? '';
  const change = (value: string) =>
    update((p) => ({ ...p, drafts: { ...p.drafts, [key]: value.slice(0, 32000) } }));
  const [panel, setPanel] = useState('Editor');
  const [font, setFont] = useState(15);
  const [fullscreen, setFullscreen] = useState(false);
  const [details, setDetails] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);
  const [request, setRequest] = useState<RunRequest | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('');
  const [narrow, setNarrow] = useState(true);
  const [hint, setHint] = useState(false);
  const runs = useRef<number[]>([]);
  const lastRun = useRef('');
  const history = readSaved<{ at: string; code: string; result: RunResult }[]>(
    state.drafts[`${key}:runs`],
    [],
  );
  const stop = () => {
    setRequest(null);
    setNotice('Execution cancelled. No grade was awarded.');
  };
  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(() => {
      setRequest(null);
      setNotice('Runtime did not respond within 12 seconds. Stopped; retry.');
    }, 12000);
    return () => clearTimeout(timer);
  }, [request]);
  const receive = (r: RunResult) => {
    if (!request) return;
    setResult(r);
    setRequest(null);
    setPanel('Output');
    const entry = { at: new Date().toISOString(), code: lastRun.current, result: r };
    update((p) => ({
      ...p,
      drafts: {
        ...p.drafts,
        [`${key}:runs`]: JSON.stringify(
          [entry, ...readSaved<typeof history>(p.drafts[`${key}:runs`], [])].slice(0, 10),
        ),
        ...(r.tests.length
          ? {
              [`${key}:grade`]: JSON.stringify({
                at: entry.at,
                passed: !r.error && r.tests.every((test) => test.passed),
                tests: r.tests,
                code: lastRun.current,
              }),
            }
          : {}),
      },
    }));
  };
  const run = (test: boolean) => {
    if (request) return;
    const now = Date.now();
    runs.current = runs.current.filter((time) => now - time < 60000);
    if (runs.current.length >= 12) {
      setNotice('Local quota: 12 runs per minute. Wait briefly before retrying.');
      return;
    }
    runs.current.push(now);
    lastRun.current = code;
    setNotice('');
    setResult(null);
    setRequest({ id: now, code, language, test });
    setPanel('Output');
  };
  const web = language === 'web';
  const guided = language === 'react';
  const editor = (
    <View style={{ gap: 12, backgroundColor: colors.bg, flex: 1 }}>
      <Row>
        <Button
          quiet
          title={copy("Smaller text")}
          disabled={font <= 12}
          onPress={() => setFont(font - 1)}
        />
        <Label>{font}px</Label>
        <Button quiet title={copy("Larger text")} disabled={font >= 24} onPress={() => setFont(font + 1)} />
        <Button
          quiet
          title={copy(fullscreen ? 'Close fullscreen' : 'Fullscreen editor')}
          onPress={() => setFullscreen(!fullscreen)}
        />
      </Row>
      <CodeEditor value={code} onChange={change} language={language} fontSize={font} />
    </View>
  );
  return (
    <View style={{ gap: 16 }}>
      <Button variant="ghost" icon="information-circle-outline" expanded={details}
        title={t('À propos de cet environnement', 'About this runtime', 'حول بيئة التشغيل')}
        onPress={() => setDetails(!details)} />
      {details && <View style={{ gap: 8, padding: 16, borderRadius: 14, backgroundColor: colors.soft }}>
      <Label muted size={13}>
        {web
          ? 'HTML and CSS preview. Scripts and external resources are disabled.'
          : guided
            ? 'Real React initial rendering inside QuickJS. Preview is static: event handlers are not hydrated. Next.js remains a guided source exercise, not a running server.'
            : language === 'sql'
              ? 'Real SQLite. Each run uses a new sample database; no connection to application data.'
              : 'Isolated QuickJS: 16 MB heap, 1.5-second execution budget. No browser, filesystem, network or Node APIs.'}
      </Label>
      {language === 'typescript' && (
        <Label muted>
          TypeScript is transpiled before execution. Syntax diagnostics are shown; full project type
          checking is not included.
        </Label>
      )}
      </View>}
      <Row style={{ backgroundColor: colors.neutral, padding: 6, borderRadius: 18 }}>
        {['Editor', 'Output', 'Exercise', 'Mentor'].map((tab) => (
          <Button
            key={tab}
            quiet
            selected={panel === tab}
            title={copy(tab)}
            onPress={() => setPanel(tab)}
          />
        ))}
      </Row>
      {panel === 'Editor' && !fullscreen && editor}
      <Modal visible={fullscreen} animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setFullscreen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, flexGrow: 1, backgroundColor: colors.bg }}
        >
          {fullscreen && editor}
        </ScrollView>
        </SafeAreaView>
      </Modal>
      {panel === 'Editor' && (
        <Row>
          <Button
            quiet
            title={copy("Save snapshot")}
            onPress={() => {
              update((p) => ({ ...p, drafts: { ...p.drafts, [`${key}:saved`]: code } }));
              setNotice('Snapshot saved in learning progress.');
            }}
          />
          <Button
            quiet
            title={copy("Load snapshot")}
            disabled={state.drafts[`${key}:saved`] === undefined}
            onPress={() => change(state.drafts[`${key}:saved`] ?? '')}
          />
          <Button
            quiet
            title={copy("Reset to example")}
            onPress={() => {
              update((p) => ({
                ...p,
                drafts: { ...p.drafts, [`${key}:saved`]: code, [key]: starters[language] || '' },
              }));
              setNotice('Previous code saved as a snapshot before reset.');
            }}
          />
          <Button
            quiet
            title={copy("Copy code")}
            onPress={() => {
              void Clipboard.setStringAsync(code).then(
                () => setNotice('Copied.'),
                () => setNotice('Copy unavailable. Select the code.'),
              );
            }}
          />
        </Row>
      )}
      {
        <Row>
          <Button
            icon={request ? 'hourglass-outline' : 'play-outline'} title={copy(request
                ? 'Running…'
                : web
                  ? 'Preview page'
                  : guided
                    ? 'Render React component'
                    : 'Run code')}
            disabled={!!request}
            onPress={() => {
              if (web) {
                setPreview(code);
                setPanel('Output');
              } else run(false);
            }}
          />
          {!web && !guided && (
            <Button
              quiet
              title={copy("Run exercise tests")}
              disabled={!!request}
              onPress={() => run(true)}
            />
          )}
          {!!request && <Button title={copy("Stop code")} onPress={stop} />}
        </Row>
      }
      {!!notice && <Label accessibilityLiveRegion="polite">{notice}</Label>}
      {!!error && <Label>{error}</Label>}
      {panel === 'Output' && (
        <Card>
          <Row>
            <Button
              quiet
              title={copy("Clear output")}
              onPress={() => {
                setResult(null);
                setPreview('');
              }}
            />
            <Button
              quiet
              title={copy("Copy output")}
              disabled={!result}
              onPress={() => {
                void Clipboard.setStringAsync(JSON.stringify(result, null, 2));
              }}
            />
          </Row>
          {request && (
            <Label accessibilityLiveRegion="polite">
              Executing your code in a separate worker…
            </Label>
          )}
          {web && !!preview && (
            <>
              <Button
                quiet
                title={narrow ? 'Widen preview' : 'Phone preview'}
                onPress={() => setNarrow(!narrow)}
              />
              <Preview code={preview} narrow={narrow} />
            </>
          )}
          {guided && result && !result.error && <Preview code={result.output} narrow={narrow} />}
          {result && (
            <>
              <Label selectable style={{ fontFamily: 'monospace', writingDirection: 'ltr', textAlign: 'left', lineHeight: 24 }}>
                {result.output || '(no console output)'}
              </Label>
              {!!result.error && (
                <Label selectable style={{ color: colors.danger }}>
                  {result.error}
                </Label>
              )}
              {result.tests.map((test) => (
                <Label
                  key={test.label}
                  style={{ color: test.passed ? colors.accent : colors.danger }}
                >
                  {test.passed ? 'PASS' : 'FAIL'} · {test.label} · actual: {test.actual}
                </Label>
              ))}
              {result.tables.map((table, i) => (
                <ScrollView horizontal key={i}>
                  <View>
                    <Row>
                      {table.columns.map((column, c) => (
                        <Label bold key={c} style={{ width: 140 }}>
                          {column}
                        </Label>
                      ))}
                    </Row>
                    {table.values.map((row, r) => (
                      <Row key={r}>
                        {row.map((cell, c) => (
                          <Label selectable key={c} style={{ width: 140 }}>
                            {cell === null ? 'NULL' : String(cell)}
                          </Label>
                        ))}
                      </Row>
                    ))}
                  </View>
                </ScrollView>
              ))}
            </>
          )}
          {!result && !preview && !request && <Label>Run your code to see actual results.</Label>}
          <Label bold>Saved execution history</Label>
          {history.map((entry, i) => (
            <Button
              quiet
              key={`${entry.at}-${i}`}
              title={`${entry.at} · ${entry.result.error ? 'Error' : 'Completed'} · restore source`}
              onPress={() => {
                change(entry.code);
                setResult(entry.result);
                setNotice('Restored source and its historical result; edits require a new run.');
              }}
            />
          ))}
        </Card>
      )}
      {panel === 'Exercise' && (
        <Card>
          <Label bold>
            {web
              ? 'Build a personal website'
              : guided
                ? 'Build a counter component'
                : language === 'sql'
                  ? 'Find the Rabat customers'
                  : 'Implement square(n)'}
          </Label>
          <Label>
            {web
              ? 'Include a meaningful heading, a paragraph, a button and a responsive layout. Use Preview to inspect at phone and wide sizes. Visual review is manual.'
              : guided
                ? 'Edit the starter component. Explain how useState preserves count and how the click handler updates it. For Next.js, add a client component boundary and explain why event handlers need it. Use your configured external development environment for runtime verification.'
                : language === 'sql'
                  ? "Return one name column containing Amina then Sara. Filter city = 'Rabat' and order by id. Tests compare real query rows."
                  : 'Return n multiplied by itself. Tests execute square with positive, negative, zero and fractional inputs. Passing these practice tests is not a security certification.'}
          </Label>
          <Button quiet title={copy("Show hint / compare solution")} onPress={() => setHint(!hint)} />
          {hint && (
            <Label selectable>
              {language === 'sql'
                ? "SELECT name FROM customers WHERE city = 'Rabat' ORDER BY id;"
                : web
                  ? 'Use max-width: 100%; avoid fixed desktop widths.'
                  : guided
                    ? 'Use setCount(value => value + 1). Next.js app-router client components start with a use client directive.'
                    : 'return n * n; // ^ is not exponentiation in JavaScript'}
            </Label>
          )}
          {language === 'sql' && (
            <>
              <Label bold>Schema explorer</Label>
              <Label selectable>
                customers(id INTEGER PRIMARY KEY, name TEXT, city TEXT){'\n'}orders(id INTEGER
                PRIMARY KEY, customer_id → customers.id, total REAL){'\n'}One customer can have
                multiple orders, so a JOIN may repeat the customer name.
              </Label>
              {sqlExamples.map(([name, query]) => (
                <Button
                  quiet
                  key={name}
                  title={`Load ${name} example`}
                  onPress={() => {
                    change(query);
                    setPanel('Editor');
                  }}
                />
              ))}
            </>
          )}
        </Card>
      )}
      {panel === 'Mentor' && (
        <Mentor
          context={`Studio: ${language}\nLinked lesson: ${state.lastLesson || 'none'}\nSource:\n${code.slice(0, 6500)}\nActual last run (may precede edits):\n${result ? JSON.stringify(result).slice(0, 2500) : 'Not executed in this session.'}`}
        />
      )}
      {!web && <Runtime request={request} onResult={receive} />}
    </View>
  );
}
