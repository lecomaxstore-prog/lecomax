import React, { useEffect, useRef } from 'react';
import { readSiteEvent, type SiteEvent } from '../utils/site-preview';
export default function SitePreview({ html, onEvent, title }: { html: string; onEvent: (event: SiteEvent) => void; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = readSiteEvent(event.data);
      if (data) onEvent(data);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onEvent]);
  return <iframe ref={frame} title={title} srcDoc={html} sandbox="allow-scripts" style={{ width: '100%', height: 560, border: 0, borderRadius: 16, background: '#fff' }} />;
}
