/**
 * Moodie Pet v2.5 — 底层工程优化补丁 (patch-engine.js)
 * 双环境兼容 (Node 主进程 + Browser 渲染进程)
 * 覆盖：
 * 1. PetHitTest：真实坐标系 (280x340 窗口 / 230x230 舞台) 圆形本体 + HUD/气泡/尺寸控件矩形复合命中检测，替代 elementFromPoint
 * 2. DragThrottler：requestAnimationFrame 帧级拖拽 IPC 节流器
 * 3. getAutostartPath：Portable 模式真实 EXE 路径解析（修复 %TEMP% 失效 Bug）
 * 4. AsyncRingLogger：主进程异步缓冲日志流（替代 fs.appendFileSync 阻塞 I/O）
 */

const fs = (typeof require === 'function') ? (() => { try { return require('fs'); } catch (_) { return null; } })() : null;

class PetHitTest {
  constructor(opts = {}) {
    this.cx = opts.cx !== undefined ? opts.cx : 140;
    this.cy = opts.cy !== undefined ? opts.cy : 195;
    this.baseRadius = opts.baseRadius !== undefined ? opts.baseRadius : 180;
    this.scale = opts.scale !== undefined ? opts.scale : 2 / 3;
    this.rects = Array.isArray(opts.rects)
      ? opts.rects
      : [
          { name: 'system-hud', x: 30, y: 298, w: 220, h: 34 },
          { name: 'size-ctrl', x: 210, y: 40, w: 56, h: 28 }
        ];
  }

  setScale(scale) {
    if (typeof scale === 'number' && scale > 0) this.scale = scale;
  }

  setCenter(cx, cy) {
    this.cx = cx;
    this.cy = cy;
  }

  setRects(rects) {
    if (Array.isArray(rects)) this.rects = rects;
  }

  isHit(x, y) {
    const dx = x - this.cx;
    const dy = y - this.cy;
    const r = this.baseRadius * this.scale;
    if (dx * dx + dy * dy <= r * r) return true;

    for (let i = 0; i < this.rects.length; i++) {
      const b = this.rects[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        return true;
      }
    }
    return false;
  }
}

class DragThrottler {
  constructor(callback, rafImpl) {
    this.callback = callback;
    this.raf = rafImpl || (typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : (cb) => setTimeout(cb, 16));
    this.caf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : clearTimeout;
    this.frame = null;
    this.pending = false;
  }

  move() {
    if (!this.pending) {
      this.pending = true;
      this.frame = this.raf(() => {
        this.pending = false;
        this.frame = null;
        this.callback();
      });
    }
  }

  cancel() {
    if (this.frame !== null) {
      this.caf(this.frame);
      this.frame = null;
    }
    this.pending = false;
  }
}

function getAutostartPath(
  env = typeof process !== 'undefined' ? process.env : {},
  execPath = typeof process !== 'undefined' ? process.execPath : ''
) {
  if (env && env.PORTABLE_EXECUTABLE_FILE && String(env.PORTABLE_EXECUTABLE_FILE).trim()) {
    return String(env.PORTABLE_EXECUTABLE_FILE).trim();
  }
  return execPath;
}

class AsyncRingLogger {
  constructor(filePath, maxEntries = 200) {
    this.filePath = filePath;
    this.maxEntries = maxEntries;
    this.ring = [];
    this.stream = (fs && filePath) ? fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' }) : null;
    if (this.stream) {
      this.stream.on('error', () => {});
    }
  }

  log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    this.ring.push(line);
    if (this.ring.length > this.maxEntries) {
      this.ring.shift();
    }
    if (this.stream && this.stream.writable) {
      this.stream.write(line);
    }
  }

  close() {
    return new Promise((resolve) => {
      if (!this.stream) return resolve();
      this.stream.end(() => resolve());
    });
  }
}

if (typeof window !== 'undefined') {
  window.MoodieEnginePatch = { PetHitTest, DragThrottler };
  window.PetHitTest = PetHitTest;
  window.DragThrottler = DragThrottler;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PetHitTest,
    DragThrottler,
    getAutostartPath,
    AsyncRingLogger
  };
}
