const fs = require('fs');

// Read file as binary buffer
const raw = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx');

// Map of UTF-8 mojibake byte sequences -> correct UTF-8 bytes
// These occur when UTF-8 bytes were re-encoded as if they were Latin-1/Windows-1252 chars
// 
// For each emoji, the original UTF-8 bytes (e.g. F0 9F 8E 89 for 🎉) were misread
// as Windows-1252 characters and then re-saved as UTF-8, so each original byte
// became a multi-byte UTF-8 sequence.
//
// The mapping: original_byte -> W1252_char -> UTF-8_of_that_char
// F0 -> ð (U+00F0) -> C3 B0
// 9F -> Ÿ (U+0178) -> C5 B8
// 8E -> Ž (U+017D) -> C5 BD
// 89 -> ‰ (U+2030) -> E2 80 89 (wait this is wrong) 
// Actually U+2030 is: E2 80 B0
// Let me just detect and fix by reading actual bytes

// Better approach: read file, find the mojibake sequences by their known byte patterns
// and replace with correct UTF-8 bytes

// Read current bytes and convert back
// The mojibake converts: for each original byte B in 0x80-0xFF range,
// the W1252 char for that byte gets UTF-8 encoded.
// For bytes 0xF0, 0x9F, 0x8E, 0x89 etc:

// Let's build the reverse map: for each byte 0x00-0xFF, what UTF-8 sequence does W1252->UTF8 produce?
const W1252 = [
  0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
  32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,
  64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,
  96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,
  // 0x80-0x9F W1252 special chars
  0x20AC, 0x0081, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021,
  0x02C6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008D, 0x017D, 0x008F,
  0x0090, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
  0x02DC, 0x2122, 0x0161, 0x203A, 0x0153, 0x009D, 0x017E, 0x0178,
  // 0xA0-0xFF direct
  0x00A0,0x00A1,0x00A2,0x00A3,0x00A4,0x00A5,0x00A6,0x00A7,0x00A8,0x00A9,0x00AA,0x00AB,0x00AC,0x00AD,0x00AE,0x00AF,
  0x00B0,0x00B1,0x00B2,0x00B3,0x00B4,0x00B5,0x00B6,0x00B7,0x00B8,0x00B9,0x00BA,0x00BB,0x00BC,0x00BD,0x00BE,0x00BF,
  0x00C0,0x00C1,0x00C2,0x00C3,0x00C4,0x00C5,0x00C6,0x00C7,0x00C8,0x00C9,0x00CA,0x00CB,0x00CC,0x00CD,0x00CE,0x00CF,
  0x00D0,0x00D1,0x00D2,0x00D3,0x00D4,0x00D5,0x00D6,0x00D7,0x00D8,0x00D9,0x00DA,0x00DB,0x00DC,0x00DD,0x00DE,0x00DF,
  0x00E0,0x00E1,0x00E2,0x00E3,0x00E4,0x00E5,0x00E6,0x00E7,0x00E8,0x00E9,0x00EA,0x00EB,0x00EC,0x00ED,0x00EE,0x00EF,
  0x00F0,0x00F1,0x00F2,0x00F3,0x00F4,0x00F5,0x00F6,0x00F7,0x00F8,0x00F9,0x00FA,0x00FB,0x00FC,0x00FD,0x00FE,0x00FF,
];

// Build encoded representation of each original byte
function encodeUtf8(codepoint) {
  return Buffer.from(String.fromCodePoint(codepoint), 'utf8');
}

// Build reverse map: what byte sequence does each original byte produce after W1252->UTF8
const encodedBytes = W1252.map((cp, i) => ({ original: i, encoded: encodeUtf8(cp) }));

// Now for an emoji like 🎉 (F0 9F 8E 89), produce the mojibake byte sequence
function mojibakeOf(emojiBytes) {
  const parts = [];
  for (const b of emojiBytes) {
    parts.push(encodedBytes[b].encoded);
  }
  return Buffer.concat(parts);
}

// Emoji fixes: [emoji_utf8_bytes (as array), correct_emoji_string]
const emojiFixes = [
  [[0xF0, 0x9F, 0x8E, 0x89], '🎉'],
  [[0xE2, 0x9C, 0xA8], '✨'],
  [[0xF0, 0x9F, 0x94, 0x94], '🔔'],
  [[0xF0, 0x9F, 0x8E, 0x8A], '🎊'],
  [[0xE2, 0x9C, 0x85], '✅'],
  [[0xE2, 0x9C, 0x93], '✓'],
  [[0xF0, 0x9F, 0x8F, 0xB7, 0xEF, 0xB8, 0x8F], '🏷️'],
  [[0xF0, 0x9F, 0x9B, 0x8D, 0xEF, 0xB8, 0x8F], '🛍️'],
  [[0xF0, 0x9F, 0x93, 0xB1], '📱'],
  [[0xF0, 0x9F, 0x8E, 0x80], '🎀'],
  [[0xF0, 0x9F, 0x8E, 0x81], '🎁'],
  [[0xF0, 0x9F, 0x8E, 0x86], '🎆'],
];

let buf = raw;
let count = 0;
for (const [bytes, emoji] of emojiFixes) {
  const bad = mojibakeOf(bytes);
  const good = Buffer.from(emoji, 'utf8');
  // Replace all occurrences
  let idx;
  const parts = [];
  let pos = 0;
  let found = false;
  while ((idx = buf.indexOf(bad, pos)) !== -1) {
    parts.push(buf.slice(pos, idx));
    parts.push(good);
    pos = idx + bad.length;
    found = true;
    count++;
  }
  if (found) {
    parts.push(buf.slice(pos));
    buf = Buffer.concat(parts);
    console.log('Fixed emoji:', emoji, '(replaced', count, 'times)');
    count = 0;
  }
}

fs.writeFileSync('components/ecomedia/EcomediaNotifButton.tsx', buf);
console.log('Done! Final size:', buf.length);

// Quick verify
const result = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx', 'utf8');
const bad = result.split('\n').filter(l => /[\u00c2-\u00c3][\u0080-\u00bf]/.test(l) || /\u00f0[\u0080-\u00bf]/.test(l));
console.log('Remaining broken lines:', bad.length);
if (bad.length) bad.slice(0,3).forEach(l => console.log(' -', l.trim().slice(0,80)));
