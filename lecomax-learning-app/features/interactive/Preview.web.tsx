import React from 'react';
import DOMPurify from 'dompurify';
import { htmlDocument } from './runtime-document';
export function Preview({ code, narrow }: { code: string; narrow: boolean }) {
  const clean = DOMPurify.sanitize(code, { WHOLE_DOCUMENT: true, FORBID_TAGS: ['meta', 'base', 'link', 'iframe', 'object', 'embed', 'script', 'form'], FORBID_ATTR: ['href', 'action', 'formaction', 'srcdoc', 'target'] });
  return <iframe title="HTML and CSS preview" sandbox="" srcDoc={htmlDocument(clean)} style={{ background: 'white', border: '1px solid #bbb', width: '100%', maxWidth: narrow ? 375 : 1000, height: 380 }} />;
}
