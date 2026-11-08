"use strict";
/**
 * particle-pool.js — Moodie Pet 极效美学版 · 统一粒子池原型
 * 对应规格: Stage1 Muse 方案 第四节
 * 落点: 替代 pet.html doAction8:2020-2039 的 42 个 DOM div + skins-3d.js 三套粒子出口
 *
 * 设计:
 * - 预分配 Float32Array, 容量 512, 运行时零 createElement / 零数组分配
 * - 单接口 emit({preset,count,colors,origin,duration})
 * - 预设: burst / vortex / converge / meteor / ring
 * - 渲染出口抽象: draw(ctx2d) 供 2D Canvas, getPositionArray() 供 THREE.Points (1 draw call)
 * - 纯逻辑可在 Node 下自测, 不依赖 DOM / Three
 */

const CAPACITY = 512;

// 字段布局 (SoA): x,y,vx,vy,life,maxLife,size, angle,r0,theta0,delay, presetId
const PRESET_ID = { burst: 1, vortex: 2, converge: 3, meteor: 4, ring: 5 };

class ParticlePool {
  constructor(capacity = CAPACITY) {
    this.capacity = capacity;
    this.pos = new Float32Array(capacity * 2);      // x,y for THREE.Points
    this.vel = new Float32Array(capacity * 2);      // vx,vy
    this.life = new Float32Array(capacity);         // remaining
    this.maxLife = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.colorIdx = new Uint8Array(capacity);
    this.meta = new Float32Array(capacity * 4);     // angle, r0, theta0, delay
    this.preset = new Uint8Array(capacity);
    this.alive = new Uint8Array(capacity);
    this.colors = [];
    this.origin = [114, 114];
    this.cursor = 0;
    this.aliveCount = 0;
    this.drawCalls = 0;
    this.domNodesCreated = 0; // invariant: always 0
    this.elapsed = 0;
  }

  emit({ preset = "burst", count = 16, colors = ["#ff2d8b"], origin = [114, 114], duration = 1000 } = {}) {
    if (!PRESET_ID[preset]) throw new Error(`unknown preset: ${preset}`);
    this.colors = colors;
    this.origin = origin;
    let spawned = 0;
    for (let n = 0; n < count; n++) {
      const i = this._nextSlot();
      if (i < 0) break;
      const i2 = i * 2, i4 = i * 4;
      this.alive[i] = 1;
      this.preset[i] = PRESET_ID[preset];
      this.maxLife[i] = duration / 1000;
      this.life[i] = this.maxLife[i];
      this.colorIdx[i] = n % colors.length;
      this.size[i] = 6 + (n % 4) * 2.5;

      if (preset === "burst") {
        const a = (n / count) * Math.PI * 2;
        const sp = 40 + (n % 5) * 12;
        this.pos[i2] = origin[0]; this.pos[i2 + 1] = origin[1];
        this.vel[i2] = Math.cos(a) * sp; this.vel[i2 + 1] = Math.sin(a) * sp;
        this.meta[i4] = a;
      } else if (preset === "vortex") {
        // 抄 pet.html:2020-2060 — 4臂, r0 70..125, theta 臂角 + 进度*1.2π
        const arm = n % 4;
        const r0 = 70 + (n / Math.max(count, 1)) * 55;
        const theta0 = arm * Math.PI / 2 + (n / Math.max(count, 1)) * Math.PI * 1.2;
        this.meta[i4] = 0; this.meta[i4 + 1] = r0; this.meta[i4 + 2] = theta0; this.meta[i4 + 3] = (n % 6) * 40;
        this.pos[i2] = origin[0] + r0 * Math.cos(theta0);
        this.pos[i2 + 1] = origin[1] + r0 * Math.sin(theta0);
        this.vel[i2] = 0; this.vel[i2 + 1] = 0;
      } else if (preset === "converge") {
        // Action2: 外圈出生, 向心汇聚
        const a = (n / count) * Math.PI * 2;
        const r0 = 90;
        this.meta[i4 + 1] = r0; this.meta[i4 + 2] = a;
        this.pos[i2] = origin[0] + r0 * Math.cos(a);
        this.pos[i2 + 1] = origin[1] + r0 * Math.sin(a);
        this.vel[i2] = -Math.cos(a) * 60; this.vel[i2 + 1] = -Math.sin(a) * 60;
      } else if (preset === "meteor") {
        this.pos[i2] = origin[0] + n * 6; this.pos[i2 + 1] = origin[1] + n * 8;
        this.vel[i2] = -120; this.vel[i2 + 1] = 140;
        this.meta[i4] = n * 90; // delay ms encoded in angle slot for prototype
      } else if (preset === "ring") {
        const a = (n / count) * Math.PI * 2;
        this.meta[i4 + 1] = 30; this.meta[i4 + 2] = a;
        this.pos[i2] = origin[0] + 30 * Math.cos(a);
        this.pos[i2 + 1] = origin[1] + 30 * Math.sin(a);
        this.vel[i2] = Math.cos(a) * 25; this.vel[i2 + 1] = Math.sin(a) * 25;
      }
      spawned++;
    }
    this._recount();
    return spawned;
  }

  _nextSlot() {
    for (let k = 0; k < this.capacity; k++) {
      const i = (this.cursor + k) % this.capacity;
      if (!this.alive[i]) { this.cursor = (i + 1) % this.capacity; return i; }
    }
    return -1; // pool full — drop, never allocate
  }

  _recount() {
    let c = 0; for (let i = 0; i < this.capacity; i++) if (this.alive[i]) c++;
    this.aliveCount = c;
  }

  update(dt) {
    this.elapsed += dt;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.alive[i]) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.alive[i] = 0; continue; }
      const i2 = i * 2, i4 = i * 4;
      const p = 1 - this.life[i] / this.maxLife[i]; // progress 0..1
      if (this.preset[i] === PRESET_ID.vortex) {
        // 对数螺旋向心: r = r0*(1-p^1.6), theta = theta0 + p^1.4 * 4.2π — 同 doAction8 stormTick
        const r = this.meta[i4 + 1] * (1 - Math.pow(p, 1.6));
        const theta = this.meta[i4 + 2] + Math.pow(p, 1.4) * Math.PI * 4.2;
        this.pos[i2] = this.origin[0] + r * Math.cos(theta);
        this.pos[i2 + 1] = this.origin[1] + r * Math.sin(theta);
      } else {
        this.pos[i2] += this.vel[i2] * dt;
        this.pos[i2 + 1] += this.vel[i2 + 1] * dt;
        if (this.preset[i] === PRESET_ID.ring) {
          const r = this.meta[i4 + 1] + p * 50;
          this.pos[i2] = this.origin[0] + r * Math.cos(this.meta[i4 + 2]);
          this.pos[i2 + 1] = this.origin[1] + r * Math.sin(this.meta[i4 + 2]);
        }
      }
    }
    this._recount();
  }

  // 2D 出口: 一次遍历绘制, 调用方只开一块 Canvas — 计为 1 draw batch
  draw(ctx) {
    this.drawCalls++;
    if (!ctx) return;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.alive[i]) continue;
      const alpha = Math.max(this.life[i] / this.maxLife[i], 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.colors[this.colorIdx[i]] || "#fff";
      ctx.beginPath();
      ctx.arc(this.pos[i * 2], this.pos[i * 2 + 1], this.size[i] / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 3D 出口: 直接交出预分配数组给 THREE.Points geometry attribute, 零拷贝
  getPositionArray() { return this.pos; }
}

if (typeof window !== "undefined") {
  window.ParticlePool = ParticlePool;
}
if (typeof module !== "undefined") module.exports = { ParticlePool, CAPACITY, PRESET_ID };
