"use client";
import { useEffect, useState } from 'react';

export default function AdminConnectionNotice() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update(); window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return <div role="status" aria-live="polite" className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 sm:px-6"><strong>Votre appareil est hors ligne.</strong> Les mises à jour ne peuvent pas être envoyées. Gardez cette page ouverte et réessayez après le retour de la connexion.</div>;
}
