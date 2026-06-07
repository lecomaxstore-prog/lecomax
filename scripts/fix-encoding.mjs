import { readFileSync, writeFileSync } from 'fs';

const file = 'app/admin/analytics/page.tsx';
let c = readFileSync(file, 'utf8');

// Remove BOM
if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);

// Mojibake map: UTF-8 bytes read as Windows-1252 then re-encoded as UTF-8.
// Key = what appears in the corrupt JS string (Unicode codepoints as seen in the file)
// Value = what it should be
const fixes = [
  // Arrows (E2 86 xx bytes → â (U+00E2) + † (U+2020) + W1252[0x8x])
  ['\u00e2\u2020\u2018', '\u2191'],  // â†' -> ↑  (E2 86 91)
  ['\u00e2\u2020\u201c', '\u2193'],  // â†" -> ↓  (E2 86 93)
  ['\u00e2\u2020\u2019', '\u2192'],  // â†' -> →  (E2 86 92)
  // Em dash (E2 80 94) → â (U+00E2) + € (U+20AC) + " (U+201D)
  ['\u00e2\u20ac\u201d', '\u2014'],  // â€" -> —
  // Left/right double quotes
  ['\u00e2\u20ac\u009c', '\u201c'],  // -> "
  ['\u00e2\u20ac\u009d', '\u201d'],  // -> "
  ['\u00e2\u20ac\u2122', '\u2019'],  // -> '
  // French accented characters (2-byte UTF-8: C3 xx → Ã (U+00C3) + W1252[0xAx])
  ['\u00c3\u00a9', '\u00e9'],  // Ã© -> é
  ['\u00c3\u00a8', '\u00e8'],  // Ã¨ -> è
  ['\u00c3\u00aa', '\u00ea'],  // Ãª -> ê
  ['\u00c3\u00a0', '\u00e0'],  // Ã  -> à
  ['\u00c3\u00b4', '\u00f4'],  // Ã´ -> ô
  ['\u00c3\u00a2', '\u00e2'],  // Ã¢ -> â
  ['\u00c3\u00ae', '\u00ee'],  // Ã® -> î
  ['\u00c3\u00bb', '\u00fb'],  // Ã» -> û
  ['\u00c3\u00a7', '\u00e7'],  // Ã§ -> ç
  ['\u00c3\u00ab', '\u00eb'],  // Ã« -> ë
  ['\u00c3\u00af', '\u00ef'],  // Ã¯ -> ï
  ['\u00c3\u00a1', '\u00e1'],  // Ã¡ -> á
  ['\u00c3\u00b3', '\u00f3'],  // Ã³ -> ó
  ['\u00c5\u0153', '\u0153'],  // Å" -> œ  (C5 93)
  ['\u00c3\u0089', '\u00c9'],  // Ã‰ -> É
  ['\u00c3\u0088', '\u00c8'],  // ÃŠ -> È
  // Middle dot (C2 B7)
  ['\u00c2\u00b7', '\u00b7'],  // Â· -> ·
];

let count = 0;
for (const [bad, good] of fixes) {
  const before = c.length;
  c = c.split(bad).join(good);
  if (c.length !== before) count++;
}

writeFileSync(file, c, 'utf8');
console.log(`Encoding fixed: ${count} patterns replaced in ${file}`);
