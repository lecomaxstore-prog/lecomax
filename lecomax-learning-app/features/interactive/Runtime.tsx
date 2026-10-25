import React, { useMemo, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import worker from './worker-bundle.json';
import { runtimeDocument } from './runtime-document';
import type { RunResult } from './model';
export type RunRequest = { id: number; language: string; code: string; test: boolean };
export function Runtime({ request, onResult }: { request: RunRequest | null; onResult: (r: RunResult) => void }) {
  const ref = useRef<WebView>(null); const ready = useRef(false); const pending = useRef(request); useEffect(() => { pending.current = request; }, [request]);
  const html = useMemo(() => runtimeDocument(worker).replace('<script>', '<script>window.postMessage = data => window.ReactNativeWebView.postMessage(JSON.stringify(data));'), []);
  const send = (r: RunRequest | null) => ref.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{source:window,data:${JSON.stringify(r ? { ...r, type: 'run' } : { type: 'stop' }).replaceAll('<', '\\u003c')}}));true;`);
  useEffect(() => { if (ready.current) send(request); }, [request]);
  return <WebView ref={ref} source={{ html }} originWhitelist={['about:blank']} onShouldStartLoadWithRequest={r => r.url === 'about:blank'} javaScriptEnabled allowFileAccess={false} allowUniversalAccessFromFileURLs={false} domStorageEnabled={false} style={{ height: 1, opacity: 0 }} onMessage={event => { try { const data = JSON.parse(event.nativeEvent.data); if (data.type === 'ready') { ready.current = true; if (pending.current) send(pending.current); } else if (data.type === 'result' && pending.current) onResult(data.result); } catch { /* Ignore malformed bridge data. */ } }} />;
}
