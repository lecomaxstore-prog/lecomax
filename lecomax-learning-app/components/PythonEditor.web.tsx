import React, { useEffect, useRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark, oneDarkHighlightStyle, color } from '@codemirror/theme-one-dark';
import { Compartment, EditorSelection, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab, indentSelection, indentMore, indentLess, undo, redo, cursorCharLeft, cursorCharRight } from '@codemirror/commands';
import { setDiagnostics } from '@codemirror/lint';
import { HighlightStyle, syntaxHighlighting, indentUnit } from '@codemirror/language';
import { openSearchPanel } from '@codemirror/search';

// Reuse the same token groups in both themes; reserve error red for diagnostics.
const lightTokens: Record<string, string> = {
  [color.violet]: '#703cb0', [color.coral]: '#7b3651', [color.malibu]: '#195c9b',
  [color.whiskey]: '#805018', [color.ivory]: '#253c30', [color.chalky]: '#795000',
  [color.cyan]: '#066773', [color.stone]: '#576b60', [color.sage]: '#216b41', [color.invalid]: '#a22d24',
};
const lightHighlight = syntaxHighlighting(HighlightStyle.define(oneDarkHighlightStyle.specs.map(style => ({ ...style, ...(style.color ? { color: lightTokens[String(style.color)] || style.color } : {}) }))));

export const PythonEditor = React.memo(function PythonEditor({ value, onChange, onRun, dark, fontSize, wrap = false, errorLine, errorMessage, disabled, accessory = true, t = (_fr, en) => en }: {
  value: string; onChange: (value: string) => void; onRun: () => void;
  dark: boolean; fontSize: number; wrap?: boolean; errorLine?: number | null; errorMessage?: string; disabled: boolean; accessory?: boolean;
  t?: (fr: string, en: string, ar: string) => string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun });
  useEffect(() => { callbacks.current = { onChange, onRun }; }, [onChange, onRun]);
  const settings = useRef(new Compartment());
  const initial = useRef(value);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({ parent: host.current, state: EditorState.create({
      doc: initial.current,
      extensions: [basicSetup, python(), indentUnit.of('    '),
        EditorView.contentAttributes.of({ 'aria-label': 'Python code', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', inputmode: 'text', 'data-gramm': 'false' }),
        keymap.of([indentWithTab]),
        Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { callbacks.current.onRun(); return true; } },
          { key: 'Mod-Shift-f', run: indentSelection }, { key: 'Mod-h', run: openSearchPanel }])),
        EditorState.transactionFilter.of(tr => tr.newDoc.length > 64000 ? [] : tr),
        EditorView.updateListener.of(update => {
          if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head, line = update.state.doc.lineAt(head);
            setCursor({ line: line.number, column: head - line.from + 1 });
          }
        }),
        settings.current.of([])],
    }) });
    view.current = editor;
    let pending = 0;
    const revealCursor = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => { if (editor.hasFocus) editor.dispatch({ scrollIntoView: true }); });
    };
    window.visualViewport?.addEventListener('resize', revealCursor);
    window.addEventListener('resize', revealCursor);
    return () => { cancelAnimationFrame(pending); window.visualViewport?.removeEventListener('resize', revealCursor); window.removeEventListener('resize', revealCursor); editor.destroy(); view.current = null; };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);
  useEffect(() => {
    view.current?.dispatch({ effects: settings.current.reconfigure([
      ...(dark ? [oneDark] : [lightHighlight]), EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
      EditorView.contentAttributes.of({ 'aria-readonly': String(disabled), tabindex: '0' }),
      ...(wrap ? [EditorView.lineWrapping] : []),
      EditorView.theme({ '&': { fontSize: `${fontSize}px`, height: 'var(--py-editor-height, clamp(260px, 48dvh, 660px))', backgroundColor: dark ? '#121917' : '#fafcfb' }, '.cm-scroller': { overflow: 'auto', lineHeight: '1.75', overscrollBehavior: 'contain' }, '.cm-content': { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace', padding: '12px 0', caretColor: dark ? '#7dddac' : '#176b46' }, '.cm-line': { padding: '0 14px' }, '.cm-gutters': { backgroundColor: dark ? '#121917' : '#fafcfb', color: dark ? '#a1b6aa' : '#576e60', borderRight: '1px solid #52695c33' }, '.cm-lineNumbers .cm-gutterElement': { minWidth: '3ch', padding: '0 8px' }, '.cm-activeLine,.cm-activeLineGutter': { backgroundColor: dark ? '#20312966' : '#e6eee8' }, '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: dark ? '#385e4777' : '#b8dac5' } }),
    ]) });
  }, [dark, fontSize, disabled, wrap]);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const line = errorLine && errorLine > 0 && errorLine <= editor.state.doc.lines ? editor.state.doc.line(errorLine) : null;
    editor.dispatch(setDiagnostics(editor.state, line ? [{ from: line.from, to: line.to, severity: 'error', message: errorMessage || 'Python error' }] : []));
  }, [errorLine, errorMessage, value]);
  const command = (action: string) => {
    const editor = view.current;
    if (!editor || disabled || editor.composing) return;
    const commands: Record<string, (view: EditorView) => boolean> = { tab: editor => { if (!editor.state.selection.main.empty) return indentMore(editor); editor.dispatch(editor.state.replaceSelection('    '), { userEvent: 'input' }); return true; }, indent: indentMore, outdent: indentLess, undo, redo, left: cursorCharLeft, right: cursorCharRight };
    if (commands[action]) commands[action](editor);
    else {
      const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' };
      const close = pairs[action] || '';
      editor.dispatch(editor.state.changeByRange(range => {
        const selected = editor.state.sliceDoc(range.from, range.to);
        return { changes: { from: range.from, to: range.to, insert: action + selected + close }, range: selected ? EditorSelection.range(range.from + action.length, range.to + action.length) : EditorSelection.cursor(range.from + action.length) };
      }), { scrollIntoView: true, userEvent: 'input' });
    }
    editor.focus();
    editor.dispatch({ scrollIntoView: true });
  };
  const keys: [string, string, string][] = [
    ['tab', 'Tab', t('Tabulation', 'Insert tab', 'إدراج مسافة بادئة')],
    ['indent', '→|', t('Indenter', 'Indent selection', 'زيادة المسافة البادئة')],
    ['outdent', '|←', t('Désindenter', 'Outdent selection', 'تقليل المسافة البادئة')],
    ...['(', '[', "'", ':', '"', '{', '=', ',', '.', '_', '#', '+', '-', '*', '/', '%', '<', '>'].map((symbol): [string, string, string] => [symbol, { '(': '()', '[': '[]', '{': '{}' }[symbol] || symbol, `${t('Insérer', 'Insert', 'إدراج')} ${symbol}`]),
    ['left', '←', t('Curseur à gauche', 'Move cursor left', 'تحريك المؤشر لليسار')],
    ['right', '→', t('Curseur à droite', 'Move cursor right', 'تحريك المؤشر لليمين')],
    ['undo', '↶', t('Annuler', 'Undo edit', 'تراجع')], ['redo', '↷', t('Rétablir', 'Redo edit', 'إعادة')],
  ];
  return <div className="py-code-surface" dir="ltr">
    <div ref={host} className="py-codemirror-host" />
    {accessory && <div className="py-accessory" role="group" aria-label={t('Touches de programmation', 'Coding accessory keys', 'مفاتيح البرمجة')}>
      {keys.map(([action, label, title]) => <button key={action} type="button" title={title} aria-label={title} disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={() => command(action)}>{label}</button>)}
    </div>}
    <div className="py-cursor" dir="ltr">Ln {cursor.line}, Col {cursor.column}<span>Python · UTF-8 · 4 spaces</span></div>
  </div>;
});
