let nextCopyId = 0;
// The native host acknowledges the actual clipboard operation. Sandbox worker
// messages have a different source and cannot resolve a pending copy request.
export function copyPythonMobileText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bridge = (window as unknown as { ReactNativeWebView?: { postMessage: (text: string) => void } }).ReactNativeWebView;
    if (!bridge || text.length > 50000) { reject(new Error('Clipboard unavailable')); return; }
    const id = ++nextCopyId;
    const finish = (ok: boolean) => { clearTimeout(timer); window.removeEventListener('message', receive); if (ok) resolve(); else reject(new Error('Copy failed')); };
    const receive = (event: MessageEvent) => {
      if (event.source && event.source !== window) return;
      if (event.data?.type === 'clipboard-result' && event.data.id === id) finish(event.data.ok === true);
    };
    const timer = setTimeout(() => finish(false), 5000);
    window.addEventListener('message', receive);
    try { bridge.postMessage(JSON.stringify({ type: 'clipboard', id, text })); } catch { finish(false); }
  });
}
