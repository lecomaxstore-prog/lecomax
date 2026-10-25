import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PythonEditor } from './PythonEditor.web';
import { useSchool } from '../store/School';
import { pythonSandboxDocument, validPythonResult, type PythonOutput } from '../utils/python-sandbox';
import { explainPythonError } from '../utils/python-errors';
import { initialPythonSession, PythonSession, type PythonExecution } from '../utils/python-session';
import { checkPythonAnswer, managePythonFile, pythonDraftKey, pythonExercises, PYTHON_CODE_LIMIT, PYTHON_FILE_PREFIX } from '../utils/python-practice';
import { pythonViewportLayout } from '../utils/python-viewport';
import { pythonStudioCSS } from './python-studio-design';
import { PythonStudioIcon as Icon } from './PythonStudioIcon';

const starter = '# A small calculator\nfirst = float(input("First number: "))\nsecond = float(input("Second number: "))\nprint("Total:", first + second)';
const recoveryPrefix = 'lecomax.python-recovery:';
function readDraft(key: string, fallback: string, drafts: Record<string, string>) {
  try { const value = localStorage.getItem(recoveryPrefix + key); if (value !== null && value.length <= PYTHON_CODE_LIMIT) return value; } catch { /* Progress provides a fallback. */ }
  return (drafts[key] ?? fallback).slice(0, PYTHON_CODE_LIMIT);
}
type Run = PythonExecution & { at: string };
function OrderedOutput({ output, stdout, stderr }: { output?: PythonOutput[]; stdout: string; stderr: string }) {
  const chunks = output?.length ? output : [{ stream: 'stdout', text: stdout }, { stream: 'stderr', text: stderr }];
  return <div className="py-stream py-transcript"><pre aria-label="Python output in execution order">{chunks.map((chunk, index) => <span key={index} data-stream={chunk.stream}>{chunk.text}</span>)}</pre></div>;
}
const outputText = (value: { output?: PythonOutput[]; stdout: string; stderr: string }) => value.output?.length ? value.output.map(chunk => chunk.text).join('') : value.stdout + value.stderr;
function successAdvice(code: string) {
  const advice: ('format' | 'input' | 'functions' | 'names')[] = [];
  if (/print\s*\(\s*["'][^"']+["']\s*,/.test(code)) advice.push('format');
  if (/\binput\s*\(/.test(code) && !/\btry\s*:/.test(code)) advice.push('input');
  if (code.split('\n').filter(line => line.trim()).length >= 8 && !/\bdef\s+/.test(code)) advice.push('functions');
  if (/\b(first|second|total|result|value)\b/.test(code)) advice.push('names');
  return advice.length ? advice : ['functions'];
}
type Props = { seed?: string; active: boolean; onExplain: (prompt: string) => void; onClose?: () => void; onDraft?: (key: string, code: string) => void; onCopy?: (text: string) => Promise<void>; environmentControl?: React.ReactNode };
export function PythonStudio(props: Props) {
  const { ready, error, retry, t } = useSchool();
  return ready ? <LoadedPythonStudio key={pythonDraftKey(props.seed)} {...props} /> : <section className="py-ide" aria-label="Python Studio"><style>{pythonStudioCSS}</style><div className="py-card py-loading"><Icon name="python" /><strong>Python Studio</strong><p role={error ? 'alert' : 'status'}>{error || t('Chargement du brouillon…', 'Loading saved draft…', 'تحميل المسودة…')}</p>{error && <button onClick={retry}>{t('Réessayer', 'Retry storage', 'إعادة المحاولة')}</button>}</div></section>;
}
function LoadedPythonStudio({ seed, active, onExplain, onClose, onDraft, onCopy, environmentControl }: Props) {
  const { state, update, error: saveError, retry, t, rtl } = useSchool();
  const copyText = async (text: string) => {
    try {
      if (onCopy) await onCopy(text);
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error('Clipboard unavailable');
      setNotice(t('Texte copié.', 'Text copied.', 'تم نسخ النص.'));
    } catch { setNotice(t('Copie indisponible. Sélectionne le texte.', 'Copy unavailable. Select the text manually.', 'النسخ غير متاح. حدّد النص يدوياً.')); }
  };
  const baseKey = pythonDraftKey(seed);
  const [docKey, setDocKey] = useState(baseKey);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [code, setCode] = useState(() => readDraft(baseKey, seed || starter, state.drafts));
  const [input, setInput] = useState('');
  const [liveInput, setLiveInput] = useState(true);
  const [answer, setAnswer] = useState('');
  const [dark, setDark] = useState(true);
  const [wrap, setWrap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    if (!focusMode) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocusMode(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [focusMode]);
  const [accessory, setAccessory] = useState(true);
  const [followOutput, setFollowOutput] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const liveEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelScroll = useRef({ editor: 0, console: 0, exercises: 0 });
  const [online, setOnline] = useState(typeof navigator === 'undefined' || navigator.onLine !== false);
  const settingsRef = useRef<HTMLDetailsElement>(null);
  const filesRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const editorHost = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(16);
  const [panel, setPanel] = useState<'editor' | 'console' | 'exercises'>('editor');
  const [history, setHistory] = useState<Run[]>(() => {
    try {
      const saved: unknown = JSON.parse(state.drafts['interactive:python:history'] || '[]');
      return Array.isArray(saved) ? saved.filter((r): r is Run => !!r && typeof r.code === 'string' && r.code.length <= 64000 && typeof r.input === 'string' && typeof r.at === 'string' && typeof r.status === 'string' && validPythonResult(r.result)).slice(0, 20) : [];
    } catch { return []; }
  });
  useEffect(() => { update(p => ({ ...p, drafts: { ...p.drafts, 'interactive:python:history': JSON.stringify(history) } })); }, [history, update]);
  const [name, setName] = useState('my-script');
  const [openedFile, setOpenedFile] = useState('');
  const [notice, setNotice] = useState('');
  const [exerciseId, setExerciseId] = useState('greeting');
  const [hint, setHint] = useState(0);
  const [checks, setChecks] = useState<{ label: string; passed: boolean; actual: string; expected: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const session = useRef<PythonSession | null>(null);
  const [runtime, setRuntime] = useState(initialPythonSession);
  const [viewport, setViewport] = useState({ keyboard: false, height: 0, top: 0 });
  const mounted = useRef(true);
  const exercise = pythonExercises.find(item => item.id === exerciseId)!;
  const busy = runtime.busy || checking;
  useEffect(() => { const changed = () => setOnline(navigator.onLine); window.addEventListener('online', changed); window.addEventListener('offline', changed); return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed); }; }, []);
  useEffect(() => {
    const timer = setTimeout(() => update(p => p.drafts[docKey] === code ? p : { ...p, drafts: { ...p.drafts, [docKey]: code } }), 300);
    return () => clearTimeout(timer);
  }, [code, docKey, update]);
  const changeCode = useCallback((value: string) => {
    setCode(value);
    // Native recovery crosses the bridge immediately, before the autosave debounce.
    onDraft?.(docKey, value);
    try { localStorage.setItem(recoveryPrefix + docKey, value); } catch { setNotice('Recovery storage unavailable. Keep this tab open until local progress saves, or export your file.'); }
  }, [docKey, onDraft]);
  const switchDocument = (key: string, fallback: string) => {
    update(p => ({ ...p, drafts: { ...p.drafts, [docKey]: code } }));
    setEditorGeneration(value => value + 1);
    setDocKey(key); setCode(readDraft(key, fallback, state.drafts)); setPanel('editor'); setChecks([]);
  };
  useEffect(() => {
    mounted.current = true; let waiting = false;
    const engine = new PythonSession(message => frame.current?.contentWindow?.postMessage(message, '*'));
    engine.listener = next => { setRuntime(next); if (next.prompt !== null && !waiting) { setPanel('console'); setFollowOutput(true); } waiting = next.prompt !== null; }; session.current = engine;
    const receive = (event: MessageEvent) => { if (event.source === frame.current?.contentWindow) engine.receive(event.data); };
    window.addEventListener('message', receive);
    return () => { mounted.current = false; checkingRef.current = false; engine.dispose(); window.removeEventListener('message', receive); };
  }, []);
  useEffect(() => { if (!active) { checkingRef.current = false; session.current?.stop(); } }, [active]);
  useEffect(() => {
    const visual = window.visualViewport;
    let scheduled = 0;
    const resize = () => {
      const next = pythonViewportLayout(window.innerHeight, visual?.height ?? window.innerHeight, visual?.offsetTop ?? 0);
      setViewport(previous => previous.keyboard === next.keyboard && previous.height === next.height && previous.top === next.top ? previous : next);
    };
    const schedule = () => { if (scheduled) window.cancelAnimationFrame(scheduled); scheduled = window.requestAnimationFrame(resize); };
    resize(); window.addEventListener('resize', schedule); visual?.addEventListener('resize', schedule); visual?.addEventListener('scroll', schedule);
    return () => { if (scheduled) window.cancelAnimationFrame(scheduled); window.removeEventListener('resize', schedule); visual?.removeEventListener('resize', schedule); visual?.removeEventListener('scroll', schedule); };
  }, []);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = panelScroll.current[panel];
  }, [panel]);
  useEffect(() => {
    if (panel !== 'console') return;
    const body = bodyRef.current;
    const end = inputRef.current?.closest('form') || liveEnd.current;
    if (body && end && followOutput) body.scrollTop += end.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom + 16;
  }, [panel, followOutput, runtime.stdout, runtime.stderr, runtime.output, runtime.prompt, history, viewport.height, viewport.top]);
  useEffect(() => {
    if (panel === 'console' && runtime.prompt !== null) inputRef.current?.focus({ preventScroll: true });
  }, [panel, runtime.prompt]);
  const record = useCallback((value: PythonExecution) => { if (mounted.current) setHistory(items => [{ ...value, at: new Date().toISOString() }, ...items].slice(0, 20)); }, [setHistory]);
  const run = useCallback(async () => {
    if (session.current?.state.busy || checkingRef.current || !active || !code.trim()) return;
    setPanel('console'); setAnswer(''); setFollowOutput(true);
    if (window.document.activeElement instanceof window.HTMLElement) window.document.activeElement.blur();
    try { record(await session.current!.run(code, input && !input.endsWith('\n') ? input + '\n' : input, liveInput)); }
    catch (error) { setNotice(String(error)); }
  }, [active, code, input, liveInput, record]);
  const stop = () => { checkingRef.current = false; session.current?.stop(); };
  const checkExercise = async () => {
    if (session.current?.state.busy || checkingRef.current) return;
    checkingRef.current = true; setChecking(true); setChecks([]); setPanel('exercises');
    const snapshot = code, task = exercise, results: typeof checks = [];
    try {
      for (const test of task.cases) {
        if (!checkingRef.current) break;
        const value = await session.current!.run(snapshot + (test.suffix || ''), test.input, false);
        record(value);
        results.push({ label: test.label, passed: checkPythonAnswer(value.result, test.output), actual: value.result.stderr || value.result.stdout, expected: test.output });
        if (mounted.current) setChecks([...results]);
        if (value.result.exitCode === null) break;
      }
      if (checkingRef.current && results.length === task.cases.length) update(p => ({ ...p, answers: { ...p.answers, [`python-practice:${task.id}`]: { lessonId: `python-practice:${task.id}`, questionId: 'isolated-cases', choice: 0, correct: results.every(result => result.passed), attempts: (p.answers[`python-practice:${task.id}`]?.attempts || 0) + 1 } } }));
    } catch (error) { if (mounted.current) setNotice(String(error)); }
    finally { checkingRef.current = false; if (mounted.current) setChecking(false); }
  };
  const fileAction = (action: 'save' | 'rename' | 'delete') => {
    try {
      const filename = action === 'delete' ? openedFile : name;
      if (action === 'save' && state.drafts[PYTHON_FILE_PREFIX + name.trim().replace(/\.py$/i, '')] !== undefined && !window.confirm('Replace the saved contents of this file?')) return;
      if (action === 'delete' && !window.confirm(`Delete ${openedFile}.py? The current editor text is kept as a scratch draft.`)) return;
      managePythonFile(state.drafts, action, filename, code, openedFile); // Validate before updating state.
      update(p => ({ ...p, drafts: { ...managePythonFile(p.drafts, action, filename, code, openedFile), ...(action === 'delete' ? { [baseKey]: code } : {}) } }));
      if (action === 'delete') {
        setOpenedFile(''); setDocKey(baseKey);
        try { localStorage.setItem(recoveryPrefix + baseKey, code); localStorage.removeItem(recoveryPrefix + `python-working:${openedFile}`); } catch {}
      } else {
        const nextName = name.trim().replace(/\.py$/i, ''); setOpenedFile(nextName); setDocKey(`python-working:${nextName}`);
        try { localStorage.setItem(recoveryPrefix + `python-working:${nextName}`, code); } catch {}
      }
      setNotice(action === 'delete' ? 'File deleted; editor text kept.' : action === 'rename' ? 'File renamed. Unsaved editor changes are kept.' : 'File saved locally.');
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
  };
  const exportCode = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/x-python;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = (name.replace(/[^\p{L}\p{N}_-]/gu, '_') || 'practice') + '.py'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const latest = history[0];
  const explanation = useMemo(() => latest ? explainPythonError(latest.result.stderr) : null, [latest]);
  const latestSucceeded = latest?.result.exitCode === 0 && !latest.result.stderr.trim();
  const improvementAdvice = useMemo(() => latestSucceeded ? successAdvice(latest!.code) : [], [latestSucceeded, latest]);
  const saved = Object.keys(state.drafts).filter(key => key.startsWith(PYTHON_FILE_PREFIX)).sort();
  const dirty = state.drafts[docKey] !== code || (!!openedFile && state.drafts[PYTHON_FILE_PREFIX + openedFile] !== code);
  const completed = pythonExercises.filter(item => state.answers[`python-practice:${item.id}`]?.correct).length;
  const showDetails = (ref: React.RefObject<HTMLDetailsElement | null>) => {
    setPanel('editor'); if (menuRef.current) menuRef.current.open = false;
    requestAnimationFrame(() => { if (ref.current) { ref.current.open = true; ref.current.scrollIntoView({ block: 'nearest' }); ref.current.querySelector('summary')?.focus(); } });
  };
  const status = !online && !busy ? t('Hors ligne', 'Offline', 'غير متصل') : !runtime.ready && !busy && runtime.status === 'Ready' ? t('Initialisation', 'Initializing', 'جارٍ التهيئة') : runtime.status === 'Ready' ? t('Prêt', 'Ready', 'جاهز') : runtime.status === 'Running' ? t('En cours', 'Running', 'قيد التشغيل') : runtime.status === 'Completed' ? t('Terminé', 'Completed', 'اكتمل') : runtime.status === 'Loading Python' ? t('Chargement', 'Loading', 'جارٍ التحميل') : runtime.status === 'Waiting for input' ? t('Saisie attendue', 'Waiting for input', 'بانتظار الإدخال') : runtime.status === 'Cancelled' ? t('Annulé', 'Cancelled', 'ملغى') : t('Échec', 'Failed', 'فشل');
  const explain = () => onExplain(`Explain this Python code at ${['beginner', 'intermediate', 'advanced'][state.level - 1]} level. Give a debugging hint before a solution. Distinguish actual output from suggestions.
Explain the error in simple English, include a proposed correction when supported by the traceback, and do not claim the correction was tested.
Code:
${(latest?.code ?? code).slice(0, 3000)}
${latest ? 'Actual browser Python result:\n' + JSON.stringify(latest.result).slice(0, 2500) : 'Not executed.'}`);
  const reviewSuccess = () => onExplain(`Review this Python code as a patient AI teacher. It ran successfully, so do not invent an error. Tell me whether I should write it another way, explain why, and give 2-4 concrete improvements for readability, safety, and Python style. Show a short improved version only when useful. Distinguish advice from the verified output and do not claim any suggested rewrite was tested.\nCode:\n${(latest?.code ?? code).slice(0, 3000)}\nVerified output:\n${latest ? outputText(latest.result).slice(0, 2000) : ''}`);
  const tabLabel = (tab: typeof panel) => tab === 'editor' ? t('Éditeur', 'Editor', 'المحرر') : tab === 'console' ? t('Résultats', 'Console', 'النتائج') : t('Exercices', 'Exercises', 'تمارين');
  return <section className={`py-ide${focusMode ? ' py-focus-mode' : ''}${viewport.keyboard ? ' py-keyboard' : ''}`} data-theme={dark ? 'dark' : 'light'} dir={rtl ? 'rtl' : 'ltr'} aria-label="Python learning workspace" style={{ display: active ? 'flex' : 'none', ...(viewport.height ? { '--py-visible-height': `${viewport.height}px` } : {}), ...(viewport.keyboard ? { '--py-editor-height': `${Math.max(80, viewport.height - 340)}px`, position: 'fixed', top: viewport.top, left: 0, width: '100%', height: viewport.height, zIndex: 1000 } : {}) }}>
    <style>{pythonStudioCSS}</style>
    <header className="py-topbar">
      <div className="py-python"><Icon name="python" /></div>
      <div className="py-brand"><h1 dir="ltr">Python Studio</h1><small>{t('Écris. Exécute. Apprends.', 'Write. Run. Learn.', 'اكتب. شغّل. تعلّم.')}</small></div>
      <div className="py-status" role="status" aria-live="polite" data-error={!online || !['Ready', 'Running', 'Completed', 'Loading Python', 'Waiting for input', 'Cancelled'].includes(runtime.status)}><span className="py-dot" />{status}</div>
      {focusMode && <button className="py-icon-button" onClick={() => setFocusMode(false)} aria-label={t('Quitter le mode concentration', 'Exit focus mode', 'إنهاء وضع التركيز')}><Icon name="close" /></button>}
      {onClose && !focusMode && <button className="py-icon-button" onClick={onClose} aria-label={t('Fermer le studio', 'Close studio', 'إغلاق الورشة')}><Icon name="close" /></button>}
    </header>
    <div className="py-toolbar" aria-label={t('Actions du code', 'Code actions', 'إجراءات الكود')}>
      <button className="py-run" aria-busy={busy} disabled={busy || !runtime.ready || !code.trim()} onClick={() => void run()}><Icon name="run" />{t('Exécuter', 'Run Code', 'تشغيل الكود')}</button>
      <button className="py-stop" hidden={!busy} disabled={!busy} aria-label={t('Arrêter', 'Stop', 'إيقاف')} onClick={stop}><Icon name="stop" /><span>{t('Arrêter', 'Stop', 'إيقاف')}</span></button>
      <button className="py-save" aria-label={t('Enregistrer', 'Save', 'حفظ')} disabled={busy} onClick={() => fileAction('save')}><Icon name="save" /><span>{t('Enregistrer', 'Save', 'حفظ')}</span></button>
      <span className="py-spacer" />
      <details className="py-menu" ref={menuRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === 'Escape' && menuRef.current) { menuRef.current.open = false; menuRef.current.querySelector('summary')?.focus(); } }}>
        <summary aria-label={t('Autres actions', 'More actions', 'إجراءات أخرى')}>⋯</summary>
        <div className="py-menu-body">
          <button onClick={() => showDetails(filesRef)}>{t('Mes fichiers', 'My files', 'ملفاتي')}</button>
          <button onClick={() => showDetails(settingsRef)}>{t('Réglages de l’éditeur', 'Editor settings', 'إعدادات المحرر')}</button>
          <button onClick={exportCode}>{t('Exporter .py', 'Export .py', 'تصدير .py')}</button>
          <button onClick={() => { checkingRef.current = false; session.current?.restart(); if (menuRef.current) menuRef.current.open = false; }}>{t('Redémarrer', 'Restart', 'إعادة التشغيل')}</button>
          <button disabled={busy} onClick={explain}>{t('Professeur IA', 'Ask AI Teacher', 'اسأل المعلّم الذكي')}</button>
          {environmentControl}
          {viewport.keyboard && <button onClick={() => (window.document.activeElement as HTMLElement)?.blur()}>{t('Masquer le clavier', 'Hide keyboard', 'إخفاء لوحة المفاتيح')}</button>}
        </div>
      </details>
    </div>
    <nav className="py-tabs" role="tablist" aria-label={t('Panneaux', 'Workspace panels', 'لوحات الورشة')} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]'));
      const current = tabs.indexOf(event.target as HTMLButtonElement);
      const delta = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + delta + tabs.length) % tabs.length;
      tabs[next]?.click(); tabs[next]?.focus();
    }}>
      {(['editor', 'console', 'exercises'] as const).map(tab => <button key={tab} id={`py-tab-${tab}`} role="tab" aria-label={tabLabel(tab)} aria-selected={panel === tab} tabIndex={panel === tab ? 0 : -1} aria-controls={`py-${tab}`} onClick={() => setPanel(tab)}><Icon name={tab === 'editor' ? 'code' : tab === 'console' ? 'console' : 'book'} />{tabLabel(tab)}{tab === 'console' && history.length > 0 && <span className="py-tab-count" aria-hidden="true">{history.length}</span>}</button>)}
    </nav>
    <div className="py-body" ref={bodyRef} onScroll={event => { panelScroll.current[panel] = event.currentTarget.scrollTop; }} onWheel={event => { if (panel === 'console' && event.deltaY < 0) setFollowOutput(false); }} onTouchMove={() => { if (panel === 'console') setFollowOutput(false); }} onKeyDown={event => { if (panel === 'console' && ['PageUp','Home','ArrowUp'].includes(event.key) && event.target === event.currentTarget) setFollowOutput(false); }} tabIndex={0}>
      {!online && <p className="py-notice" role="status">{t('Le moteur Python peut nécessiter Internet. Tes brouillons restent disponibles.', 'Python may need an internet connection to load. Your drafts remain available.', 'قد يحتاج محرك بايثون إلى الإنترنت للتحميل. تبقى مسوداتك متاحة.')}</p>}
      {!!notice && <p className="py-notice" role="status">{notice}</p>}
      {!!saveError && <div className="py-notice" role="alert">{saveError}<button onClick={retry}>{t('Réessayer', 'Retry storage', 'إعادة المحاولة')}</button></div>}
      <div id="py-editor" role="tabpanel" aria-labelledby="py-tab-editor" className="py-panel" hidden={panel !== 'editor'}>
        <div className="py-editor-layout">
          <div className="py-stack">
            <div className="py-editor-frame" ref={editorHost}>
              <div className="py-filebar editor-filebar">
                <button dir="ltr" onClick={() => editorHost.current?.querySelector<HTMLElement>('.cm-content')?.focus()} aria-label={`${openedFile || 'main'}.py — ${dirty ? t('Modifié', 'Unsaved changes', 'تغييرات غير محفوظة') : t('Brouillon enregistré', 'Draft saved', 'المسودة محفوظة')}`}><Icon name="python" />{openedFile || 'main'}.py {dirty && <span className="py-dirty" aria-hidden="true">●</span>}</button>
                <div className="py-editor-tools">
                  <button className="py-tool" aria-pressed={wrap} title={t('Retour à la ligne', 'Wrap long lines', 'التفاف الأسطر الطويلة')} aria-label={t('Retour à la ligne', 'Wrap long lines', 'التفاف الأسطر الطويلة')} onClick={() => setWrap(value => !value)}><Icon name="wrap" /></button>
                  <button className="py-tool" aria-pressed={focusMode} title={t('Mode concentration', 'Focus mode', 'وضع التركيز')} aria-label={t('Mode concentration', 'Focus mode', 'وضع التركيز')} onClick={() => setFocusMode(value => !value)}><Icon name="expand" /></button>
                </div>
              </div>
              <PythonEditor key={editorGeneration} value={code} onChange={changeCode} onRun={run} dark={dark} fontSize={fontSize} wrap={wrap} accessory={accessory} t={t} disabled={busy} errorLine={latest?.code === code ? explanation?.line : null} errorMessage={explanation?.message} />
            </div>
            <div className="py-statusbar" data-error={!!saveError}><span>{saveError ? t('Échec de l’enregistrement', 'Save failed', 'تعذّر الحفظ') : dirty ? t('Modifications en cours', 'Unsaved changes', 'تغييرات غير محفوظة') : t('Brouillon enregistré sur cet appareil', 'Draft saved on this device', 'تُحفظ المسودات على هذا الجهاز')}</span><span dir="ltr">{code.split('\n').length} {t('lignes', 'lines', 'أسطر')} · UTF-8</span></div>
          </div>
          <aside className="py-editor-aside py-stack">
            <details className="py-card py-settings" ref={settingsRef}>
              <summary>{t('Réglages et saisie', 'Editor settings and input', 'إعدادات المحرر والإدخال')}</summary>
              <div className="py-stack">
                <label className="py-check"><input type="checkbox" checked={accessory} onChange={event => setAccessory(event.target.checked)} />{t('Barre de programmation', 'Coding accessory bar', 'شريط مفاتيح البرمجة')}</label>
                <div className="py-settings-grid"><label>{t('Taille du texte', 'Font size', 'حجم الخط')}<select value={fontSize} onChange={event => setFontSize(Number(event.target.value))}>{[14,16,18,21,24].map(size => <option key={size}>{size}</option>)}</select></label><label>{t('Apparence', 'Appearance', 'المظهر')}<select value={dark ? 'dark' : 'light'} onChange={event => setDark(event.target.value === 'dark')}><option value="dark">{t('Sombre','Dark','داكن')}</option><option value="light">{t('Clair','Light','فاتح')}</option></select></label></div>
                <label className="py-check"><input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />{t('Retour à la ligne', 'Wrap long lines', 'التفاف الأسطر الطويلة')}</label>
                <label className="py-check"><input type="checkbox" checked={liveInput} disabled={busy} onChange={event => setLiveInput(event.target.checked)} />{t('Saisie interactive', 'Interactive input', 'إدخال تفاعلي')}</label>
                <label>{t('Réponses préparées : une par ligne', 'Prepared answers: one per line', 'إجابات مسبقة: إجابة في كل سطر')}<textarea aria-label="Python input" dir="ltr" rows={3} maxLength={12000} value={input} disabled={busy} onChange={event => setInput(event.target.value)} /></label>
                <small className="py-caption">{t('Désactive la saisie interactive pour utiliser tes réponses préparées. Chaque exécution repart à zéro.', 'Prepared answers are used only when you turn off Interactive input. Each run starts fresh.', 'تُستخدم إجاباتك المسبقة فقط عند تعطيل الإدخال التفاعلي. يبدأ كل تشغيل من جديد.')}</small>
                <details><summary>{t('Raccourcis et limites', 'Shortcuts and limits', 'الاختصارات والحدود')}</summary><p className="py-caption" dir="ltr">Ctrl/Cmd+Enter: Run · Ctrl/Cmd+F: Search · Ctrl/Cmd+H: Replace · Ctrl/Cmd+Z: Undo · Esc then Tab: leave editor</p><p className="py-caption">10s execution · 60s input · 2min session · 64,000 characters</p></details>
              </div>
            </details>
            <details className="py-card py-settings" ref={filesRef}><summary>{t('Mes fichiers', 'My files', 'ملفاتي')} <span dir="ltr">({saved.length})</span></summary><div className="py-stack">
              <label>{t('Nom du fichier', 'File name', 'اسم الملف')}<input aria-label="Script name" dir="ltr" value={name} maxLength={63} onChange={event => setName(event.target.value)} /></label>
              <div className="py-actions"><button disabled={busy || !openedFile} onClick={() => fileAction('rename')}>{t('Renommer','Rename','إعادة التسمية')}</button><button disabled={busy || !openedFile} onClick={() => fileAction('delete')}>{t('Supprimer','Delete file','حذف الملف')}</button></div>
              {saved.length ? <label>{t('Ouvrir un fichier','Open saved script','فتح ملف محفوظ')}<select aria-label="Open saved script" disabled={busy} value="" onChange={event => { if(event.target.value) { const filename=event.target.value.slice(PYTHON_FILE_PREFIX.length);setOpenedFile(filename);setName(filename);switchDocument(`python-working:${filename}`,state.drafts[event.target.value]!); } }}><option value="">{t('Choisir…','Choose…','اختر…')}</option>{saved.map(key => <option key={key} value={key}>{key.slice(PYTHON_FILE_PREFIX.length)}.py</option>)}</select></label> : <p className="py-caption">{t('Enregistre ton premier fichier pour le retrouver ici.', 'Save your first file to find it here.', 'احفظ ملفك الأول ليظهر هنا.')}</p>}
              <button disabled={busy} onClick={() => {setOpenedFile('');switchDocument(baseKey,seed||starter);}}>{t('Brouillon','Scratch draft','مسودة')}</button>
              <button disabled={busy} onClick={() => {if(window.confirm(t('Réinitialiser ce brouillon ? Les fichiers enregistrés sont conservés.','Reset this editor to its starter? Saved files are kept.','إعادة ضبط المسودة؟ ستبقى الملفات المحفوظة.'))) {changeCode(docKey.startsWith('python-exercise:')?exercise.starter:seed||starter);setInput('');}}}>{t('Réinitialiser','Reset exercise','إعادة ضبط التمرين')}</button>
            </div></details>
            <div className="py-card"><h3>{t('Un coup de main ?','Need a hand?','تحتاج مساعدة؟')}</h3><p className="py-caption">{t('Comprends ton code, une étape à la fois.','Understand your code, one step at a time.','افهم الكود خطوة بخطوة.')}</p><button disabled={busy} onClick={explain}>{t('Professeur IA','Ask AI Teacher','اسأل المعلّم الذكي')}</button><p className="py-caption">{t('Envoie le code et les résultats uniquement à ta demande.','Shares code and output only when you ask.','يشارك الكود والنتائج عند طلبك فقط.')}</p></div>
          </aside>
        </div>
      </div>
      <div id="py-console" role="tabpanel" aria-labelledby="py-tab-console" className="py-panel" hidden={panel !== 'console'}>
        <label className="py-check py-follow"><input type="checkbox" checked={followOutput} onChange={event => setFollowOutput(event.target.checked)} />{t('Suivre la sortie', 'Follow latest output', 'متابعة أحدث المخرجات')}</label>
        <div className="py-console-head"><h2>{t('Sortie du programme','Program output','مخرجات البرنامج')}</h2><div className="py-actions"><button disabled={busy || !history.length} onClick={() => setHistory([])}>{t('Effacer','Clear Console','مسح')}</button><button disabled={!latest && !busy} onClick={() => {const output=busy?outputText(runtime):latest?outputText(latest.result):'';void copyText(output);}}>{t('Copier','Copy output','نسخ')}</button></div></div>
        {!history.length && !busy && <div className="py-card py-empty"><Icon name="console" /><strong>{t('Prêt pour ton premier résultat','Your next result starts here','نتيجتك التالية تبدأ هنا')}</strong><p>{t('Exécute ton code pour voir les résultats, les erreurs et les demandes de saisie.','Run your code to see output, errors and input requests.','شغّل الكود لعرض النتائج والأخطاء وطلبات الإدخال.')}</p><button onClick={() => setPanel('editor')}>{t('Ouvrir l’éditeur','Go to editor','فتح المحرر')}</button></div>}
        {busy && <div className="py-card py-live" aria-label="Live Python output"><div className="py-live-heading"><span className="py-activity" aria-hidden="true" /><strong role="status">{status}</strong><span className="py-console-file" dir="ltr">Python</span></div>{runtime.stdout || runtime.stderr ? <OrderedOutput {...runtime} /> : <div className="py-runtime-wait"><Icon name="console" /><strong>{runtime.status === 'Loading Python' ? t('Préparation de Python', 'Preparing Python', 'تجهيز بيئة بايثون') : runtime.prompt !== null ? t('À toi de répondre', 'Your input is needed', 'بانتظار إجابتك') : t('Exécution du programme', 'Running your program', 'تشغيل برنامجك')}</strong><p>{runtime.status === 'Loading Python' ? t('Le premier démarrage peut prendre un instant. Le résultat apparaîtra ici.', 'The first start can take a moment. Output will appear here.', 'قد يستغرق التشغيل الأول بعض الوقت. ستظهر النتائج هنا.') : runtime.prompt !== null ? t('Réponds dans le champ ci-dessous pour continuer.', 'Use the field below to continue your program.', 'أدخل إجابتك في الحقل أدناه لمتابعة البرنامج.') : t('Les résultats apparaîtront dès que ton programme les produit.', 'Output appears as soon as your program produces it.', 'ستظهر النتائج فور أن ينتجها برنامجك.')}</p></div>}</div>}
        <div ref={busy ? liveEnd : undefined} aria-hidden="true" />
        {runtime.prompt !== null && <form className="py-card py-input" aria-label="Python input request" onSubmit={event => {event.preventDefault();if(session.current?.answer(answer))setAnswer('');}}><label><span dir="ltr">{runtime.prompt || 'input()'}</span><input ref={inputRef} aria-label="Answer to Python input" enterKeyHint="send" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={answer} onChange={event=>setAnswer(event.target.value)} maxLength={4000} autoComplete="off" /></label><div className="py-actions"><button className="py-run" type="submit">{t('Envoyer','Send input','إرسال')}</button><small className="py-caption">{t('Une réponse vide est acceptée.','Empty answers are allowed.','تُقبل الإجابة الفارغة.')}</small></div></form>}
        
        {history.map((item,i)=><details className="py-card" key={item.at+i} open={i===0}><summary><span>{item.status}</span><span dir="ltr" className="py-caption"> · {item.result.durationMs} ms · {new Date(item.at).toLocaleTimeString()}</span></summary><OrderedOutput {...item.result} /><p className="py-completion" data-state={item.status} role="status">{item.result.exitCode === 0 ? t('Processus terminé avec succès.','Process finished successfully.','اكتمل تشغيل البرنامج بنجاح.') : item.status === 'Cancelled' ? t('Exécution annulée.','Execution cancelled.','تم إلغاء التشغيل.') : t('Échec de l’exécution. Consulte les détails ci-dessus.','Execution failed. See the details above.','فشل التشغيل. راجع التفاصيل أعلاه.')}</p>{i === 0 && !busy && latestSucceeded && <aside className="py-card py-success-help"><h3>{t('\u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0645\u062f\u0631\u0651\u0633 \u0627\u0644\u0630\u0643\u064a','AI teacher suggestion','Suggestion du professeur IA')}</h3><p>{t('\u0627\u0644\u0643\u0648\u062f \u0627\u0634\u062a\u063a\u0644 \u0628\u0646\u062c\u0627\u062d. \u064a\u0645\u0643\u0646\u0643 \u0637\u0644\u0628 \u0645\u0631\u0627\u062c\u0639\u0629 \u062a\u062e\u0628\u0631\u0643 \u0647\u0644 \u062a\u0648\u062c\u062f \u0637\u0631\u064a\u0642\u0629 \u0623\u0648\u0636\u062d \u0644\u0643\u062a\u0627\u0628\u062a\u0647\u060c \u0645\u0639 \u0646\u0635\u0627\u0626\u062d \u0639\u0645\u0644\u064a\u0629 \u0644\u0644\u062a\u062d\u0633\u064a\u0646.','Your code ran successfully. You can still ask for a clearer way to write it and get practical improvement tips.','Ton code fonctionne. Tu peux demander une version plus claire et des conseils pratiques.')}</p><ul>{improvementAdvice.map(kind => <li key={kind}>{kind === 'format' ? t('\u062c\u0631\u0651\u0628 f-string \u0644\u062a\u0646\u0633\u064a\u0642 \u0627\u0644\u0646\u0635 \u0648\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0628\u0634\u0643\u0644 \u0623\u0648\u0636\u062d.','Consider an f-string to format text and values more clearly.','Essaie une f-string pour formater le texte et le r?sultat plus clairement.') : kind === 'input' ? t('\u0623\u0636\u0641 \u062a\u062d\u0642\u0642\u064b\u0627 \u0645\u0646 \u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u0644\u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0642\u064a\u0645 \u063a\u064a\u0631 \u0627\u0644\u0635\u0627\u0644\u062d\u0629 \u0628\u0644\u0644\u0637\u0641.','Validate user input so invalid values are handled clearly.','Valide les entr?es pour g?rer les valeurs invalides.') : kind === 'names' ? t('\u0627\u062e\u062a\u0631 \u0623\u0633\u0645\u0627\u0621 \u0645\u062a\u063a\u064a\u0631\u0627\u062a \u062a\u0635\u0641 \u0627\u0644\u0645\u0639\u0646\u0649\u060c \u062b\u0645 \u0627\u062c\u0639\u0644 \u0643\u0644 \u0633\u0637\u0631 \u0633\u0647\u0644 \u0627\u0644\u0642\u0631\u0627\u0621\u0629.','Keep variable names descriptive so each line is easy to read.','Choisis des noms de variables descriptifs pour faciliter la lecture.') : t('\u0642\u0633\u0651\u0645 \u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0627\u0644\u0637\u0648\u064a\u0644\u0629 \u0625\u0644\u0649 \u062f\u0627\u0644\u0629 \u0635\u063a\u064a\u0631\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645.','Move repeated or long steps into a small reusable function.','Transforme les ?tapes longues en petite fonction r?utilisable.')}</li>)}</ul><div className="py-actions"><button onClick={reviewSuccess}>{t('\u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u062f\u0631\u0651\u0633 \u0639\u0646 \u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0643\u0648\u062f','Ask AI teacher for a code review','Demander une revue du code')}</button></div></aside>}{i === 0 && !busy && explanation && <aside className="py-card py-error-help"><h3>{explanation.type}{explanation.line?` · ${explanation.line}`:''}</h3><h4>{t('Que s’est-il passé ?','What happened?','ماذا حدث؟')}</h4><p>{explanation.why}</p><h4>{t('Comment corriger','How to fix it','كيفية الإصلاح')}</h4><pre>{explanation.fix}</pre><p className="py-caption">{t('Conseil général, pas une correction vérifiée.','General guidance, not a verified fix.','إرشاد عام، وليس إصلاحاً مؤكداً.')}</p><div className="py-actions"><button onClick={()=>setPanel('editor')}>{t('Voir le code','Go to editor','عرض الكود')}</button><button onClick={explain}>{t('Expliquer l’erreur','Explain Error','اشرح الخطأ')}</button><button onClick={() => { void copyText(explanation.fix); }}>{t('Copier le conseil','Copy suggestion','نسخ الاقتراح')}</button></div></aside>}<details className="py-raw-streams"><summary>{t('Flux séparés','Separate streams','التدفقات المنفصلة')}</summary><div className="py-stream"><b>STDOUT</b><pre>{item.result.stdout}</pre></div><div className="py-stream" data-error="true"><b>STDERR</b><pre>{item.result.stderr}</pre></div></details><div ref={i === 0 && !busy ? liveEnd : undefined} aria-hidden="true" />{item.result.truncated && <p className="py-caption">{t('Sortie limitée à 24 000 caractères.','Output limited to 24,000 characters per stream or 2,000 stream switches.','المخرجات محدودة بـ 24,000 حرف.')}</p>}<details><summary>{t('Code exécuté et saisie','Executed code and input','الكود المنفذ والإدخال')}</summary><pre>{item.code}{'\n\nInput:\n'}{item.input}</pre></details></details>)}
        <small className="py-caption">{t('Les 20 dernières exécutions de cette session.','Last 20 runs in this session.','آخر 20 عملية تشغيل في هذه الجلسة.')}</small>
      </div>
      <div id="py-exercises" role="tabpanel" aria-labelledby="py-tab-exercises" className="py-panel" hidden={panel !== 'exercises'}>
        <div className="py-card"><div className="py-console-head"><h2>{t('Pratique Python','Python practice','تدريب بايثون')}</h2><span className="py-caption" dir="ltr">{completed} / {pythonExercises.length}</span></div><div className="py-progress" role="progressbar" aria-label={t('Exercices terminés','Exercises completed','التمارين المكتملة')} aria-valuemin={0} aria-valuemax={pythonExercises.length} aria-valuenow={completed}><span style={{width:`${completed/pythonExercises.length*100}%`}} /></div></div>
        <div className="py-exercise-grid"><div className="py-card py-stack"><label>{t('Choisir un exercice','Choose an exercise','اختر تمريناً')}<select aria-label="Choose Python exercise" value={exerciseId} disabled={busy} onChange={event=>{setExerciseId(event.target.value);setHint(0);setChecks([]);}}>{pythonExercises.map(item=><option key={item.id} value={item.id}>{item.title}{state.answers[`python-practice:${item.id}`]?.correct?' ✓':''}</option>)}</select></label><h3>{exercise.title}</h3><p>{exercise.theory}</p><strong>{exercise.task}</strong><div className="py-actions"><button className="py-run" disabled={busy} onClick={()=>{setOpenedFile('');switchDocument(`python-exercise:${exercise.id}`,exercise.starter);}}>{t('Ouvrir l’exercice','Open exercise draft','فتح التمرين')}</button><button disabled={busy||docKey!==`python-exercise:${exercise.id}`} onClick={()=>void checkExercise()}>{t('Vérifier','Check answer','تحقق من الإجابة')}</button></div></div><div className="py-card py-stack"><h3>{t('Un indice à la fois','One hint at a time','تلميح في كل خطوة')}</h3><button disabled={hint>=exercise.hints.length} onClick={()=>setHint(value=>value+1)}>{t('Afficher un indice','Show a hint','إظهار تلميح')}</button>{exercise.hints.slice(0,hint).map(text=><p key={text}>{text}</p>)}<details><summary>{t('Voir la solution','Explain the solution','شرح الحل')}</summary><pre>{exercise.solution}</pre></details><p className="py-caption">{t('Chaque cas est exécuté séparément. Ces tests donnent un retour pédagogique.','Each case runs in isolation. These checks provide practice feedback.','تُشغّل كل حالة بشكل مستقل. توفر هذه الاختبارات ملاحظات تعليمية.')}</p></div></div>
        {checks.map((check,i)=><details className="py-card" key={i} open={!check.passed}><summary>{check.passed?'✓':'!'} {check.label}</summary><pre>Expected: {check.expected}{'\n'}Actual: {check.actual || '(No output)'}</pre></details>)}
      </div>
      <footer className="py-footer">ACADEMY · Python Studio</footer>
    </div>
    <iframe key={runtime.generation} ref={frame} title="Isolated Python runtime" sandbox="allow-scripts" srcDoc={pythonSandboxDocument} style={{display:'none'}} />
  </section>;
}
