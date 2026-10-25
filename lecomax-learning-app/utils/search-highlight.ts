import { normalized } from '../services/content';

/** Preserve the original spelling and offsets, including Arabic diacritics. */
export function searchSegments(text: string, query: string): { text: string; match: boolean }[] {
  const words = normalized(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [{ text, match: false }];
  let plain = '';
  const offsets: number[] = [];
  let offset = 0;
  for (const char of text) {
    // normalized trims whitespace; preserve it when building the offset map.
    const value = /\s/.test(char) ? ' ' : normalized(char);
    for (let i = 0; i < value.length; i++) offsets.push(offset);
    plain += value;
    offset += char.length;
  }
  const matches = new Set<number>();
  for (const word of words) {
    let at = plain.indexOf(word);
    while (at !== -1) {
      const start = offsets[at]!;
      const end = offsets[at + word.length] ?? text.length;
      for (let i = start; i < end; i++) matches.add(i);
      at = plain.indexOf(word, at + word.length);
    }
  }
  const result: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const match = matches.has(i);
    const previous = result[result.length - 1];
    if (previous?.match === match) previous.text += text[i];
    else result.push({ text: text[i]!, match });
  }
  return result;
}
