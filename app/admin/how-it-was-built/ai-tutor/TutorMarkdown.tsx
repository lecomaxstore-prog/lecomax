"use client";
import { useState } from "react";
import Markdown from "react-markdown";
import type { TutorAction } from "@/lib/ai-tutor";
import styles from "./Tutor.module.css";

function CodeBlock({ code, language, onAction, disabled }: { code: string; language: string; onAction?: (action: TutorAction, code: string) => void; disabled: boolean }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [line, setLine] = useState(1);
  const lines = code.split("\n");
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setCopyError(false); setTimeout(() => setCopied(false), 1800); }
    catch { setCopyError(true); }
  }
  return <div className={styles.codeBlock}>
    <div className={styles.codeBar}><span dir="ltr">{language || "code"}</span><button type="button" onClick={copy}>{copied ? "تم النسخ ✓" : "نسخ الكود"}</button></div>
    <pre dir="ltr" tabIndex={0} aria-label="الكود"><code>{code}</code></pre>
    {copyError && <p role="status">تعذر النسخ. يمكنك تحديد الكود ونسخه يدويًا.</p>}
    {onAction && <details className={styles.codeTools}><summary>افهم الكود وجرّب بنفسك</summary>
      <div className={styles.actions}>{([ ["explain", "اشرح الكود"], ["lines", "اشرح سطرًا بسطر"], ["change", "ما الذي يجب أن أغيّره؟"], ["practice", "جرّبني"] ] as [TutorAction,string][]).map(([action,label]) => <button disabled={disabled} key={action} onClick={() => onAction(action,code)}>{label}</button>)}</div>
      <div className={styles.linePicker}><label>رقم السطر<input type="number" dir="ltr" min={1} max={lines.length} value={line} onChange={event => setLine(Math.max(1, Math.min(lines.length, Number(event.target.value) || 1)))} /></label>
        <button disabled={disabled} onClick={() => onAction("line", `Line ${line}: ${lines[line-1]}\nContext:\n${lines.slice(Math.max(0,line-3),line+2).join("\n")}`)}>اشرح لي هذا السطر</button>
        <button disabled={disabled} onClick={() => onAction("why", `Line ${line}: ${lines[line-1]}\nContext:\n${code}`)}>لماذا؟</button>
        <button disabled={disabled} onClick={() => onAction("remove", `Line ${line}: ${lines[line-1]}\nContext:\n${code}`)}>ماذا يحدث إذا حذفته؟</button>
      </div>
    </details>}
  </div>;
}
export default function TutorMarkdown({ text, onAction, disabled = false }: { text: string; onAction?: (action: TutorAction, code: string) => void; disabled?: boolean }) {
  return <div className={styles.markdown}><Markdown skipHtml components={{
    pre({ children }) { return <>{children}</>; },
    code({ className, children, node }) {
      const code = String(children).replace(/\n$/, "");
      const block = Boolean(className?.startsWith("language-") || String(children).includes("\n") || (node?.position && node.position.end.line > node.position.start.line));
      return block ? <CodeBlock code={code} language={className?.replace("language-", "") || ""} onAction={onAction} disabled={disabled} /> : <code dir="ltr">{children}</code>;
    },
    a({ href, children }) { return href && /^(https?:\/\/|\/admin\/how-it-was-built\/)/.test(href) ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>; },
    img({ alt }) { return <span>{alt}</span>; },
  }}>{text}</Markdown></div>;
}
