// Generates a clean, standalone SVG of the pet (expression 0) for the repo.
// No desktop screenshot needed — vector, transparent, crisp at any size.
const fs = require('fs'), vm = require('vm'), path = require('path');

const data = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const sb = { window: {} };
vm.createContext(sb);
vm.runInContext(data, sb);
const D = sb.window.GROKBOT_ORIGINAL;

const smoothRing = (ring, tension = 1) => {
  if (ring.length < 3) return 'M' + ring.map(p => p[0] + ' ' + p[1]).join('L') + 'Z';
  const r = v => Math.round(v * 100) / 100;
  const n = ring.length;
  let d = `M${r(ring[0][0])},${r(ring[0][1])}`;
  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n], cur = ring[i], next = ring[(i + 1) % n], after = ring[(i + 2) % n];
    const c1 = [cur[0] + ((next[0] - prev[0]) / 6) * tension, cur[1] + ((next[1] - prev[1]) / 6) * tension];
    const c2 = [next[0] - ((after[0] - cur[0]) / 6) * tension, next[1] - ((after[1] - cur[1]) / 6) * tension];
    d += `C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(next[0])},${r(next[1])}`;
  }
  return d + 'Z';
};

const BODY = 'M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z';

const e0 = D.EXPRESSIONS[0];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="-28 -28 285 285">
  <defs><clipPath id="c"><path d="${BODY}"/></clipPath></defs>
  <path d="${BODY}" fill="#ff5d9e"/>
  <g clip-path="url(#c)">
    <path d="${smoothRing(e0[0])}" fill="#fffdf7"/>
    <path d="${smoothRing(e0[1])}" fill="#fffdf7"/>
  </g>
</svg>
`;

fs.mkdirSync(path.join(__dirname, 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'docs/preview.svg'), svg);
console.log('wrote docs/preview.svg');
