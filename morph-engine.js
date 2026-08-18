"use strict";
/* ============================================================
   morph-engine.js — 身体形态 morph 引擎（形状定义 + 弹簧插值 + 贝塞尔缓动 + 变形秀）
   从 pet.html 拆出，保持所有全局变量名不变
   ============================================================ */

/* ---- 通用工具 ---- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const centroid = ring => ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
const path = ring => 'M' + ring.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L') + 'Z';
const smoothRing = (ring, tension = 1) => {
  if (ring.length < 3) return path(ring);
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
const normalizeProgress = p => ((p % 1) + 1) % 1;

/* ---- 弹簧 ---- */
class Spring {
  constructor(value, stiffness = 210, damping = 22, mass = 0.8) {
    this.x = value; this.v = 0;
    this.stiffness = stiffness; this.damping = damping; this.mass = mass;
    this.target = value;
  }
  step(target, dt) {
    const a = (-this.stiffness * (this.x - target) - this.damping * this.v) / this.mass;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

/* ---- 身体形状定义（Grok 同源 48 点环） ---- */
const GROKBOT_SHAPES = [
  ['blob','原始形态','M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z', 1],
  ['pebble','鹅卵石','M114 8C177 8 217 45 217 109C217 178 181 219 112 219C43 219 12 181 12 113C12 48 51 8 114 8Z', 1],
  ['squircle','圆角方','M55 10H174Q219 10 219 55V174Q219 219 174 219H55Q10 219 10 174V55Q10 10 55 10Z', .3],
  ['capsule','胶囊','M61 31H168C202 31 220 65 220 114C220 163 202 197 168 197H61C27 197 9 163 9 114C9 65 27 31 61 31Z', .55],
  ['triangle','三角体','M114 9Q122 9 128 21L220 194Q227 210 207 210H21Q1 210 9 194L101 21Q106 9 114 9Z', .12],
  ['hex','六边体','M114 5L207 58Q218 64 218 78V153Q218 167 207 173L128 218Q114 226 100 218L21 173Q10 167 10 153V78Q10 64 21 58L100 12Q114 5 114 5Z', .25],
  ['cloud','云朵','M114.27,40.04C117.48,41.88 120.11,45.68 123.18,46.6C126.25,47.52 129.3,46.02 132.68,45.55C136.06,45.08 139.84,43.93 143.47,43.78C147.1,43.63 150.87,43.93 154.46,44.66C158.05,45.39 161.67,46.59 164.99,48.17C168.31,49.75 171.54,51.81 174.39,54.15C177.24,56.5 179.88,59.27 182.07,62.24C184.27,65.21 186.15,68.54 187.56,71.95C188.97,75.36 189.67,79.13 190.53,82.68C191.39,86.23 190.73,89.92 192.72,93.25C194.72,96.58 199.7,99.15 202.5,102.65C205.3,106.15 207.72,110.16 209.51,114.27C211.3,118.38 212.59,122.87 213.26,127.3C213.93,131.73 214.02,136.41 213.51,140.86C213.01,145.31 211.87,149.85 210.23,154.02C208.59,158.19 206.32,162.28 203.65,165.88C200.98,169.48 197.74,172.83 194.23,175.62C190.72,178.41 186.71,180.82 182.6,182.6C178.49,184.38 173.55,184.91 169.55,186.32C165.55,187.73 162.02,189.06 158.61,191.06C155.2,193.06 152.48,196.21 149.08,198.31C145.68,200.41 141.99,202.23 138.22,203.64C134.45,205.05 130.44,206.13 126.45,206.79C122.46,207.45 118.31,207.72 114.27,207.58C110.23,207.45 106.12,206.89 102.2,205.98C98.28,205.07 94.38,203.74 90.74,202.1C87.1,200.46 83.81,198 80.35,196.15C76.89,194.3 73.96,192.08 69.97,191C65.98,189.92 60.83,190.66 56.41,189.67C52,188.68 47.55,187.11 43.48,185.06C39.41,183.01 35.47,180.38 32.01,177.39C28.55,174.4 25.37,170.86 22.74,167.11C20.11,163.36 17.89,159.15 16.26,154.87C14.64,150.59 13.51,145.96 12.99,141.41C12.47,136.86 12.52,132.11 13.12,127.59C13.72,123.07 14.93,118.49 16.61,114.27C18.29,110.05 20.56,105.94 23.19,102.28C25.82,98.62 29.65,95.49 32.38,92.33C35.11,89.17 38.17,86.75 39.59,83.34C41.01,79.94 40.01,75.63 40.88,71.9C41.75,68.17 43.09,64.42 44.81,60.97C46.53,57.52 48.72,54.17 51.2,51.2C53.69,48.23 56.61,45.48 59.72,43.17C62.83,40.86 66.31,38.88 69.86,37.36C73.41,35.84 77.26,34.72 81.05,34.07C84.84,33.42 88.81,33.24 92.62,33.48C96.43,33.72 100.29,34.45 103.9,35.54C107.51,36.63 111.06,38.2 114.27,40.04Z', 1],
  ['drop','水滴','M114 5C137 42 202 103 202 151C202 196 165 222 114 222C63 222 26 196 26 151C26 103 91 42 114 5Z', 1],
  ['egg','蛋形','M114.27 8C150 8 198 22 198 96C198 178 158 225 114.27 225C70 225 30 178 30 96C30 22 78 8 114.27 8Z', 1],
  ['bean','豆形','M196 90C196 160 170 215 114 215C90 215 70 205 60 188C52 175 52 150 58 128C46 120 40 105 40 90C40 45 70 20 114 20C158 20 196 45 196 90Z', .8],
  ['teardrop','水滴2','M114.27 6C168 6 200 40 200 92C200 150 160 205 114.27 224C68 205 28 150 28 92C28 40 60 6 114.27 6Z', 1],
  ['exclaim','感叹号','M86 40Q86 30 96 30L132 30Q142 30 142 40L142 180Q142 190 132 190L96 190Q86 190 86 180Z', .45],
];

/* ---- 环采样：从 SVG path 提取 48 等分点，质心角对齐 ---- */
const shapeRingCache = new Map();
function sampleShapeRing(d, n = 48) {
  const svg = document.querySelector('#bot');
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tmp.setAttribute('d', d);
  svg.appendChild(tmp);
  const L = tmp.getTotalLength();
  const M = 360, pts = [];
  for (let i = 0; i < M; i++) { const p = tmp.getPointAtLength((L * i) / M); pts.push([p.x, p.y]); }
  svg.removeChild(tmp);
  const cx = pts.reduce((a, p) => a + p[0], 0) / M;
  const cy = pts.reduce((a, p) => a + p[1], 0) / M;
  const ring = [];
  const binHalf = (Math.PI * 2 / n) * 0.8;
  const angDiff = (a1, a2) => Math.abs(((a1 - a2 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    let best = -1, bestDist = -Infinity, bestDiff = Infinity;
    for (let j = 0; j < M; j++) {
      const p = pts[j];
      const diff = angDiff(Math.atan2(p[1] - cy, p[0] - cx), ang);
      if (diff > binHalf) continue;
      const d0 = Math.hypot(p[0] - cx, p[1] - cy);
      if (d0 > bestDist || (d0 === bestDist && diff < bestDiff)) { bestDist = d0; bestDiff = diff; best = j; }
    }
    if (best >= 0) {
      ring.push([+pts[best][0].toFixed(3), +pts[best][1].toFixed(3)]);
    } else {
      let fb = -1, fbDiff = Infinity;
      for (let j = 0; j < M; j++) {
        const p = pts[j];
        const diff = angDiff(Math.atan2(p[1] - cy, p[0] - cx), ang);
        if (diff < fbDiff) { fbDiff = diff; fb = j; }
      }
      const p = fb >= 0 ? pts[fb] : [cx, cy];
      ring.push([+p[0].toFixed(3), +p[1].toFixed(3)]);
    }
  }
  return ring;
}
function shapeRing(id) {
  if (shapeRingCache.has(id)) return shapeRingCache.get(id);
  const item = GROKBOT_SHAPES.find(s => s[0] === id);
  if (!item) return null;
  const ring = sampleShapeRing(item[2]);
  shapeRingCache.set(id, ring);
  return ring;
}
let selectedShape = GROKBOT_SHAPES[0];

/* ---- 贝塞尔弹簧缓动（svg-film skill 同款 cubic-bezier(0.34, 1.18, 0.30, 1)） ---- */
function bezierEase(x1, y1, x2, y2) {
  const cx = 3 * x1, cy = 3 * y1;
  const bx = 3 * (x2 - x1) - cx, by = 3 * (y2 - y1) - cy;
  const ax = 1 - cx - bx, ay = 1 - cy - by;
  return function (p) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const e = ((ax * t + bx) * t + cx) * t - p;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const SPRING_EASE = bezierEase(0.34, 1.18, 0.30, 1);
const SHAPE_MORPH_MS = 480;
let shapeFrom = null, shapeTo = null, shapeCurId = 'blob';
let shapeMorphStart = 0;

/* ---- morph 流程 ---- */
function startShapeMorph(id) {
  const to = shapeRing(id);
  if (!to || id === shapeCurId) return;
  shapeFrom = shapeCurId ? curShapeRing() : shapeRing('blob');
  shapeTo = to;
  shapeMorphStart = performance.now();
  shapeCurId = id;
}
function shapeProgress() {
  return clamp((performance.now() - shapeMorphStart) / SHAPE_MORPH_MS, 0, 1);
}
function curShapeRing() {
  const t = SPRING_EASE(shapeProgress());
  const from = shapeFrom || shapeRing(shapeCurId) || shapeRing('blob');
  const to = shapeTo || shapeRing(shapeCurId) || from;
  return from.map((p, i) => [p[0] + (to[i][0] - p[0]) * t, p[1] + (to[i][1] - p[1]) * t]);
}
function applyShape(id) {
  const item = GROKBOT_SHAPES.find(s => s[0] === id);
  if (!item) return;
  stopShapeShow();
  selectedShape = item;
  startShapeMorph(id);
}

/* ---- 变形秀：圆 → 随机形状 → 圆 ---- */
const SHOW_SHAPES = GROKBOT_SHAPES.filter(s => s[0] !== 'blob' && s[0] !== 'exclaim').map(s => s[0]);
let shapeShow = null, shapeShowStep = 0, shapeShowSeq = [];
function startShapeShow() {
  if (shapeShow) return;
  const target = SHOW_SHAPES[Math.floor(Math.random() * SHOW_SHAPES.length)];
  shapeShowSeq = ['blob', target, 'blob'];
  shapeShow = { timer: null };
  shapeShowStep = 0;
  fxLayer.classList.add('fx-orbit');
  shapeShowTick();
}
function stopShapeShow() {
  if (!shapeShow) return;
  clearTimeout(shapeShow.timer);
  shapeShow = null;
  fxLayer.classList.remove('fx-orbit');
  if (shapeCurId !== selectedShape[0]) startShapeMorph(selectedShape[0]);
}
function shapeShowTick() {
  if (!shapeShow) return;
  if (shapeShowStep >= shapeShowSeq.length) { stopShapeShow(); return; }
  startShapeMorph(shapeShowSeq[shapeShowStep]);
  shapeShowStep++;
  shapeShow.timer = setTimeout(shapeShowTick, 3400);
}