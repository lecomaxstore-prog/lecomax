import katex from 'katex';

// MathML uses the platform's math fonts: no remote font or script requests.
export function renderFormula(source: string): string | null {
  if (!source.trim() || source.length > 4000) return null;
  try {
    return katex.renderToString(source, {
      output: 'mathml', displayMode: true, trust: false, throwOnError: true,
      strict: 'error', maxExpand: 200, maxSize: 10,
    });
  } catch { return null; }
}
