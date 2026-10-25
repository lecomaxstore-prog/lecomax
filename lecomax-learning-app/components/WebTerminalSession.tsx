import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { auth, API } from '../services/auth';
import { useSchool } from '../store/School';
import { createTerminalPump } from '../utils/terminal-pump';

type Runtime = 'powershell' | 'python' | 'javascript' | 'kali';
type Phase = 'connecting' | 'connected' | 'disconnected' | 'exited';
async function request(body: Record<string, unknown>) {
  const access = await auth.token();
  if (!access) throw new Error('OWNER_LOGIN_REQUIRED');
  const response = await fetch(API + '/api/learning-mobile/terminal', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'TERMINAL_UNAVAILABLE');
  return result;
}

export function WebTerminalSession({ runtime, active, onExplain }: {
  runtime: Runtime; active: boolean; onExplain: (value: string) => void;
}) {
  const { t, rtl } = useSchool();
  const host = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const activeRef = useRef(active);
  const control = useRef<{ write: (data: string) => void; wake: () => void; resize: () => void } | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generation, setGeneration] = useState(0);
  const [cwd, setCwd] = useState('');
  const name = { powershell: 'PowerShell', python: 'Python', javascript: 'Node.js', kali: 'Kali Linux' }[runtime];
  useEffect(() => {
    activeRef.current = active;
    if (active) { control.current?.resize(); control.current?.wake(); }
  }, [active]);
  useEffect(() => {
    if (!host.current) return;
    let disposed = false, sessionId = '', cursor = 0;
    let dimensions: { cols: number; rows: number } | undefined;
    let lastSize = '';
    setPhase('connecting'); setError(''); setNotice(''); setCwd('');
    const term = new Terminal({
      cursorBlink: true, cursorStyle: 'bar', fontSize: 14, lineHeight: 1.3,
      fontFamily: 'Cascadia Code, Consolas, monospace', scrollback: 3000,
      theme: { background: '#0b1220', foreground: '#dce6f3', cursor: '#6ee7c2', selectionBackground: '#285369', black: '#172337', blue: '#79b8ff', green: '#6ee7b7', red: '#ff8d9b', yellow: '#f5d58b' },
    });
    const fit = new FitAddon(); term.loadAddon(fit); term.open(host.current); terminal.current = term;
    const pump = createTerminalPump({
      active: () => activeRef.current && !document.hidden,
      fail: e => { if (!disposed) { setError(e instanceof Error ? e.message : 'TERMINAL_UNAVAILABLE'); setPhase('disconnected'); } },
      read: async data => {
        const size = dimensions; dimensions = undefined;
        const result = await request({ action: 'read', id: sessionId, cursor, data, ...size });
        if (disposed) return false;
        if (result.truncated) term.writeln('\r\n[Older output was trimmed]\r\n');
        if (result.output) term.write(result.output);
        cursor = result.cursor;
        if (result.exited) { term.writeln(`\r\n[Process exited: ${result.exitCode}]`); setPhase('exited'); return false; }
        return true;
      },
    });
    const resize = () => {
      if (disposed || !activeRef.current || !host.current?.clientWidth || !host.current?.clientHeight) return;
      fit.fit();
      const cols = Math.max(10, Math.min(400, term.cols)), rows = Math.max(2, Math.min(200, term.rows));
      if (`${cols}:${rows}` !== lastSize) { lastSize = `${cols}:${rows}`; dimensions = { cols, rows }; if (sessionId) pump.wake(); }
    };
    control.current = { write: data => { if (sessionId) pump.write(data); }, wake: () => { if (sessionId) pump.wake(); }, resize };
    const inputListener = term.onData(data => { if (sessionId) pump.write(data); });
    const observer = new ResizeObserver(resize); observer.observe(host.current);
    const visibility = () => { if (!document.hidden && sessionId) { resize(); pump.wake(); } };
    document.addEventListener('visibilitychange', visibility);
    // Start only this runtime. Probing all installed interpreters delays the first prompt.
    void request({ action: 'start', runtime }).then(async result => {
      sessionId = result.id;
      if (disposed) { await request({ action: 'stop', id: sessionId }).catch(() => {}); return; }
      setCwd(result.cwd || ''); setPhase('connected'); resize(); pump.start();
      if (activeRef.current) term.focus();
    }).catch(e => { if (!disposed) { setError(e instanceof Error ? e.message : 'TERMINAL_UNAVAILABLE'); setPhase('disconnected'); } });
    return () => {
      disposed = true; pump.stop(); observer.disconnect(); inputListener.dispose();
      document.removeEventListener('visibilitychange', visibility);
      term.dispose(); terminal.current = null; control.current = null;
      if (sessionId) void request({ action: 'stop', id: sessionId }).catch(() => {});
    };
  }, [runtime, generation]);

  const explain = () => {
    const term = terminal.current, lines: string[] = [], buffer = term?.buffer.active;
    if (buffer) for (let i = Math.max(0, buffer.length - 80); i < buffer.length; i++) lines.push(buffer.getLine(i)?.translateToString(true) || '');
    const context = term?.getSelection() || lines.join('\n').trim();
    if (!context) { setNotice(t('Exécute une commande ou sélectionne un résultat.', 'Run a command or select some output first.', 'شغّل أمرًا أو حدّد نتيجة أولًا.')); return; }
    onExplain(t('Explique ces commandes et résultats simplement, étape par étape. Explique les erreurs et propose une correction.', 'Explain these commands and results simply, step by step. Explain any errors and suggest a correction.', 'اشرح هذه الأوامر والنتائج ببساطة خطوة بخطوة، ووضّح الأخطاء واقترح تصحيحًا.') + '\nRuntime: ' + runtime + '\n' + context.slice(-4800));
  };
  const connected = phase === 'connected';
  const errorText = error === 'OWNER_LOGIN_REQUIRED' ? t('Reconnecte-toi pour ouvrir le terminal.', 'Sign in again to open the terminal.', 'سجّل الدخول مجددًا لفتح الطرفية.')
    : error === 'LOCAL_LAB_ONLY' ? t('Ouvre ce laboratoire depuis le serveur local de ton PC.', 'Open this lab from your PC’s local learning server.', 'افتح المختبر من خادم التعلّم المحلي على حاسوبك.')
    : error === 'RUNTIME_NOT_INSTALLED' ? t('Cet environnement n’est pas installé sur le PC.', 'This runtime is not installed on the PC.', 'بيئة التشغيل هذه غير مثبّتة على الحاسوب.')
    : t('Connexion perdue. Vérifie le serveur local, puis ouvre une nouvelle session. Les commandes ne sont pas renvoyées automatiquement.', 'Connection lost. Check the local server, then open a new session. Commands are never resent automatically.', 'انقطع الاتصال. تحقّق من الخادم المحلي ثم افتح جلسة جديدة. لا تُعاد الأوامر تلقائيًا.');
  return <section className="terminal-session" dir={rtl ? 'rtl' : 'ltr'} style={{ display: active ? 'flex' : 'none' }} aria-label={name}>
    <style>{`
      .terminal-session{flex:1;min-height:0;min-width:0;flex-direction:column;background:#0b1220;color:#dce6f3;font:13px "Segoe UI",Tahoma,sans-serif}
      .terminal-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:12px 16px;border-bottom:1px solid #223047;background:#101b2c}
      .terminal-identity{display:flex;align-items:center;gap:9px;flex:1;min-width:150px;font-weight:600}
      .terminal-dot{width:7px;height:7px;border-radius:50%;background:#f5cd7f;flex-shrink:0}.terminal-dot[data-phase=connected]{background:#6ee7b7}.terminal-dot[data-phase=disconnected]{background:#ff8d9b}.terminal-dot[data-phase=exited]{background:#8c9bb1}
      .terminal-state{color:#9caec5;font-weight:400;font-size:12px}
      .terminal-actions{display:flex;flex-wrap:wrap;gap:6px}
      .terminal-session button{font:inherit;min-height:36px;padding:7px 12px;border-radius:8px;border:1px solid #31415b;color:#dce6f3;background:#18253a;cursor:pointer;white-space:nowrap}
      .terminal-session button:hover:not(:disabled){background:#233752;border-color:#6382a8}.terminal-session button:focus-visible{outline:2px solid #79b8ff;outline-offset:2px}
      .terminal-session button:disabled{opacity:.4;cursor:default}.terminal-session .terminal-teacher{background:#163c3a;border-color:#29615a;color:#a5f3d5}
      .terminal-path{padding:9px 16px;color:#8499b5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr;text-align:left;font:11px Consolas,monospace;border-bottom:1px solid #19263b}
      .terminal-viewport{position:relative;flex:1;min-height:140px;overflow:hidden;direction:ltr;background:radial-gradient(ellipse at 50% 10%,#12233a,#0b1220 65%)}
      .terminal-host{position:absolute;inset:12px 16px;direction:ltr;text-align:left;overflow:hidden}.terminal-host .xterm{height:100%}
      .terminal-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:#0b1220ed;text-align:center}.terminal-empty-inner{max-width:360px;display:flex;flex-direction:column;align-items:center;gap:12px}
      .terminal-symbol{display:grid;place-items:center;width:56px;height:56px;border:1px solid #2d4665;border-radius:16px;color:#79b8ff;background:#14243a;font:24px Consolas,monospace}
      .terminal-empty h2{font-size:18px;margin:0;font-weight:600}.terminal-empty p{color:#9caec5;line-height:1.7;margin:0;font-size:13px}
      .terminal-notice{padding:9px 16px;background:#292638;color:#f5d58b;line-height:1.6}.terminal-footer{display:flex;justify-content:space-between;gap:12px;padding:8px 16px;border-top:1px solid #223047;color:#8da3bf;font-size:11px}
      @media(max-width:560px){.terminal-toolbar{padding:10px;gap:10px}.terminal-identity{flex-basis:100%}.terminal-actions{width:100%}.terminal-session button{min-height:40px;padding:7px 10px}.terminal-teacher{margin-inline-start:auto}.terminal-host{inset:10px}.terminal-footer{padding:8px 10px}.terminal-footer span:last-child{display:none}}
    `}</style>
    <div className="terminal-toolbar">
      <div className="terminal-identity"><span className="terminal-dot" data-phase={phase} /><span>{name}</span><span className="terminal-state" role="status">{connected ? t('Connecté', 'Connected', 'متصل') : phase === 'connecting' ? t('Connexion…', 'Connecting…', 'جارٍ الاتصال…') : phase === 'exited' ? t('Terminée', 'Ended', 'انتهت الجلسة') : t('Hors ligne', 'Offline', 'غير متصل')}</span></div>
      <div className="terminal-actions">
        <button disabled={!connected} onClick={() => { control.current?.write('\x03'); terminal.current?.focus(); }}>Ctrl+C</button>
        <button disabled={!connected} onClick={() => { control.current?.write('\r'); terminal.current?.focus(); }}>{t('Entrée', 'Enter', 'إدخال')} ↵</button>
        <button disabled={phase === 'connecting'} title={t('Termine la session et en ouvre une nouvelle', 'Ends this session and opens a new one', 'ينهي الجلسة ويفتح جلسة جديدة')} onClick={() => setGeneration(n => n + 1)}>{t('Redémarrer', 'Restart', 'إعادة التشغيل')}</button>
        <button className="terminal-teacher" onClick={explain}>{t('Professeur IA', 'Ask teacher', 'اسأل الأستاذ')} ✦</button>
      </div>
    </div>
    {cwd && <div className="terminal-path" title={cwd}>{cwd}</div>}
    {!!notice && <div className="terminal-notice" role="status">{notice}</div>}
    <div className="terminal-viewport">
      <div ref={host} className="terminal-host" aria-label={t('Saisie et résultats du terminal', 'Terminal input and output', 'إدخال الطرفية ونتائجها')} />
      {(phase === 'connecting' || (phase === 'disconnected' && !cwd)) && <div className="terminal-empty" dir={rtl ? 'rtl' : 'ltr'}><div className="terminal-empty-inner">
        <div className="terminal-symbol" aria-hidden="true">&gt;_</div>
        <h2>{phase === 'connecting' ? t('Ouverture de ', 'Opening ', 'جارٍ فتح ') + name : t('Connexion indisponible', 'Unable to connect', 'تعذّر الاتصال')}</h2>
        <p>{phase === 'connecting' ? t('Préparation de ta session sur le PC…', 'Preparing your session on the PC…', 'جارٍ تجهيز جلستك على الحاسوب…') : errorText}</p>
      </div></div>}
    </div>
    {phase === 'disconnected' && cwd && <div className="terminal-notice" role="alert">{errorText}</div>}
    {phase === 'exited' && <div className="terminal-notice" role="status">{t('Session terminée. Redémarre pour continuer.', 'Session ended. Restart to continue.', 'انتهت الجلسة. أعد التشغيل للمتابعة.')}</div>}
    <footer className="terminal-footer"><span>{t('Écris au curseur · Entrée pour exécuter', 'Type at the cursor · Enter to run', 'اكتب عند المؤشر · إدخال للتنفيذ')}</span><span>{t('Sélectionne un résultat pour le professeur', 'Select output to ask the teacher', 'حدّد النتيجة لسؤال الأستاذ')}</span></footer>
  </section>;
}
