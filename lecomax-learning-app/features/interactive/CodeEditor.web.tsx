import React, { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
export function CodeEditor({ value, onChange, language, fontSize }: { value: string; onChange: (s: string) => void; language: string; fontSize: number }) {
  const host = useRef<HTMLDivElement>(null); const editor = useRef<EditorView | null>(null); const changed = useRef(onChange); useEffect(() => { changed.current = onChange; }, [onChange]);
  useEffect(() => {
    const view = new EditorView({ parent: host.current!, state: EditorState.create({ doc: value, extensions: [basicSetup, oneDark, keymap.of([indentWithTab]), language === 'sql' ? sql() : language === 'web' ? html() : javascript({ typescript: language === 'typescript', jsx: language === 'react' }), EditorView.contentAttributes.of({ 'aria-label': 'Source code', spellcheck: 'false' }), EditorView.theme({ '&': { fontSize: `${fontSize}px` }, '.cm-scroller': { overflow: 'auto', minHeight: '320px', maxHeight: '65vh' } }), EditorView.updateListener.of(update => { if (update.docChanged) changed.current(update.state.doc.toString().slice(0, 32000)); })] }) });
    editor.current = view; return () => { view.destroy(); editor.current = null; };
    // Rebuild only for language/font changes; document updates preserve selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, fontSize]);
  useEffect(() => { const view = editor.current; if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } }); }, [value]);
  return <div ref={host} dir="ltr" style={{ direction: 'ltr', minWidth: 0, overflow: 'hidden', borderRadius: 12 }} />;
}
