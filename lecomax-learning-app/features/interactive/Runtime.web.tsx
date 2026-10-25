import React, { useEffect, useMemo, useRef } from 'react';
import worker from './worker-bundle.json';
import { runtimeDocument } from './runtime-document';
import type { RunResult } from './model';
export type RunRequest = { id: number; language: string; code: string; test: boolean };
export function Runtime({ request, onResult }: { request: RunRequest | null; onResult: (r: RunResult) => void }) {
  const frame = useRef<HTMLIFrameElement>(null); const ready = useRef(false); const pending = useRef(request); const callback = useRef(onResult); useEffect(() => { callback.current = onResult; }, [onResult]);
  const source = useMemo(() => runtimeDocument(worker), []);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'ready') { ready.current = true; if (pending.current) frame.current?.contentWindow?.postMessage({ ...pending.current, type: 'run' }, '*'); }
      if (e.data?.type === 'result' && pending.current) { pending.current = null; callback.current(e.data.result); }
    };
    window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => { pending.current = request; if (ready.current) frame.current?.contentWindow?.postMessage(request ? { ...request, type: 'run' } : { type: 'stop' }, '*'); }, [request]);
  return <iframe ref={frame} title="Isolated execution engine" sandbox="allow-scripts" srcDoc={source} onLoad={() => { if (!ready.current) frame.current?.contentWindow?.postMessage({ type: 'ping' }, '*'); }} style={{ display: 'none' }} />;
}
