import React from 'react';
export function PythonStudioIcon({ name }: { name: 'python' | 'run' | 'stop' | 'save' | 'close' | 'console' | 'code' | 'book' | 'wrap' | 'expand' }) {
  const paths = { python: 'M12 3H7a3 3 0 0 0-3 3v3h9v2H5a3 3 0 0 0-3 3v3h5v-3h10V6a3 3 0 0 0-3-3h-2m0 18h5a3 3 0 0 0 3-3v-3h-9v-2h8a3 3 0 0 0 3-3V7h-5v3H7v8a3 3 0 0 0 3 3h2', run: 'm8 5 11 7-11 7V5Z', stop: 'M6 6h12v12H6z', save: 'M5 3h12l4 4v14H3V3h2m2 0v6h10V3M7 21v-8h10v8', close: 'm6 6 12 12M18 6 6 18', console: 'm4 6 5 6-5 6m8 0h8', code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18', book: 'M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3Z' };
  const extra = { wrap: 'M4 5h16M4 10h12a4 4 0 0 1 0 8h-5m3-3-3 3 3 3M4 15h3', expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={name === 'wrap' || name === 'expand' ? extra[name] : paths[name]} /></svg>;
}
