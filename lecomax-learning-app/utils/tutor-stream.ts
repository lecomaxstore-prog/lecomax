// Decode only the leading answer string. Never render structured fragments as a lesson.
export function partialTutorAnswer(json: string): string {
  const prefix = /^\s*\{\s*"answer"\s*:\s*"/.exec(json);
  if (!prefix) return '';
  let text = '';
  for (let i = prefix[0].length; i < json.length; i++) {
    const char = json[i]!;
    if (char === '"') break;
    if (char !== '\\') {
      if (char.charCodeAt(0) < 32) break;
      text += char;
      continue;
    }
    const next = json[++i];
    if (!next) break;
    if (next === 'u') {
      const hex = json.slice(i + 1, i + 5);
      if (!/^[a-fA-F0-9]{4}$/.test(hex)) break;
      text += String.fromCharCode(parseInt(hex, 16));
      i += 4;
    } else {
      const escapes: Record<string, string> = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
      };
      if (!(next in escapes)) break;
      text += escapes[next];
    }
  }
  return text.slice(0, 12000);
}
