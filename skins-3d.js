/* ============================================================
   skins-3d.js —— Moodie 桌宠 v2.0 · 3D 主题皮肤合流引擎
   收拢两大分支仓库核心资产：
     1. ceramic-bot-3d     -> 🏺 3D 骨瓷天使球 (theme: 'ceramic')
        - 手工微起伏温润骨瓷球体 + 双侧白瓷小萌翼（黄铜轴套呼吸扇动）
        - 头顶悬浮拉丝黄铜/流金天使光环 + 3D 凸起白瓷大眼 (EyeMesh)
        - 3D 环绕星点公转 + 3D 粒子喷射 + 雷达波纹 + 骨瓷黄铜艺术展台
     2. submarine-cabin-bot -> 🫧 深海驾驶舱全息球 (theme: 'submarine')
        - 球面全息投影 (FaceCanvas -> 3D Sphere UV) + 拉丝黄铜经纬笼架
        - 双层车削黄铜全息发射底座 + 蓝晶发光透镜 + 向上投射全息聚能光锥
        - 左右双翼全息遥测副屏（左屏实时接入系统 CPU/内存/Agent 状态遥测，右屏 360° 战术声纳雷达）
        - 3D 深海上升气泡群 (InstancedMesh) + 生物发光浮游孢子群
   ============================================================ */
import * as THREE from "three";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const FACE_RADIUS = 0.74;
const EYE_RADIUS = 0.145;
const EYE_THICK = 0.038;
const UP = new THREE.Vector3(0, 1, 0);

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function smooth01(value) {
  return value * value * (3 - 2 * value);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   1. 共享物理弹簧与 FaceEngine（直接复用 window.GROKBOT_ORIGINAL）
   ============================================================ */
class Spring {
  constructor(value, stiffness = 210, damping = 22, mass = 0.8) {
    this.x = value;
    this.v = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.target = value;
  }
  step(target, dt) {
    const a = (-this.stiffness * (this.x - target) - this.damping * this.v) / this.mass;
    this.v += a * dt;
    this.x += this.v * dt;
    return this.x;
  }
}

const PERF_PALETTE = [
  { y: -2, scaleY: 0.92 },
  { y: -5, rotate: 2, scaleX: 1.08, scaleY: 1.12 },
  { y: 3, scaleX: 0.97, scaleY: 1.03 },
  { rotate: 4, scaleX: 1.04 },
  { rotate: -5, y: 1 },
  { scaleX: 1.03, scaleY: 0.97, y: -1 },
  { y: 4, rotate: -3, scaleX: 0.98, scaleY: 1.02 },
  { rotate: 6, scaleY: 0.94, y: -3 },
  { y: -6, scaleX: 0.94, scaleY: 1.12 },
  { scaleX: 1.06, scaleY: 1.06, rotate: -2 },
];

const REACTION_FRAMES = {
  bounce: { y: [0, -11, 3.5, -1, 0], rotate: [0, -2.5, 2, -0.7, 0], scale: [1, 0.96, 1.025, 0.99, 1] },
  squash: { scaleX: [1, 1.045, 0.978, 1.012, 1], scaleY: [1, 0.95, 1.028, 0.992, 1], y: [0, 5, -3, 1, 0] },
  tilt: { rotate: [0, -8, 6, -2, 0], y: [0, 3, -2, 0.5, 0] },
  spin: { rotate: [0, 14, -12, 7, 0], scale: [1, 0.93, 1.045, 0.985, 1] },
};
const REACTION_TIMES = [0, 0.22, 0.58, 0.82, 1];
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const STATE_REACTION = {
  excited: "bounce", happy: "bounce", laughing: "bounce", playful: "bounce",
  celebrate: "bounce", bouncing: "bounce",
  sad: "squash", angry: "squash", suspicious: "squash", drowsy: "squash",
  listening: "tilt", thinking: "tilt", curious: "tilt", confused: "tilt",
  shy: "tilt", dragging: "tilt", bored: "tilt", proud: "tilt",
  orbit: "spin", radar: "spin", progress: "spin",
};
const EXPR_ACTIONS = ["tilt", "bounce", "squash", "spin", "none"];
const STATE_LOOP = {
  sleeping: { y: [3, 1.2] }, waking: { y: [2, 2.4], rot: [1, 2.2] }, idle: { y: [1, 1.8] },
  listening: { eyeX: [4, 2.2], rot: [1.5, 1.6] }, thinking: { rot: [3, 1.4], y: [1.5, 2.0] },
  searching: { eyeX: [10, 1.6], rot: [2, 1.8] }, working: { y: [2, 4.5], rot: [1, 4] },
  excited: { y: [6, 3.2], sx: [0.03, 3.2], sy: [0.03, 3.2] },
  surprised: { sx: [0.04, 4], sy: [0.04, 4] },
  suspicious: { rot: [4, 1.2], eyeX: [3, 1.2] },
  angry: { y: [2, 3], rot: [3, 3] }, drowsy: { y: [3, 1.1], rot: [2, 0.9] },
  happy: { y: [4, 2.8], rot: [2, 2.8] }, curious: { eyeX: [6, 1.5], rot: [2, 1.5] },
  confused: { rot: [5, 1.3], eyeX: [4, 2.6] }, bored: { y: [2, 1.0], rot: [1, 0.8] },
  proud: { y: [2, 2.2], rot: [-2, 2.2] }, shy: { y: [2, 2.5], rot: [3, 2.5], sx: [0.02, 2.5] },
  sad: { y: [2, 1.3], rot: [1, 1.3] }, laughing: { y: [7, 4.2], sx: [0.04, 4.2] },
  scared: { y: [3, 5], sx: [0.03, 5] }, playful: { rot: [5, 2.2], y: [3, 2.2] },
  celebrate: { y: [8, 3.6], rot: [4, 3.6], spin: true }, orbit: { spin: true, y: [2, 2] },
  radar: { eyeX: [12, 1.2], eyeY: [8, 1.2] }, progress: { eyeX: [10, 1.8] },
  spawning: { sx: [0.06, 3], sy: [0.06, 3] }, humming: { y: [2, 2.6] },
  loading: { eyeY: [6, 1.5], y: [3, 1.5] }, dictating: { rot: [2, 2.8], y: [1.5, 2.8] },
  writing: { y: [1.5, 3.2], rot: [1, 3.2] }, sending: { eyeX: [8, 1.8], y: [2, 1.8] },
  receiving: { eyeX: [-8, 1.8], y: [2, 1.8] }, uploading: { y: [3, 2.4], eyeY: [4, 2.4] },
  notifying: { y: [4, 3.4], rot: [2, 3.4] }, alerting: { y: [3, 4.5], sx: [0.03, 4.5] },
  dragging: { eyeX: [6, 1.4], y: [2, 1.4] }, bouncing: { y: [10, 3.0] },
  "powering-down": { y: [2, 0.8], rot: [2, 0.7] },
};

const FX_RING_STATES = new Set(["orbit", "radar", "loading", "alerting", "searching", "working"]);
const FX_PARTICLE_RATES = {
  happy: 360, excited: 220, sleeping: 600, humming: 520, thinking: 700,
  working: 280, celebrate: 90, sad: 500, surprised: 380, scared: 420, angry: 340, laughing: 300, alerting: 260,
};
const EFFECT_STATES = [
  "orbit", "radar", "loading", "alerting", "searching", "celebrate", "happy",
  "excited", "sleeping", "humming", "thinking", "working", "surprised", "laughing",
];

const BLOB_PATH =
  "M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z";

class FaceEngine3D {
  constructor({ data, onLine = null, onState = null, onFx = null } = {}) {
    this.data = data || window.GROKBOT_ORIGINAL;
    this.allStates = Object.values(this.data.GROUPS).flat();
    this.onLine = onLine;
    this.onState = onState;
    this.onFx = onFx;
    this.reset();
    this.start();
  }

  reset() {
    this.expression = 0;
    this.current = this.data.EXPRESSIONS[0].map((r) => r.map((p) => [...p]));
    this.target = this.data.EXPRESSIONS[0];
    this.morph = 1;
    this.velocity = 0;
    this.activeState = "idle";
    this.last = performance.now();
    this.blinkStart = 0;
    this.gazeX = 0;
    this.gazeY = 0;
    this.turn = 0;
    this.eyePulse = 0;
    this.reaction = null;
    this.line = "待机中";
    this.color = "#ff2d8b";
    this.paused = false;
    this.bodySprings = {
      y: new Spring(0, 170, 15),
      rotate: new Spring(0, 170, 15),
      scaleX: new Spring(1, 170, 15),
      scaleY: new Spring(1, 170, 15),
    };
    this.bodyTilt = new Spring(0, 120, 18);
    this.yawSpring = new Spring(0, 150, 16);
    this.pitchSpring = new Spring(0, 150, 16);
    this._timers = {};
    this._fxRunning = null;
  }

  rings() {
    return this.current.map((ring, e) =>
      ring.map((p, i) => [
        p[0] + (this.target[e][i][0] - p[0]) * clamp(this.morph, 0, 1),
        p[1] + (this.target[e][i][1] - p[1]) * clamp(this.morph, 0, 1),
      ])
    );
  }

  chooseExpression(index) {
    const safeIdx = clamp(index, 0, this.data.EXPRESSIONS.length - 1);
    this.current = this.rings();
    this.target = this.data.EXPRESSIONS[safeIdx];
    this.expression = safeIdx;
    this.morph = 0;
    this.velocity = 0;
    const perf = PERF_PALETTE[safeIdx % PERF_PALETTE.length];
    const s = this.bodySprings;
    s.y.target = perf.y ?? 0;
    s.rotate.target = perf.rotate ?? 0;
    s.scaleX.target = perf.scaleX ?? 1;
    s.scaleY.target = perf.scaleY ?? 1;
    s.y.v = (perf.y ?? 0) * 0.22;
    s.rotate.v = (perf.rotate ?? 0) * 0.18;
    s.scaleX.v = ((perf.scaleX ?? 1) - 1) * 0.25;
    s.scaleY.v = ((perf.scaleY ?? 1) - 1) * 0.25;
    const actType = STATE_REACTION[this.activeState] || EXPR_ACTIONS[safeIdx % EXPR_ACTIONS.length];
    if (actType !== "none") this.reaction = { type: actType, t: 0, dur: 620 };
    this.eyePulse = 1;
    this.blink();
  }

  blink() {
    this.blinkStart = performance.now();
  }

  blinkScale(now) {
    if (!this.blinkStart) return 1;
    const t = (now - this.blinkStart) / 320;
    if (t >= 1) {
      this.blinkStart = 0;
      return 1;
    }
    return Math.max(t < 0.42 ? 1 - t / 0.42 : (t - 0.42) / 0.58, 0.04);
  }

  frame(now) {
    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    this.velocity += (-12 * this.velocity - 42 * (this.morph - 1)) * dt;
    this.morph += this.velocity * dt;
    if (!Number.isFinite(this.morph)) {
      this.morph = 1;
      this.velocity = 0;
    }

    const shown = this.rings();
    const bs = this.blinkScale(now);
    const rad = (this.turn * Math.PI) / 180;
    this.eyePulse = Math.max(0, this.eyePulse - dt * 3.2);
    const pulseScale = 1 + Math.sin(this.eyePulse * Math.PI) * 0.14;
    const loop = STATE_LOOP[this.activeState] || null;
    let loopEyeX = 0;
    let loopEyeY = 0;
    if (loop) {
      const t = now / 1000;
      if (loop.eyeX) loopEyeX = Math.sin(t * loop.eyeX[1]) * loop.eyeX[0];
      if (loop.eyeY) loopEyeY = Math.sin(t * loop.eyeY[1]) * loop.eyeY[0];
    }

    const eyeTransforms = shown.map((ring) => {
      const c = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
      const base = Math.asin(clamp((c[0] - 114.2705) / 105, -1, 1));
      const longitude = base + rad;
      const depth = Math.cos(longitude);
      const perspective = Math.max(depth, 0.02) / Math.max(Math.cos(base), 0.02);
      const x = 114.2705 + 105 * Math.sin(longitude) + this.gazeX + loopEyeX;
      const y = c[1] + this.gazeY + loopEyeY;
      return {
        tx: x,
        ty: y,
        sx: clamp(perspective, 0.02, 2.4) * pulseScale,
        sy: bs,
        opacity: depth > 0.02 ? 1 : 0,
      };
    });

    const s = this.bodySprings;
    const bodyY = s.y.step(s.y.target, dt);
    const bodyRot = s.rotate.step(s.rotate.target, dt);
    const bodySX = s.scaleX.step(s.scaleX.target, dt);
    const bodySY = s.scaleY.step(s.scaleY.target, dt);
    const t = now / 1000;
    const breathY = Math.sin(t * 2.1) * 1.4;
    const breathRot = Math.sin(t * 1.7) * 0.6;
    const breathScale = 1 + Math.sin(t * 2.6) * 0.008;
    const tiltVal = this.bodyTilt.step(this.bodyTilt.target ?? 0, dt);

    let rY = 0, rRot = 0, rScale = 1, rSX = 1, rSY = 1;
    if (this.reaction) {
      this.reaction.t += dt * 1000;
      const p = clamp(this.reaction.t / this.reaction.dur, 0, 1);
      const frames = REACTION_FRAMES[this.reaction.type];
      const evalF = (arr) => {
        for (let i = 1; i < REACTION_TIMES.length; i += 1) {
          if (p <= REACTION_TIMES[i]) {
            const local = (p - REACTION_TIMES[i - 1]) / (REACTION_TIMES[i] - REACTION_TIMES[i - 1]);
            return arr[i - 1] + (arr[i] - arr[i - 1]) * easeOutCubic(local);
          }
        }
        return arr[arr.length - 1];
      };
      if (frames) {
        if (frames.y) rY = evalF(frames.y);
        if (frames.rotate) rRot = evalF(frames.rotate);
        if (frames.scale) rScale = evalF(frames.scale);
        if (frames.scaleX) rSX = evalF(frames.scaleX);
        if (frames.scaleY) rSY = evalF(frames.scaleY);
      }
      if (p >= 1) this.reaction = null;
    }

    let loopY = 0, loopRot = 0, loopSX = 1, loopSY = 1;
    if (loop) {
      const tt = now / 1000;
      if (loop.y) loopY = Math.sin(tt * loop.y[1]) * loop.y[0];
      if (loop.rot) loopRot = Math.sin(tt * loop.rot[1]) * loop.rot[0];
      if (loop.sx) loopSX = 1 + Math.sin(tt * loop.sx[1]) * loop.sx[0];
      if (loop.sy) loopSY = 1 + Math.sin(tt * loop.sy[1]) * loop.sy[0];
      if (loop.spin) loopRot = (now * 0.05) % 360;
    }

    const finalY = bodyY + rY + breathY + loopY;
    const finalRot = bodyRot + rRot + breathRot + tiltVal + loopRot;
    const finalSX = bodySX * rSX * rScale * breathScale * loopSX;
    const finalSY = bodySY * rSY * rScale * (2 - breathScale) * loopSY;

    const yaw = this.yawSpring.step(this.yawSpring.target, dt);
    const pitch = this.pitchSpring.step(this.pitchSpring.target, dt);

    return {
      rings: shown,
      eyeTransforms,
      body: { y: finalY, rot: finalRot, sx: finalSX, sy: finalSY },
      yaw,
      pitch,
      state: this.activeState,
      line: this.line,
      color: this.color,
      now,
    };
  }

  setGaze(nx, ny) {
    this.gazeX = clamp(nx, -1, 1) * 22;
    this.gazeY = clamp(ny, -1, 1) * 14;
    this.bodyTilt.target = clamp(nx * 4, -4, 4);
  }
  clearGaze() {
    this.gazeX = 0;
    this.gazeY = 0;
    this.bodyTilt.target = 0;
  }
  setTurn(yaw, pitch) {
    this.yawSpring.target = clamp(yaw, -44, 44);
    this.pitchSpring.target = clamp(pitch, -26, 26);
  }
  releaseTurn() {
    this.yawSpring.target = 0;
    this.pitchSpring.target = 0;
  }

  boop(customLine) {
    this.reaction = { type: "squash", t: 0, dur: 620 };
    this.eyePulse = 1;
    this.blink();
    this.line = customLine || "嘿嘿~被摸头啦 ✨";
    if (this.onLine) this.onLine(this.line, this.activeState);
    if (this.onFx) {
      for (let i = 0; i < 4; i += 1) {
        setTimeout(() => this.onFx("particle", "happy"), i * 150);
      }
    }
  }

  pickState() {
    const r = Math.random();
    if (r < 0.35) return EFFECT_STATES[Math.floor(Math.random() * EFFECT_STATES.length)];
    const prod = this.data.GROUPS["Cycle produit"] || this.allStates;
    if (r < 0.72) return prod[Math.floor(Math.random() * prod.length)];
    return this.allStates[Math.floor(Math.random() * this.allStates.length)];
  }

  setState(name, customLine) {
    this.activeState = name;
    const pool = this.data.POOLS[name];
    if (pool && pool.length) {
      this.chooseExpression(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      this.chooseExpression(Math.floor(Math.random() * this.data.EXPRESSIONS.length));
    }
    if (customLine) {
      this.line = customLine;
    }
    if (this.onLine) this.onLine(this.line, name);
    if (this.onState) this.onState(name);
    if (FX_RING_STATES.has(name) && this.onFx) this.onFx("ring", name);
    if (this._fxRunning) {
      clearInterval(this._fxRunning);
      this._fxRunning = null;
    }
    const rate = FX_PARTICLE_RATES[name];
    if (rate && this.onFx) {
      this._fxRunning = setInterval(() => {
        if (!this.paused) this.onFx("particle", name);
      }, rate);
    }
  }

  changeState() {
    this._clearTimer("state");
    if (this.paused) {
      this._setTimer("state", () => this.changeState(), 3000);
      return;
    }
    let s = this.pickState();
    if (s === this.activeState && this.allStates.length > 1) s = this.pickState();
    this.setState(s);
    this._setTimer("state", () => this.changeState(), 7200 + Math.random() * 5500);
  }

  cycleExpr() {
    this._clearTimer("expr");
    if (this.paused) {
      this._setTimer("expr", () => this.cycleExpr(), 2000);
      return;
    }
    const pool = this.data.POOLS[this.activeState] || [];
    if (pool.length) {
      let idx = pool[Math.floor(Math.random() * pool.length)];
      if (idx === this.expression && pool.length > 1) idx = pool[Math.floor(Math.random() * pool.length)];
      this.chooseExpression(idx);
    }
    const cad = this.data.EXPR_CADENCE[this.activeState] || [3000, 5000];
    this._setTimer("expr", () => this.cycleExpr(), cad[0] + Math.random() * (cad[1] - cad[0]));
  }

  scheduleBlink() {
    this._clearTimer("blink");
    this._setTimer("blink", () => {
      if (!this.paused && this.data.BLINK[this.activeState]) this.blink();
      this.scheduleBlink();
    }, 2200 + Math.random() * 3000);
  }

  _setTimer(k, fn, ms) {
    this._timers[k] = setTimeout(fn, ms);
  }
  _clearTimer(k) {
    if (this._timers[k]) {
      clearTimeout(this._timers[k]);
      delete this._timers[k];
    }
  }
  setColor(hex) {
    this.color = hex;
  }
  start() {
    this.cycleExpr();
    this.changeState();
    this.scheduleBlink();
  }
  dispose() {
    for (const k of Object.keys(this._timers)) this._clearTimer(k);
    if (this._fxRunning) clearInterval(this._fxRunning);
  }
}

/* ============================================================
   2. 摄影棚 HDRI 环境贴图生成（供骨瓷釉面与拉丝黄铜高光反射）
   ============================================================ */
function buildStudioEnvironment() {
  const width = 256;
  const height = 128;
  const data = new Float32Array(width * height * 4);
  const softboxes = [
    { direction: new THREE.Vector3(0.45, 0.85, 0.35).normalize(), intensity: 5.2, exponent: 16, color: [1, 0.98, 0.94] },
    { direction: new THREE.Vector3(-0.85, 0.25, 0.15).normalize(), intensity: 1.5, exponent: 7, color: [0.82, 0.9, 1] },
    { direction: new THREE.Vector3(0.15, 0.35, -0.95).normalize(), intensity: 2.6, exponent: 12, color: [1, 0.86, 0.66] },
    { direction: new THREE.Vector3(0.95, 0.05, 0.3).normalize(), intensity: 0.9, exponent: 9, color: [1, 0.95, 0.85] },
    { direction: new THREE.Vector3(0, -1, 0).normalize(), intensity: 0.5, exponent: 4, color: [1, 0.93, 0.82] },
  ];
  const direction = new THREE.Vector3();
  for (let y = 0; y < height; y += 1) {
    const phi = ((y + 0.5) / height) * Math.PI;
    for (let x = 0; x < width; x += 1) {
      const theta = ((x + 0.5) / width) * TAU;
      direction.set(-Math.sin(phi) * Math.sin(theta), Math.cos(phi), -Math.sin(phi) * Math.cos(theta));
      const up = direction.y * 0.5 + 0.5;
      let red = THREE.MathUtils.lerp(0.32, 1.05, smooth01(up)) * 0.9;
      let green = red * 0.985;
      let blue = red * 0.94;
      for (const sb of softboxes) {
        const w = sb.intensity * Math.pow(Math.max(direction.dot(sb.direction), 0), sb.exponent);
        red += w * sb.color[0];
        green += w * sb.color[1];
        blue += w * sb.color[2];
      }
      const idx = (y * width + x) * 4;
      data[idx] = red;
      data[idx + 1] = green;
      data[idx + 2] = blue;
      data[idx + 3] = 1;
    }
  }
  const env = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  env.mapping = THREE.EquirectangularReflectionMapping;
  env.magFilter = THREE.LinearFilter;
  env.minFilter = THREE.LinearFilter;
  env.needsUpdate = true;
  return env;
}

/* ============================================================
   3. 主题皮肤一：🏺 3D 立体骨瓷天使球 (ceramic-bot-3d)
   ============================================================ */
class EyeMesh3D {
  constructor(segments = 36, isRight = false) {
    this.segments = segments;
    this.isRight = isRight;
    this.geometry = this._buildGeometry(segments);
    this.mesh = new THREE.Mesh(this.geometry, null);
    this._center = new THREE.Vector3();
    this._disk = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._t = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._n = new THREE.Vector3();
    this._pn = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._pos = this.geometry.attributes.position;
  }

  _buildGeometry(segments) {
    const vertexCount = 1 + segments * 2;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const indices = [];
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      indices.push(0, 1 + i, 1 + next);
    }
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      const t0 = 1 + i, t1 = 1 + next, b0 = 1 + segments + i, b1 = 1 + segments + next;
      indices.push(t0, b0, t1, t1, b0, b1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setIndex(indices);
    return geo;
  }

  update(ring, tr, faceCenter) {
    const segs = this.segments;
    const pos = this._pos;
    const sx = THREE.MathUtils.clamp(tr.sx ?? 1, 0.65, 1.3);
    const sy = tr.sy ?? 1;

    // 融合视线偏移与表情质心变化
    const gazeShiftX = ((tr.tx ?? 114.27) - 114.27) * 0.0022;
    const gazeShiftY = -((tr.ty ?? 114.0) - 114.0) * 0.0022;
    const angleX = (this.isRight ? 0.22 : -0.22) + gazeShiftX;
    const angleY = 0.02 + gazeShiftY;
    const nx = Math.sin(angleX);
    const ny = Math.sin(angleY);
    const nz = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
    this._n.set(nx, ny, nz).normalize();

    this._t.crossVectors(UP, this._n).normalize();
    this._b.crossVectors(this._n, this._t).normalize();
    this._center.copy(this._n).multiplyScalar(FACE_RADIUS);

    const rx = EYE_RADIUS * 1.05 * sx;
    const ry = EYE_RADIUS * 1.05 * Math.max(0.08, sy);
    const centerThick = EYE_THICK + 0.016;

    this._p.copy(this._center);
    this._pn.copy(this._p).sub(faceCenter).normalize();
    pos.setXYZ(0, this._p.x + this._pn.x * centerThick, this._p.y + this._pn.y * centerThick, this._p.z + this._pn.z * centerThick);

    for (let i = 0; i < segs; i += 1) {
      const theta = (i / segs) * TAU;
      const u = Math.cos(theta) * rx;
      const v = Math.sin(theta) * ry;
      this._disk.copy(this._center).addScaledVector(this._t, u).addScaledVector(this._b, v);
      this._dir.copy(this._disk).sub(faceCenter).normalize();
      this._p.copy(this._dir).multiplyScalar(FACE_RADIUS);
      this._pn.copy(this._p).sub(faceCenter).normalize();

      const topIdx = 1 + i;
      pos.setXYZ(topIdx, this._p.x + this._pn.x * EYE_THICK, this._p.y + this._pn.y * EYE_THICK, this._p.z + this._pn.z * EYE_THICK);
      const botIdx = 1 + segs + i;
      pos.setXYZ(botIdx, this._p.x, this._p.y, this._p.z);
    }

    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  dispose() {
    this.geometry.dispose();
  }
}

function createPorcelainMaterial(colorHex) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    sheen: 0.88,
    sheenRoughness: 0.18,
    sheenColor: new THREE.Color(0xffffff),
    reflectivity: 0.95,
    envMapIntensity: 1.2,
  });
}

function createBrassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xc7973f,
    metalness: 1,
    roughness: 0.25,
    clearcoat: 0.5,
    clearcoatRoughness: 0.10,
    envMapIntensity: 1.1,
  });
}

function buildCeramicBotScene({ scene, engine }) {
  const root = new THREE.Group();
  scene.add(root);

  /* —— 1. 艺术陈列双层黄铜骨瓷展台 (Plinth Base) —— */
  const plinthGroup = new THREE.Group();
  const brassMat = createBrassMaterial();
  const plinthPorcelainMat = createPorcelainMaterial(0xf4f0e6);

  const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.98, 0.05, 48), brassMat);
  ring1.position.y = -0.86;
  plinthGroup.add(ring1);

  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.88, 0.08, 48), plinthPorcelainMat);
  dish.position.y = -0.79;
  plinthGroup.add(dish);

  const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.02, 48), brassMat);
  ring2.position.y = -0.74;
  plinthGroup.add(ring2);

  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0xffd84d,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
  });
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.53, 48), glowRingMat);
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = -0.726;
  plinthGroup.add(glowRing);
  root.add(plinthGroup);

  /* —— 2. 骨瓷球体主身 —— */
  const group = new THREE.Group();
  root.add(group);

  const faceGeometry = new THREE.SphereGeometry(FACE_RADIUS, 56, 42);
  {
    const random = mulberry32(20260816);
    const pos = faceGeometry.attributes.position;
    const norm = faceGeometry.attributes.normal;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const bump =
        Math.sin(x * 9.5 + y * 4.2) * 0.0012 +
        Math.sin(y * 7.1 + z * 5.8) * 0.0010 +
        (random() - 0.5) * 0.0012;
      pos.setXYZ(i, x + norm.getX(i) * bump, y + norm.getY(i) * bump, z + norm.getZ(i) * bump);
    }
    pos.needsUpdate = true;
    faceGeometry.computeVertexNormals();
  }
  const faceMaterial = createPorcelainMaterial(0xff5d9e);
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  group.add(face);

  /* —— 3. 双侧温润白瓷小萌翼（带黄铜轴套） —— */
  const wingGroupL = new THREE.Group();
  const wingGroupR = new THREE.Group();
  const wingMat = createPorcelainMaterial(0xfffdf7);
  const wingGeo = new THREE.SphereGeometry(0.18, 20, 14);
  wingGeo.scale(0.30, 1.38, 0.68);
  const wingMeshL = new THREE.Mesh(wingGeo, wingMat);
  const wingMeshR = new THREE.Mesh(wingGeo, wingMat);
  const socketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.065, 14);
  const socketL = new THREE.Mesh(socketGeo, brassMat);
  const socketR = new THREE.Mesh(socketGeo, brassMat);
  socketL.rotation.z = Math.PI / 2;
  socketR.rotation.z = Math.PI / 2;

  wingGroupL.add(socketL, wingMeshL);
  wingMeshL.position.set(-0.14, 0.05, 0);
  wingMeshL.rotation.z = 0.50;

  wingGroupR.add(socketR, wingMeshR);
  wingMeshR.position.set(0.14, 0.05, 0);
  wingMeshR.rotation.z = -0.50;

  wingGroupL.position.set(-0.75, 0.04, -0.02);
  wingGroupR.position.set(0.75, 0.04, -0.02);
  wingGroupL.rotation.y = -0.20;
  wingGroupR.rotation.y = 0.20;
  group.add(wingGroupL, wingGroupR);

  /* —— 4. 头顶悬浮天使小光环 —— */
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, FACE_RADIUS + 0.19, 0.04);
  crownGroup.rotation.x = -0.32;
  const crownBrassRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.015, 12, 48), brassMat);
  crownBrassRing.rotation.x = Math.PI / 2;
  crownGroup.add(crownBrassRing);

  const crownGlowRingMat = new THREE.MeshBasicMaterial({
    color: 0xffd84d,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const crownGlowRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.009, 8, 36), crownGlowRingMat);
  crownGlowRing.rotation.x = Math.PI / 2;
  crownGroup.add(crownGlowRing);
  group.add(crownGroup);

  /* —— 5. 立体白瓷大眼 ×2 + 釉下彩腮红 —— */
  const eyeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.10,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    sheen: 0.95,
    sheenColor: new THREE.Color(0xffffff),
    reflectivity: 0.98,
    envMapIntensity: 0.95,
    side: THREE.DoubleSide,
  });
  const eye0 = new EyeMesh3D(36, false);
  const eye1 = new EyeMesh3D(36, true);
  eye0.mesh.material = eyeMaterial;
  eye1.mesh.material = eyeMaterial;
  group.add(eye0.mesh, eye1.mesh);

  const blushMaterial = new THREE.MeshBasicMaterial({
    color: 0xff7d9e,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const blushGeometry = new THREE.CircleGeometry(0.145, 24);
  const blushL = new THREE.Mesh(blushGeometry, blushMaterial);
  const blushR = new THREE.Mesh(blushGeometry, blushMaterial);
  blushL.position.set(-0.42, -0.22, 0.56).normalize().multiplyScalar(FACE_RADIUS + 0.004);
  blushL.lookAt(blushL.position.clone().multiplyScalar(2));
  blushR.position.set(0.42, -0.22, 0.56).normalize().multiplyScalar(FACE_RADIUS + 0.004);
  blushR.lookAt(blushR.position.clone().multiplyScalar(2));
  group.add(blushL, blushR);

  /* —— 6. 状态光环与 3D 环绕星点 —— */
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x79e2d0,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(FACE_RADIUS * 1.08, 0.015, 8, 64), haloMaterial);
  halo.rotation.x = Math.PI / 2.4;
  halo.visible = false;
  group.add(halo);

  const ORBIT_COUNT = 28;
  const orbitGeo = new THREE.BufferGeometry();
  const oPos = new Float32Array(ORBIT_COUNT * 3);
  const oCol = new Float32Array(ORBIT_COUNT * 3);
  const oData = [];
  const palette = [0xff5d9e, 0x7dfff0, 0xffd84d, 0x9d8cff, 0xffffff, 0xff9d5c];
  for (let i = 0; i < ORBIT_COUNT; i += 1) {
    const r = 0.92 + Math.random() * 0.34;
    const a = (i / ORBIT_COUNT) * TAU + Math.random() * 0.4;
    const y = -0.50 + Math.random() * 1.05;
    oData.push({ r, a, y, speed: 0.45 + Math.random() * 0.55, phase: Math.random() * TAU });
    oPos[i * 3] = Math.cos(a) * r;
    oPos[i * 3 + 1] = y;
    oPos[i * 3 + 2] = Math.sin(a) * r;
    const c = new THREE.Color(palette[i % palette.length]);
    oCol[i * 3] = c.r;
    oCol[i * 3 + 1] = c.g;
    oCol[i * 3 + 2] = c.b;
  }
  orbitGeo.setAttribute("position", new THREE.BufferAttribute(oPos, 3));
  orbitGeo.setAttribute("color", new THREE.BufferAttribute(oCol, 3));
  const orbitMaterial = new THREE.PointsMaterial({
    size: 0.055,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const orbitPoints = new THREE.Points(orbitGeo, orbitMaterial);
  group.add(orbitPoints);

  /* —— 7. 3D 粒子系统 —— */
  const MAX_PARTICLES = 160;
  const particleGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(MAX_PARTICLES * 3);
  const pCol = new Float32Array(MAX_PARTICLES * 3);
  const pLife = new Float32Array(MAX_PARTICLES);
  const pVel = new Float32Array(MAX_PARTICLES * 3);
  particleGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  particleGeo.setDrawRange(0, 0);
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.056,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeo, particleMaterial);
  group.add(particles);
  let particleCursor = 0;

  const PARTICLE_COLORS = {
    happy: 0xff5d9e, excited: 0xffd84d, sleeping: 0xa8b8ff, humming: 0x79e2d0,
    thinking: 0xc9b8ff, working: 0x79e2d0, celebrate: 0xff5d9e, sad: 0x7fa8ff,
    surprised: 0xffd84d, scared: 0xff9d5c, angry: 0xff3347, alerting: 0xff3347,
  };
  const RING_HALO_COLORS = {
    orbit: 0x79e2d0, radar: 0x08b9a9, loading: 0xff5d9e,
    alerting: 0xff3347, searching: 0x79e2d0, working: 0xffd84d,
  };
  let haloShownAt = 0;
  let boopBounceTime = 999;
  let speedMultiplier = 1.0;

  function spawnParticles(state, count = 2, isBoop = false) {
    const color = isBoop ? 0xffd84d : (PARTICLE_COLORS[state] || 0xffffff);
    const c = new THREE.Color(color);
    for (let k = 0; k < count; k += 1) {
      const i = particleCursor;
      particleCursor = (particleCursor + 1) % MAX_PARTICLES;
      const angle = Math.random() * TAU;
      const radius = FACE_RADIUS * (isBoop ? 0.35 : 0.65);
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = isBoop ? (FACE_RADIUS * 0.72 + Math.random() * 0.2) : (-FACE_RADIUS * 0.2);
      pPos[i * 3 + 2] = Math.sin(angle) * radius;
      pVel[i * 3] = (Math.random() - 0.5) * (isBoop ? 0.95 : 0.28);
      pVel[i * 3 + 1] = isBoop ? (0.75 + Math.random() * 0.7) : (0.35 + Math.random() * 0.35);
      pVel[i * 3 + 2] = (Math.random() - 0.5) * (isBoop ? 0.95 : 0.28);
      pLife[i] = 1;
      pCol[i * 3] = c.r;
      pCol[i * 3 + 1] = c.g;
      pCol[i * 3 + 2] = c.b;
    }
  }

  engine.onFx = (type, payload) => {
    if (type === "ring") {
      halo.visible = true;
      haloShownAt = performance.now();
      haloMaterial.color.set(RING_HALO_COLORS[payload] || 0x79e2d0);
    } else if (type === "particle") {
      spawnParticles(payload, 4);
    }
  };

  const FACE_CENTER = new THREE.Vector3(0, 0, 0);

  return {
    cameraPos: new THREE.Vector3(0, 0.04, 3.38),
    cameraTarget: new THREE.Vector3(0, -0.06, 0),
    setColor(hex) {
      if (!hex) return;
      faceMaterial.color.set(hex);
      engine.setColor(hex);
      crownGlowRingMat.color.set(hex);
      glowRingMat.color.set(hex);
    },
    boop(line) {
      engine.boop(line);
      boopBounceTime = 0;
      spawnParticles("happy", 22, true);
    },
    burstSpecial() {
      boopBounceTime = 0;
      halo.visible = true;
      haloShownAt = performance.now();
      haloMaterial.color.set(0xffd84d);
      spawnParticles("excited", 36, true);
      speedMultiplier = 3.2;
      setTimeout(() => { speedMultiplier = 1.0; }, 2200);
    },
    setTelemetry(telemetry) {
      if (telemetry?.perceptionMode === "coding") speedMultiplier = 2.2;
      else if (telemetry?.perceptionMode === "sleep") speedMultiplier = 0.45;
      else speedMultiplier = 1.0;
    },
    update(now, dt) {
      const snap = engine.frame(now);
      let bounceY = 0;
      if (boopBounceTime < 1.2) {
        boopBounceTime += dt * 3.5;
        const decay = Math.exp(-boopBounceTime * 3.0);
        bounceY = Math.sin(boopBounceTime * Math.PI * 3) * 0.06 * decay;
      }

      const breath = 1.0 + Math.sin(now * 0.0028) * 0.015;
      group.scale.setScalar(breath);
      group.position.y = snap.body.y * 0.006 + Math.sin(now * 0.0022) * 0.018 + bounceY;
      group.rotation.z = snap.body.rot * DEG * 0.012;
      group.rotation.y = snap.yaw * DEG;
      group.rotation.x = snap.pitch * DEG;

      const wingFlutter = Math.sin(now * 0.0048 * speedMultiplier) * 0.14;
      wingGroupL.rotation.z = wingFlutter;
      wingGroupR.rotation.z = -wingFlutter;

      crownGroup.rotation.y = now * 0.0018 * speedMultiplier;
      crownGroup.position.y = FACE_RADIUS + 0.19 + Math.sin(now * 0.003) * 0.015;

      const tr0 = snap.eyeTransforms[0] || {};
      const tr1 = snap.eyeTransforms[1] || tr0;
      eye0.update(snap.rings[0], tr0, FACE_CENTER);
      eye1.update(snap.rings[1] || snap.rings[0], tr1, FACE_CENTER);

      if (halo.visible) {
        halo.rotation.z += 0.015 * speedMultiplier;
        haloMaterial.opacity = 0.35 + 0.18 * Math.sin(now * 0.006);
        if (now - haloShownAt > 9000) halo.visible = false;
      }

      for (let i = 0; i < ORBIT_COUNT; i += 1) {
        const d = oData[i];
        d.a += dt * d.speed * speedMultiplier;
        oPos[i * 3] = Math.cos(d.a) * d.r;
        oPos[i * 3 + 1] = d.y + Math.sin(now * 0.0012 + d.phase) * 0.10;
        oPos[i * 3 + 2] = Math.sin(d.a) * d.r;
      }
      orbitGeo.attributes.position.needsUpdate = true;

      let alive = 0;
      for (let i = 0; i < MAX_PARTICLES; i += 1) {
        if (pLife[i] <= 0) continue;
        pLife[i] -= dt * 0.65;
        if (pLife[i] <= 0) {
          pLife[i] = 0;
          continue;
        }
        pPos[i * 3] += pVel[i * 3] * dt;
        pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
        pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        alive += 1;
      }
      particleGeo.setDrawRange(0, alive);
      particleGeo.attributes.position.needsUpdate = true;
      particleGeo.attributes.color.needsUpdate = true;
    },
    dispose() {
      scene.remove(root);
      faceGeometry.dispose();
      faceMaterial.dispose();
      eyeMaterial.dispose();
      wingMat.dispose();
      brassMat.dispose();
      plinthPorcelainMat.dispose();
      wingGeo.dispose();
      socketGeo.dispose();
      blushGeometry.dispose();
      blushMaterial.dispose();
      halo.geometry.dispose();
      haloMaterial.dispose();
      particleGeo.dispose();
      particleMaterial.dispose();
      orbitGeo.dispose();
      orbitMaterial.dispose();
      crownBrassRing.geometry.dispose();
      crownGlowRing.geometry.dispose();
      crownGlowRingMat.dispose();
      ring1.geometry.dispose();
      dish.geometry.dispose();
      ring2.geometry.dispose();
      glowRing.geometry.dispose();
      glowRingMat.dispose();
      eye0.dispose();
      eye1.dispose();
    },
  };
}

/* ============================================================
   4. 主题皮肤二：🫧 深海驾驶舱全息球 (submarine-cabin-bot)
   ============================================================ */
function hexToRgb(hex) {
  let c = (hex || "#ff5d9e").replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16) || 0xff5d9e;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function adjustColorBrightness(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const adj = (v) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

function smoothRingPath2D(ring, tension = 1) {
  if (ring.length < 3) {
    return new Path2D("M" + ring.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L") + "Z");
  }
  const r = (v) => Math.round(v * 100) / 100;
  const n = ring.length;
  let d = `M${r(ring[0][0])},${r(ring[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const prev = ring[(i - 1 + n) % n];
    const cur = ring[i];
    const next = ring[(i + 1) % n];
    const after = ring[(i + 2) % n];
    const c1 = [cur[0] + ((next[0] - prev[0]) / 6) * tension, cur[1] + ((next[1] - prev[1]) / 6) * tension];
    const c2 = [next[0] - ((after[0] - cur[0]) / 6) * tension, next[1] - ((after[1] - cur[1]) / 6) * tension];
    d += `C${r(c1[0])},${r(c1[1])} ${r(c2[0])},${r(c2[1])} ${r(next[0])},${r(next[1])}`;
  }
  return new Path2D(d + "Z");
}

const PARTICLE_GLYPHS = {
  happy: ["♥", "#ff5d9e"], excited: ["✦", "#ffd84d"], sleeping: ["Z", "#a8b8ff"],
  humming: ["♪", "#79e2d0"], thinking: ["…", "#c9b8ff"], working: ["⚡", "#ffd84d"],
  celebrate: ["✧", "#ff5d9e"], sad: ["◇", "#7fa8ff"], surprised: ["!", "#ffd84d"],
  scared: ["?!", "#ff9d5c"], angry: ["!!", "#ff3347"], alerting: ["⚠", "#ff3347"],
};

class HoloFaceCanvas {
  constructor(canvas, { scale = 3 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.size = 230;
    this.scale = scale;
    canvas.width = 230 * scale;
    canvas.height = 230 * scale;
    this.particles = [];
    this.ringFx = null;
    this._ringTime = 0;
  }

  handleFx(type, payload) {
    if (type === "ring") {
      this.ringFx = { type: payload, start: performance.now() };
    } else if (type === "particle") {
      this.spawnParticle(payload);
    }
  }

  spawnParticle(state, count = 1) {
    const glyph = PARTICLE_GLYPHS[state] || ["·", "#79e2d0"];
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: 115 + (Math.random() - 0.5) * 140,
        y: 150 + Math.random() * 45,
        vx: (Math.random() - 0.5) * 20,
        vy: -28 - Math.random() * 36,
        life: 1,
        decay: 0.65 + Math.random() * 0.85,
        glyph: glyph[0],
        color: glyph[1],
        size: 14 + Math.random() * 13,
        wobble: Math.random() * TAU,
      });
    }
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
  }

  draw(snapshot, now, dt) {
    const VIEW = this.size;
    const ctx = this.ctx;
    const s = this.scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, VIEW, VIEW);

    const { rings, eyeTransforms, body, state, color } = snapshot;
    const baseHex = color || "#08b9a9";

    const bgGrad = ctx.createRadialGradient(VIEW * 0.5, VIEW * 0.48, 10, VIEW * 0.5, VIEW * 0.5, VIEW * 0.65);
    bgGrad.addColorStop(0, adjustColorBrightness(baseHex, 1.45));
    bgGrad.addColorStop(0.35, adjustColorBrightness(baseHex, 1.15));
    bgGrad.addColorStop(0.72, baseHex);
    bgGrad.addColorStop(1, adjustColorBrightness(baseHex, 0.58));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIEW, VIEW);

    // 全息扫描经纬网格线
    ctx.save();
    ctx.strokeStyle = "rgba(121, 226, 208, 0.14)";
    ctx.lineWidth = 1;
    for (let y = 16; y < VIEW; y += 22) {
      ctx.beginPath();
      ctx.moveTo(8, y);
      ctx.lineTo(VIEW - 8, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(0, body.y);
    ctx.rotate((body.rot * Math.PI) / 180);
    ctx.scale(body.sx, body.sy);
    const blob = new Path2D(BLOB_PATH);

    ctx.save();
    ctx.shadowColor = "#79e2d0";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fill(blob);
    ctx.restore();

    const bodyGrad = ctx.createLinearGradient(0, 30, 0, 190);
    bodyGrad.addColorStop(0, adjustColorBrightness(baseHex, 1.25));
    bodyGrad.addColorStop(0.5, baseHex);
    bodyGrad.addColorStop(1, adjustColorBrightness(baseHex, 0.82));
    ctx.fillStyle = bodyGrad;
    ctx.fill(blob);

    ctx.strokeStyle = "rgba(121, 226, 208, 0.55)";
    ctx.lineWidth = 2.5;
    ctx.stroke(blob);

    // 顶部全息高光
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(115, 62, 48, 22, 0, 0, TAU);
    const topHighlight = ctx.createRadialGradient(115, 62, 2, 115, 62, 48);
    topHighlight.addColorStop(0, "rgba(255, 255, 255, 0.48)");
    topHighlight.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = topHighlight;
    ctx.fill();
    ctx.restore();

    // 腮红
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = adjustColorBrightness(baseHex, 1.45);
    ctx.beginPath();
    ctx.ellipse(60, 150, 14, 9, -0.08, 0, TAU);
    ctx.ellipse(170, 150, 14, 9, 0.08, 0, TAU);
    ctx.fill();
    ctx.restore();

    // 眼睛
    for (let i = 0; i < rings.length; i += 1) {
      const ring = rings[i];
      const tr = eyeTransforms[i];
      if (!tr || tr.opacity <= 0) continue;
      const c = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
      ctx.save();
      ctx.translate(tr.tx, tr.ty);
      ctx.scale(tr.sx, tr.sy);
      ctx.translate(-c[0], -c[1]);
      ctx.fillStyle = "#fffdf7";
      ctx.shadowColor = "rgba(121, 226, 208, 0.9)";
      ctx.shadowBlur = 10;
      ctx.globalAlpha = tr.opacity;
      const eyePath = smoothRingPath2D(ring);
      ctx.fill(eyePath);
      ctx.restore();
    }
    ctx.restore();

    // 屏内粒子
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      p.wobble += dt * 3;
      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.translate(p.x + Math.sin(p.wobble) * 5, p.y);
      ctx.fillStyle = p.color;
      ctx.font = `700 ${p.size}px "Segoe UI Symbol", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.glyph, 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.font = "bold 12px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`HOLO // ${state.toUpperCase()}`, 12, 10);
  }
}

function renderSubmarineTelemetry(ctx, type, now, telemetry) {
  const w = 512, h = 320;
  ctx.clearRect(0, 0, w, h);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "rgba(6, 20, 36, 0.88)");
  bgGrad.addColorStop(1, "rgba(10, 30, 52, 0.92)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const isAlert = telemetry?.perceptionMode === "error";
  const borderCol = isAlert ? "#ff3347" : "#79e2d0";
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  if (type === "telemetry") {
    ctx.fillStyle = isAlert ? "rgba(255, 51, 71, 0.28)" : "rgba(121, 226, 208, 0.25)";
    ctx.fillRect(16, 16, w - 32, 36);
    ctx.fillStyle = borderCol;
    ctx.font = "bold 20px Consolas, monospace";
    ctx.fillText("SYS // AGENT & OS TELEMETRY", 24, 41);

    const cpu = telemetry?.cpuPercent != null ? telemetry.cpuPercent : Math.round(18 + Math.sin(now * 0.002) * 8);
    const mem = telemetry?.memPercent != null ? telemetry.memPercent : 62;
    const modeLabel = (telemetry?.perceptionMode || "auto").toUpperCase();
    const depth = (2840 + Math.sin(now * 0.001) * 3.8).toFixed(1);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Consolas, monospace";
    ctx.fillText(`CPU LOAD : ${cpu}%`, 28, 88);
    ctx.fillText(`MEM USED : ${mem}%`, 28, 122);
    ctx.fillText(`AGENT    : ${modeLabel}`, 28, 156);
    ctx.fillText(`DEPTH    : ${depth} m`, 28, 190);

    ctx.fillStyle = "rgba(121, 226, 208, 0.14)";
    ctx.fillRect(24, 210, w - 48, 82);
    const barCount = 26;
    for (let i = 0; i < barCount; i += 1) {
      const bh = Math.abs(Math.sin(now * 0.006 + i * 0.35)) * 46 + 8;
      ctx.fillStyle = isAlert ? "#ff3347" : (i % 2 === 0 ? "#79e2d0" : "#ff5d9e");
      ctx.fillRect(34 + i * 16, 280 - bh, 11, bh);
    }
  } else {
    ctx.fillStyle = "rgba(121, 226, 208, 0.25)";
    ctx.fillRect(16, 16, w - 32, 36);
    ctx.fillStyle = borderCol;
    ctx.font = "bold 20px Consolas, monospace";
    ctx.fillText("NAV // 360° SONAR & MATRIX", 24, 41);

    const cx = w - 125, cy = 182, r = 84;
    ctx.strokeStyle = "rgba(121, 226, 208, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.arc(cx, cy, r * 0.66, 0, TAU);
    ctx.arc(cx, cy, r * 0.33, 0, TAU);
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();

    const sweepAngle = (now * 0.0038) % TAU;
    ctx.fillStyle = isAlert ? "rgba(255, 51, 71, 0.38)" : "rgba(8, 185, 169, 0.38)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, sweepAngle - 0.5, sweepAngle);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px Consolas, monospace";
    ctx.fillText(`IPC PORT : 17530`, 26, 92);
    ctx.fillText(`WS LINK  : ACTIVE`, 26, 126);
    ctx.fillText(`SONAR    : 500m`, 26, 160);
    ctx.fillText(`HULL     : 100%`, 26, 194);
  }
}

function meridianPoints(radius) {
  const pts = [];
  for (let i = 0; i <= 48; i += 1) {
    const a = (i / 48) * TAU;
    pts.push(new THREE.Vector3(Math.sin(a) * radius, Math.cos(a) * radius, 0));
  }
  return pts;
}

function tubeFromPoints(points, radius, radialSegments = 10) {
  const count = points.length;
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(count - 1, i + 1)];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    let up = Math.abs(tangent.y) < 0.94 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    up = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    for (let j = 0; j < radialSegments; j += 1) {
      const a = (j / radialSegments) * TAU;
      const offset = new THREE.Vector3()
        .addScaledVector(up, Math.cos(a) * radius)
        .addScaledVector(binormal, Math.sin(a) * radius);
      const v = new THREE.Vector3().copy(p).add(offset);
      positions.push(v.x, v.y, v.z);
      normals.push(offset.x / radius, offset.y / radius, offset.z / radius);
    }
  }
  for (let i = 0; i < count - 1; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * radialSegments + j;
      const b = a + radialSegments;
      const c = (j + 1) % radialSegments;
      const a2 = a + (c - j);
      const b2 = b + (c - j);
      indices.push(a, b, a2, a2, b, b2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

function buildSubmarineHolosphereScene({ scene, engine }) {
  const root = new THREE.Group();
  scene.add(root);

  const radius = 0.56;
  const group = new THREE.Group();
  root.add(group);

  const canvas = document.createElement("canvas");
  const face = new HoloFaceCanvas(canvas, { scale: 3 });
  engine.onFx = (type, payload) => face.handleFx(type, payload);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;

  const panelGeometry = new THREE.SphereGeometry(radius, 48, 32);
  {
    const uv = panelGeometry.attributes.uv;
    const pos = panelGeometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const d = Math.sqrt(x * x + y * y + z * z) || 1;
      if (z / d < -0.15) {
        uv.setXY(i, 0.96, 0.96);
      } else {
        uv.setXY(i, 0.5 + (x / d) * 0.48, 0.5 + (y / d) * 0.48);
      }
    }
    uv.needsUpdate = true;
  }
  const panelMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  group.add(panel);

  /* —— 拉丝黄铜经纬笼架 + 顶部吊杆 + 底部全息发射座 —— */
  const brass = createBrassMaterial();
  const rimPoints = [];
  for (let i = 0; i <= 72; i += 1) {
    const a = (i / 72) * TAU;
    rimPoints.push(new THREE.Vector3(Math.cos(a) * (radius + 0.05), Math.sin(a) * (radius + 0.05), 0));
  }
  const rimGeometry = tubeFromPoints(rimPoints, 0.02, 10);
  const rim = new THREE.Mesh(rimGeometry, brass);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const meridianGeometry = tubeFromPoints(meridianPoints(radius + 0.05), 0.014, 8);
  const meridian1 = new THREE.Mesh(meridianGeometry, brass);
  const meridian2 = new THREE.Mesh(meridianGeometry, brass);
  meridian2.rotation.y = Math.PI / 2;
  group.add(meridian1, meridian2);

  // 舱顶黄铜吊杆与穹顶环
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 10), brass);
  pole.position.set(0, radius + 0.18, 0);
  const mount = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), brass);
  mount.position.set(0, radius + 0.36, 0);
  group.add(pole, mount);

  // 全息发射底座 (Holo Emitter Base)
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.set(0, -radius - 0.22, 0);
  const baseGeo1 = new THREE.CylinderGeometry(0.42, 0.48, 0.06, 32);
  const baseMesh1 = new THREE.Mesh(baseGeo1, brass);
  const baseGeo2 = new THREE.CylinderGeometry(0.30, 0.38, 0.07, 32);
  const baseMesh2 = new THREE.Mesh(baseGeo2, brass);
  baseMesh2.position.y = 0.065;
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x79e2d0, transparent: true, opacity: 0.92 });
  const lensGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.03, 32);
  const lensMesh = new THREE.Mesh(lensGeo, lensMat);
  lensMesh.position.y = 0.11;
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x79e2d0,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beamGeo = new THREE.ConeGeometry(radius * 1.04, radius * 1.15, 32, 1, true);
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.y = 0.34;
  pedestalGroup.add(baseMesh1, baseMesh2, lensMesh, beamMesh);
  group.add(pedestalGroup);

  /* —— 左右双翼全息遥测副屏 —— */
  const canvasL = document.createElement("canvas");
  canvasL.width = 512;
  canvasL.height = 320;
  const canvasR = document.createElement("canvas");
  canvasR.width = 512;
  canvasR.height = 320;
  const texL = new THREE.CanvasTexture(canvasL);
  texL.colorSpace = THREE.SRGBColorSpace;
  const texR = new THREE.CanvasTexture(canvasR);
  texR.colorSpace = THREE.SRGBColorSpace;

  const screenGeo = new THREE.PlaneGeometry(0.46, 0.29);
  const screenMatL = new THREE.MeshBasicMaterial({ map: texL, transparent: true, opacity: 0.94, side: THREE.DoubleSide, depthWrite: false });
  const screenMatR = new THREE.MeshBasicMaterial({ map: texR, transparent: true, opacity: 0.94, side: THREE.DoubleSide, depthWrite: false });

  const wingLeftGroup = new THREE.Group();
  wingLeftGroup.position.set(-0.76, 0.02, 0.12);
  wingLeftGroup.rotation.y = Math.PI / 7;
  wingLeftGroup.add(new THREE.Mesh(screenGeo, screenMatL));
  const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10);
  const armL = new THREE.Mesh(armGeo, brass);
  armL.position.set(0.20, -0.16, -0.06);
  armL.rotation.z = -Math.PI / 4;
  wingLeftGroup.add(armL);
  group.add(wingLeftGroup);

  const wingRightGroup = new THREE.Group();
  wingRightGroup.position.set(0.76, 0.02, 0.12);
  wingRightGroup.rotation.y = -Math.PI / 7;
  wingRightGroup.add(new THREE.Mesh(screenGeo, screenMatR));
  const armR = new THREE.Mesh(armGeo, brass);
  armR.position.set(-0.20, -0.16, -0.06);
  armR.rotation.z = Math.PI / 4;
  wingRightGroup.add(armR);
  group.add(wingRightGroup);

  /* —— 3D 海洋上升气泡群 + 生物发光孢子群 —— */
  const bubbleCount = 65;
  const bubbleGeo = new THREE.SphereGeometry(1, 8, 6);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xd4eef8, transparent: true, opacity: 0.52, depthWrite: false });
  const bubblesMesh = new THREE.InstancedMesh(bubbleGeo, bubbleMat, bubbleCount);
  const bData = [];
  const dummy = new THREE.Object3D();
  const rand = mulberry32(20260816);
  for (let i = 0; i < bubbleCount; i += 1) {
    const angle = rand() * TAU;
    const r = 0.55 + rand() * 0.65;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = -1.1 + rand() * 2.2;
    const scale = 0.016 + rand() * 0.028;
    const speed = 0.22 + rand() * 0.38;
    bData.push({ origX: x, origZ: z, y, scale, speed, phase: rand() * TAU });
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    bubblesMesh.setMatrixAt(i, dummy.matrix);
  }
  bubblesMesh.instanceMatrix.needsUpdate = true;
  root.add(bubblesMesh);

  let currentTelemetry = { cpuPercent: 18, memPercent: 60, perceptionMode: "auto" };
  let lastTelRender = 0;
  let elapsed = 0;

  return {
    cameraPos: new THREE.Vector3(0, 0.02, 3.35),
    cameraTarget: new THREE.Vector3(0, -0.04, 0),
    setColor(hex) {
      if (!hex) return;
      engine.setColor(hex);
      const c = new THREE.Color(hex);
      lensMat.color.copy(c);
      beamMat.color.copy(c);
    },
    boop(line) {
      engine.boop(line || "🫧 潜航全息球收到摸头信号！");
      face.spawnParticle("happy", 10);
    },
    burstSpecial() {
      face.handleFx("ring", "radar");
      face.spawnParticle("excited", 18);
      engine.boop("🫧 360° 深海声纳全功率脉冲发射！");
    },
    setTelemetry(tel) {
      currentTelemetry = { ...currentTelemetry, ...tel };
    },
    update(now, dt) {
      elapsed += dt;
      const snap = engine.frame(now);
      face.draw(snap, now, dt);
      texture.needsUpdate = true;

      if (now - lastTelRender > 80) {
        lastTelRender = now;
        this._telParity = (this._telParity || 0) ^ 1;
        if (this._telParity === 0) {
          renderSubmarineTelemetry(canvasL.getContext("2d"), "telemetry", now, currentTelemetry);
          texL.needsUpdate = true;
        } else {
          renderSubmarineTelemetry(canvasR.getContext("2d"), "sonar", now, currentTelemetry);
          texR.needsUpdate = true;
        }
      }

      const floatY = Math.sin(now * 0.0022) * 0.022;
      panel.position.y = floatY;
      wingLeftGroup.position.y = 0.02 + floatY * 0.65;
      wingRightGroup.position.y = 0.02 + floatY * 0.65;
      beamMat.opacity = 0.18 + 0.09 * Math.sin(now * 0.005);

      group.rotation.y = snap.yaw * DEG;
      group.rotation.x = snap.pitch * DEG;

      for (let i = 0; i < bubbleCount; i += 1) {
        const b = bData[i];
        b.y += b.speed * dt;
        if (b.y > 1.15) b.y = -1.1;
        const wx = Math.sin(elapsed * 1.4 + b.phase) * 0.04;
        dummy.position.set(b.origX + wx, b.y, b.origZ);
        dummy.scale.setScalar(b.scale * (1 + Math.sin(elapsed * 2 + i) * 0.14));
        dummy.updateMatrix();
        bubblesMesh.setMatrixAt(i, dummy.matrix);
      }
      bubblesMesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      scene.remove(root);
      texture.dispose();
      texL.dispose();
      texR.dispose();
      panelGeometry.dispose();
      panelMaterial.dispose();
      rimGeometry.dispose();
      meridianGeometry.dispose();
      brass.dispose();
      baseGeo1.dispose();
      baseGeo2.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      screenGeo.dispose();
      screenMatL.dispose();
      screenMatR.dispose();
      armGeo.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      bubblesMesh.dispose();
    },
  };
}

/* ============================================================
   5. 全局 3D 皮肤管理器 (window.Moodie3DSkins)
   ============================================================ */
class Moodie3DSkinManager {
  constructor() {
    this.container = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.envTexture = null;
    this.engine = null;
    this.activeSkin = null;
    this.mode = null; // 'ceramic' | 'submarine'
    this.rafId = null;
    this.paused = false;
    this.lastTime = 0;
    this.onLine = null;
  }

  initRenderer(container) {
    if (this.renderer && this.container === container) return;
    this.container = container;
    this.container.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:230px;height:230px;display:block;pointer-events:auto;";
    this.container.appendChild(canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "default",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(230, 230, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.88;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);

    const rawEnv = buildStudioEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromEquirectangular(rawEnv).texture;
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 0.5;
    rawEnv.dispose();
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffead4, 2.0);
    key.position.set(3.2, 4.4, 2.8);
    const fill = new THREE.DirectionalLight(0xcadcf2, 0.45);
    fill.position.set(-3.2, 1.8, 1.8);
    const rim = new THREE.DirectionalLight(0xffc98f, 0.72);
    rim.position.set(-1.4, 2.2, -3.4);
    this.scene.add(key, fill, rim);
  }

  mount(container, mode = "ceramic", { onLine = null, color = "#ff2d8b" } = {}) {
    this.onLine = onLine;
    this.initRenderer(container);

    if (this.activeSkin) {
      this.activeSkin.dispose();
      this.activeSkin = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }

    this.mode = mode;
    this.engine = new FaceEngine3D({
      data: window.GROKBOT_ORIGINAL,
      onLine: (line) => {
        if (this.onLine) this.onLine(line);
      },
    });
    this.engine.setColor(color);

    if (mode === "submarine") {
      this.activeSkin = buildSubmarineHolosphereScene({ scene: this.scene, engine: this.engine });
    } else {
      this.activeSkin = buildCeramicBotScene({ scene: this.scene, engine: this.engine });
    }
    this.activeSkin.setColor(color);
    this.camera.position.copy(this.activeSkin.cameraPos);
    this.camera.lookAt(this.activeSkin.cameraTarget);

    this.paused = false;
    this.lastTime = performance.now();
    this._startLoop();
  }

  _startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (!this.fpsScheduler && typeof window !== "undefined" && window.FpsScheduler) {
      this.fpsScheduler = new window.FpsScheduler();
    }
    const tick = (now) => {
      if (this.paused || !this.activeSkin) return;
      const shouldRender = this.fpsScheduler ? this.fpsScheduler.tick(now) : true;
      if (shouldRender) {
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        this.activeSkin.update(now, dt);
        this.renderer.render(this.scene, this.camera);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  setState(stateName, customLine) {
    if (this.fpsScheduler) this.fpsScheduler.setState(stateName);
    if (this.engine) this.engine.setState(stateName, customLine);
  }

  setSystemState(sysState, customLine) {
    const map = {
      coding: "working",
      error: "alerting",
      sleep: "sleeping",
      normal: "idle"
    };
    const targetState = map[sysState] || sysState || "idle";
    this.setState(targetState, customLine);
    this.setTelemetry({
      state: sysState,
      cpuLoad: sysState === "coding" ? 0.85 : sysState === "error" ? 0.95 : 0.15,
      hasError: sysState === "error",
      isSleeping: sysState === "sleep"
    });
  }

  setColor(hex) {
    if (this.activeSkin) this.activeSkin.setColor(hex);
  }

  setGaze(nx, ny) {
    if (this.fpsScheduler) this.fpsScheduler.notifyInteraction(performance.now());
    if (this.engine) this.engine.setGaze(nx, ny);
  }

  clearGaze() {
    if (this.fpsScheduler) this.fpsScheduler.endInteraction();
    if (this.engine) this.engine.clearGaze();
  }

  setTurn(yaw, pitch) {
    if (this.fpsScheduler) this.fpsScheduler.notifyInteraction(performance.now());
    if (this.engine) this.engine.setTurn(yaw, pitch);
  }

  releaseTurn() {
    if (this.fpsScheduler) this.fpsScheduler.endInteraction();
    if (this.engine) this.engine.releaseTurn();
  }

  boop(line) {
    if (this.fpsScheduler) this.fpsScheduler.notifyInteraction(performance.now());
    if (this.activeSkin) this.activeSkin.boop(line);
  }

  triggerClickReaction(x, y, line) {
    this.boop(line);
  }

  burstSpecial() {
    if (this.activeSkin) this.activeSkin.burstSpecial();
  }

  setTelemetry(telemetry) {
    if (this.activeSkin && this.activeSkin.setTelemetry) {
      this.activeSkin.setTelemetry(telemetry);
    }
  }

  pause() {
    this.paused = true;
    if (this.engine) this.engine.paused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (!this.activeSkin) return;
    this.paused = false;
    if (this.engine) this.engine.paused = false;
    this.lastTime = performance.now();
    this._startLoop();
  }

  stop() {
    this.pause();
    if (this.activeSkin) {
      this.activeSkin.dispose();
      this.activeSkin = null;
    }
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
  }

  unmount() {
    this.stop();
  }
}

const instance = new Moodie3DSkinManager();
if (typeof window !== "undefined") {
  window.Moodie3DSkins = instance;
}
export default instance;
