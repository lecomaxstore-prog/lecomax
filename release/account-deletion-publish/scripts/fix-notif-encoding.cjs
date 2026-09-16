const fs = require('fs');
let c = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx', 'utf8');

// Each [corrupted, correct] pair
const fixes = [
  ['\u00f0\u009f\u008e\u0089', '\uD83C\uDF89'],   // 🎉
  ['\u00e2\u009c\u00a8', '\u2728'],                 // ✨
  ['\u00f0\u009f\u0094\u0094', '\uD83D\uDD14'],    // 🔔
  ['\u00f0\u009f\u008e\u008a', '\uD83C\uDF8A'],    // 🎊
  ['\u00e2\u009c\u0085', '\u2705'],                 // ✅
  ['\u00f0\u009f\u00b7\u00ef\u00b8\u008f', '\uD83C\uDFF7\uFE0F'],  // 🏷️
  ['\u00f0\u009f\u009b\u008f', '\uD83D\uDECF\uFE0F'],              // 🛏️ -> use shopping bag
  ['\u00f0\u009f\u0094\u00b1', '\uD83D\uDCF1'],    // 📱
  ['\u00c3\u00a9', '\u00e9'],  // é
  ['\u00c3\u00a8', '\u00e8'],  // è
  ['\u00c3\u00aa', '\u00ea'],  // ê
  ['\u00c3\u00b4', '\u00f4'],  // ô
  ['\u00c3\u00a0', '\u00e0'],  // à
  ['\u00c3\u00bb', '\u00fb'],  // û
  ['\u00c3\u00b9', '\u00f9'],  // ù
  ['\u00c3\u00af', '\u00ef'],  // ï
  ['\u00c2\u00b7', '\u00b7'],  // ·
  ['\u00e2\u009c"', '\u2713'],  // ✓ (check mark)
];

let count = 0;
for (const [bad, good] of fixes) {
  const before = c;
  c = c.split(bad).join(good);
  if (c !== before) { count++; }
}

// Also fix the shopping bag icon specifically
c = c.replace('Nouveaux produits en avant-premi\u00e8re', 'Nouveaux produits en avant-première');

// Fix shopping bag emoji separately: 🛍️
c = c.replace('\uD83D\uDECF\uFE0F', '\uD83D\uDECD\uFE0F');

fs.writeFileSync('components/ecomedia/EcomediaNotifButton.tsx', c, 'utf8');
console.log('Fixed', count, 'patterns. Sample check:');

// Verify
const v = fs.readFileSync('components/ecomedia/EcomediaNotifButton.tsx', 'utf8');
const badLines = v.split('\n').filter(l => l.includes('\u00c3') || /[\u00c2-\u00c3][\u0080-\u00bf]/.test(l));
if (badLines.length === 0) console.log('All clean!');
else { console.log('Still broken lines:', badLines.length); badLines.slice(0,5).forEach(l => console.log(' ', l.trim().slice(0,80))); }
