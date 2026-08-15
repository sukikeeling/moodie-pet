// Generate build/icon.ico by rasterizing the REAL pet face in pure Node:
// flatten the blob's cubic-bezier path to a polygon, use expression-0 eye rings as polygons,
// point-in-poly test, supersample+box-downsample for AA. No Electron timing dependency.
// Run: node gen-icon.js
const fs = require('fs'), path = require('path'), vm = require('vm');

const SIZES = [256, 128, 64, 48, 32, 24, 16];
const PINK = [255, 93, 158], WHITE = [255, 253, 247];
const BODY = 'M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z';

// ---- flatten the body path (M + cubic Cs + Z) into a polygon ----
function flattenBody(d) {
  const nums = (s) => s.replace(/[MCZ]/gi, ' ').trim().split(/\s+/).map(Number);
  const m = d.match(/M([\d.\-eE]+) ([\d.\-eE]+)/i);
  let cur = [m[1], m[2]];
  const poly = [cur.slice()];
  const segs = d.split('C').slice(1);
  for (const seg of segs) {
    const n = nums(seg.replace(/Z/i, ''));
    for (let k = 0; k + 5 < n.length; k += 6) {
      const c1 = [n[k], n[k + 1]], c2 = [n[k + 2], n[k + 3]], p3 = [n[k + 4], n[k + 5]];
      const STEPS = 14;
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS, mt = 1 - t;
        const x = mt * mt * mt * cur[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p3[0];
        const y = mt * mt * mt * cur[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p3[1];
        poly.push([x, y]);
      }
      cur = p3;
    }
  }
  return poly;
}
function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi)) inside = !inside;
  }
  return inside;
}
function polyBBox(poly) {
  let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
  for (const [x, y] of poly) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
  return [mnx, mny, mxx, mxy];
}

// load data.js for expression-0 eye rings
const dataSrc = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const sb = { window: {} }; vm.createContext(sb); vm.runInContext(dataSrc, sb);
const eye0 = sb.window.GROKBOT_ORIGINAL.EXPRESSIONS[0][0];
const eye1 = sb.window.GROKBOT_ORIGINAL.EXPRESSIONS[0][1];
const bodyPoly = flattenBody(BODY);
const [bnx, bny, bxx, bxy] = polyBBox(bodyPoly);

// render at R (with margin like preview.svg viewBox -28..257)
function render(R) {
  const VB = 285, OFF = 28; // data coord x -> pixel = (x+OFF)/VB*R
  const buf = Buffer.alloc(R * R * 4); // BGRA top-to-bottom
  // pixel->data coord
  const toData = (p) => (p / R) * VB - OFF;
  for (let py = 0; py < R; py++) {
    const dy = toData(py + 0.5);
    if (dy < bny - 1 || dy > bxy + 1) continue; // bbox skip rows
    for (let px = 0; px < R; px++) {
      const dx = toData(px + 0.5);
      if (dx < bnx - 1 || dx > bxx + 1) continue;
      // 2x2 supersample for AA
      let hits = 0, eyeHits = 0;
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        const X = toData(px + (sx + 0.5) / 2), Y = toData(py + (sy + 0.5) / 2);
        if (pointInPoly(X, Y, bodyPoly)) {
          hits++;
          if (pointInPoly(X, Y, eye0) || pointInPoly(X, Y, eye1)) eyeHits++;
        }
      }
      const o = (py * R + px) * 4;
      if (hits === 0) { buf[o + 3] = 0; continue; }
      const a = hits / 4;
      let r, g, b;
      if (eyeHits > 0) {
        const ew = eyeHits / 4;
        r = PINK[0] * (1 - ew) + WHITE[0] * ew;
        g = PINK[1] * (1 - ew) + WHITE[1] * ew;
        b = PINK[2] * (1 - ew) + WHITE[2] * ew;
      } else { r = PINK[0]; g = PINK[1]; b = PINK[2]; }
      buf[o] = b; buf[o + 1] = g; buf[o + 2] = r; buf[o + 3] = Math.round(a * 255);
    }
  }
  return buf;
}
// box downsample src(R) -> dst(S), area-averaged, alpha-weighted
function downsample(src, R, S) {
  const out = Buffer.alloc(S * S * 4);
  const ratio = R / S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let sr = 0, sg = 0, sb = 0, sa = 0, wsum = 0;
    const x0 = Math.floor(x * ratio), x1 = Math.floor((x + 1) * ratio);
    const y0 = Math.floor(y * ratio), y1 = Math.floor((y + 1) * ratio);
    for (let yy = y0; yy < y1 && yy < R; yy++) for (let xx = x0; xx < x1 && xx < R; xx++) {
      const o = (yy * R + xx) * 4;
      const a = src[o + 3];
      if (a === 0) continue;
      sr += src[o + 2] * a; sg += src[o + 1] * a; sb += src[o] * a; sa += a; wsum += a;
    }
    const o = (y * S + x) * 4;
    if (wsum === 0) { out[o + 3] = 0; continue; }
    out[o] = sb / wsum; out[o + 1] = sg / wsum; out[o + 2] = sr / wsum; out[o + 3] = Math.round(sa / ((x1 - x0) * (y1 - y0)));
  }
  return out;
}
function bmpEntry(size, bgra) { // bgra top-to-bottom
  const hs = 40, px = size * size * 4, andRow = Math.ceil(size / 32) * 4, andSize = andRow * size;
  const out = Buffer.alloc(hs + px + andSize);
  out.writeUInt32LE(hs, 0); out.writeInt32LE(size, 4); out.writeInt32LE(size * 2, 8);
  out.writeUInt16LE(1, 12); out.writeUInt16LE(32, 14);
  for (let y = 0; y < size; y++) bgra.copy(out, hs + y * size * 4, (size - 1 - y) * size * 4, (size - 1 - y) * size * 4 + size * 4);
  return out;
}
function buildICO(entries) {
  const h = 6, d = entries.length * 16; let off = h + d;
  for (const e of entries) { e.offset = off; off += e.bmp.length; }
  const ico = Buffer.alloc(off);
  ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(entries.length, 4);
  let p = 6;
  for (const e of entries) {
    const s = e.size === 256 ? 0 : e.size;
    ico.writeUInt8(s, p); ico.writeUInt8(s, p + 1); ico.writeUInt8(0, p + 2); ico.writeUInt8(0, p + 3);
    ico.writeUInt16LE(1, p + 4); ico.writeUInt16LE(32, p + 6);
    ico.writeUInt32LE(e.bmp.length, p + 8); ico.writeUInt32LE(e.offset, p + 12); p += 16;
  }
  for (const e of entries) e.bmp.copy(ico, e.offset);
  return ico;
}

const R = 512;
const hi = render(R);
const entries = SIZES.map(s => ({ size: s, bmp: bmpEntry(s, downsample(hi, R, s)) }));
const outDir = path.join(__dirname, 'build');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildICO(entries));
// 256 preview bmp
const p256 = downsample(hi, R, 256);
const bmp = Buffer.alloc(54 + 256 * 256 * 4);
bmp.write('BM'); bmp.writeUInt32LE(54 + 256 * 256 * 4, 2); bmp.writeUInt32LE(54, 10);
bmp.writeUInt32LE(40, 14); bmp.writeInt32LE(256, 18); bmp.writeInt32LE(256, 22);
bmp.writeUInt16LE(1, 26); bmp.writeUInt16LE(32, 28);
for (let y = 0; y < 256; y++) p256.copy(bmp, 54 + y * 256 * 4, (255 - y) * 256 * 4, (255 - y) * 256 * 4 + 256 * 4);
fs.writeFileSync(path.join(outDir, 'icon-preview.bmp'), bmp);
console.log('wrote build/icon.ico + preview (pure-node rasterizer, 7 sizes)');
