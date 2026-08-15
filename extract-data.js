// Extracts the window.GROKBOT_ORIGINAL = {...} data block from moodie.html
// into a standalone data.js so the pet can reuse all 25 expressions + 39 states.
const fs = require('fs');
const path = require('path');

const SRC = String.raw`C:\Users\29963\Desktop\moodie.html`;
const OUT = path.join(__dirname, 'data.js');

const src = fs.readFileSync(SRC, 'utf8');
const start = src.indexOf('window.GROKBOT_ORIGINAL = {');
if (start < 0) { console.error('data block not found'); process.exit(1); }
const end = src.indexOf('</script>', start);
const block = src.slice(start, end).trimEnd() + ';\n';

fs.writeFileSync(OUT, block);
console.log('wrote', OUT, block.length, 'chars');
// sanity: does it parse as JS?
try {
  new Function(block);
  console.log('parse: OK');
} catch (e) {
  console.error('parse error:', e.message);
  process.exit(1);
}
