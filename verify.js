const fs = require('fs'), vm = require('vm');
const data = fs.readFileSync('data.js', 'utf8');
const sb = { window: {}, performance: { now: () => 0 }, requestAnimationFrame: () => 0 };
sb.console = console;
vm.createContext(sb);
vm.runInContext(data, sb);
const D = sb.window.GROKBOT_ORIGINAL;
console.log('EXPRESSIONS:', D.EXPRESSIONS.length, '(expect 26)');
console.log('states:', Object.keys(D.POOLS).length, '(expect 39)');
console.log('cadence states:', Object.keys(D.EXPR_CADENCE).length, '(expect 39)');
console.log('expr0 rings:', D.EXPRESSIONS[0].length, 'ring0 pts:', D.EXPRESSIONS[0][0].length, 'ring1 pts:', D.EXPRESSIONS[0][1].length);
// every expression has 2 rings of equal-ish point counts
let ok = true;
D.EXPRESSIONS.forEach((ex, i) => { if (ex.length !== 2 || ex[0].length < 3 || ex[1].length < 3) { ok = false; console.log('bad expr', i); } });
// every pool references valid expression indices
Object.entries(D.POOLS).forEach(([k, p]) => p.forEach(idx => { if (idx < 0 || idx >= D.EXPRESSIONS.length) { ok = false; console.log('bad pool idx', k, idx); } }));
console.log('structural check:', ok ? 'PASS' : 'FAIL');
