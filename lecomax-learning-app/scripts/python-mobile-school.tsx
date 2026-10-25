// Build-time replacement for SchoolProvider inside the standalone mobile WebView.
// Only Python practice data crosses the bridge; never authentication or general notes.
import React, { createContext, useContext, useEffect, useState } from 'react';
type Progress = { drafts: Record<string, string>; answers: Record<string, { correct: boolean; attempts: number }>; level: number; language: 'en' | 'fr' | 'ar'; theme: string };
const initial: Progress = { drafts: {}, answers: {}, level: 1, language: 'en', theme: 'dark' };
type Context = { state: Progress; update: React.Dispatch<React.SetStateAction<Progress>>; ready: boolean; error: string; retry: () => void; offlineAndroid: boolean; rtl: boolean; t: (fr: string, en: string, ar: string) => string };
const School = createContext<Context | null>(null);
export function sendMobile(value: unknown) { (window as unknown as { ReactNativeWebView?: { postMessage: (value: string) => void } }).ReactNativeWebView?.postMessage(JSON.stringify(value)); }
export function PythonMobileSchool({ children }: { children: React.ReactNode }) {
  const [state, update] = useState(initial), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [offlineAndroid, setOfflineAndroid] = useState(false);
  useEffect(() => {
    let initialized = false;
    const receive = (event: MessageEvent) => {
      // Native injection dispatches a synthetic message. Ignore sandbox iframe messages.
      if (event.source && event.source !== window) return;
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (message.type === 'init' && !initialized) { initialized = true; update(message.state); setOfflineAndroid(message.offlineAndroid === true); setReady(true); }
        if (message.type === 'storage') setError(message.error || '');
      } catch { setError('Could not read the native workspace bridge.'); }
    };
    window.addEventListener('message', receive); sendMobile({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => { if (ready) sendMobile({ type: 'progress', drafts: state.drafts, answers: state.answers }); }, [ready, state]);
  return <School.Provider value={{ state, update, ready, error, retry: () => sendMobile({ type: 'retry-storage' }), offlineAndroid, rtl: state.language === 'ar', t: (fr, en, ar) => ({ fr, en, ar })[state.language] }}>{children}</School.Provider>;
}
export function useSchool() { const school = useContext(School); if (!school) throw new Error('Python mobile school missing'); return school; }
