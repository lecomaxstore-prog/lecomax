export type CodeToken = { text: string; color: string };
// A small offline lexer, not a parser or an execution engine. Matching across the
// full excerpt keeps multiline comments and template strings in the right color.
export function highlight(code: string): CodeToken[][] {
  const lines: CodeToken[][] = [[]];
  const pattern =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|return|function|export|import|from|async|await|if|else|try|catch|throw|new|type|interface|class|extends|true|false|null|undefined|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|AND|OR|NOT|NULL)\b|\b\d+(?:\.\d+)?\b)/g;
  const parts = code.split(pattern);
  for (const part of parts) {
    if (!part) continue;
    const color = /^(\/\*|\/\/|--|#)/.test(part)
      ? '#9DB5A9'
      : /^["'`]/.test(part)
        ? '#E6C27B'
        : /^\d/.test(part)
          ? '#D6ACEE'
          : /^(?:const|let|var|return|function|export|import|from|async|await|if|else|try|catch|throw|new|type|interface|class|extends|true|false|null|undefined|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|AND|OR|NOT|NULL)$/.test(
                part,
              )
            ? '#9DCCFB'
            : '#E2EEE6';
    part.split('\n').forEach((text, i) => {
      if (i) lines.push([]);
      if (text) lines[lines.length - 1]!.push({ text, color });
    });
  }
  return lines;
}
