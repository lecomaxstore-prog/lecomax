import { readFileSync } from 'fs';
const c = readFileSync('app/admin/analytics/page.tsx', 'utf8');
// Check for remaining mojibake
const suspect = c.match(/[^\x00-\x7F]{3,}/g) || [];
const unique = [...new Set(suspect)].slice(0, 30);
if (unique.length) {
  console.log('Multi-byte sequences found (first 30 unique):');
  unique.forEach(s => console.log(JSON.stringify(s), '->', s));
} else {
  console.log('File looks clean (only ASCII or valid unicode)');
}
// Sample French strings
const lines = c.split('\n').filter(l => /[éèêàôîûç—↑↓]/.test(l));
console.log('\nLines with special chars (first 10):');
lines.slice(0, 10).forEach(l => console.log(l.trim()));
