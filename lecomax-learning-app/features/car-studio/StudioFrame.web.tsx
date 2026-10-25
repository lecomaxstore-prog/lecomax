import React, { useEffect, useRef } from 'react';
import type { StudioFrameProps } from './frame-types';
export default function StudioFrame({ html, onEvent }: StudioFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => { if (event.source === frame.current?.contentWindow) onEvent(event.data); };
    window.addEventListener('message', receive);
    const observer = new IntersectionObserver(entries => frame.current?.contentWindow?.postMessage({ channel: 'lecomax-car-activity', active: !!entries[0]?.isIntersecting }, '*'));
    if (frame.current) observer.observe(frame.current);
    return () => { window.removeEventListener('message', receive); observer.disconnect(); };
  }, [onEvent]);
  return <iframe ref={frame} title="3D Car Studio — Automotive Engineering" srcDoc={html} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" style={{ width: '100%', height: '100%', flex: 1, border: 0, background: '#0a101a' }} />;
}
