const fs = require('fs');
let buf = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx');

// Remaining broken emojis (identified from hex dump of line 28):
// c3a2 c2ad c290 = mojibake for ⭐ (U+2B50, bytes E2 AD 90)
// c3b0 c5b8 e28099 c5a1 = mojibake for 💚 (U+1F49A, bytes F0 9F 92 9A)

const fixes = [
  { bad: Buffer.from([0xC3, 0xA2, 0xC2, 0xAD, 0xC2, 0x90]), good: Buffer.from('⭐', 'utf8') },
  { bad: Buffer.from([0xC3, 0xB0, 0xC5, 0xB8, 0xE2, 0x80, 0x99, 0xC5, 0xA1]), good: Buffer.from('💚', 'utf8') },
];

let count = 0;
for (const { bad, good } of fixes) {
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
    console.log('Fixed', good.toString('utf8'));
  }
}

fs.writeFileSync('components/ecomedia/EcomediaNotifButton.tsx', buf);
console.log('Fixed', count, 'remaining emojis');

// Verify line 28
const result = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx', 'utf8');
const line28 = result.split('\n')[27];
console.log('Line 28:', line28.trim());
