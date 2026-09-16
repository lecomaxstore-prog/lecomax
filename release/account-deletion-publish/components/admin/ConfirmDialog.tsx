"use client";
import { useEffect, useId, useRef, useState } from 'react';

export function useAdminConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(() => () => resolver.current?.(false), []);
  const finish = (confirmed: boolean) => { resolver.current?.(confirmed); resolver.current = null; setMessage(null); };
  return {
    confirm: (text: string) => new Promise<boolean>(resolve => { resolver.current?.(false); resolver.current = resolve; setMessage(text); }),
    dialog: message === null ? null : <ConfirmDialog message={message} onAnswer={finish} />,
  };
}

function ConfirmDialog({ message, onAnswer }: { message: string; onAnswer: (confirmed: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={title} aria-describedby={description} onCancel={event => { event.preventDefault(); onAnswer(false); }} className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl backdrop:bg-black/50">
    <h2 id={title} className="text-lg font-bold">Confirmer l’action</h2>
    <p id={description} className="my-4 whitespace-pre-line break-words text-sm">{message}</p>
    <div className="flex flex-wrap justify-end gap-3">
      <button autoFocus type="button" onClick={() => onAnswer(false)} className="min-h-11 rounded-xl border px-4 font-semibold">Annuler</button>
      <button type="button" onClick={() => onAnswer(true)} className="min-h-11 rounded-xl bg-red-600 px-4 font-semibold text-white">Confirmer</button>
    </div>
  </dialog>;
}
