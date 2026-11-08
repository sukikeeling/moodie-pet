"use strict";
/**
 * fps-scheduler.js — Moodie Pet 极效美学版 · 三档自适应 FPS 调度器原型
 * 对应规格: Stage1 Muse 方案 第五节
 * 落点: 替代 skins-3d.js:1649-1659 _startLoop 无条件全速 RAF
 *
 * 档位:
 * - interactive 60fps: 悬停/拖拽/点击反应/变形/动作播放 — 立即升档
 * - companion   30fps: idle/normal 且 5s 无交互 — 时间戳门控隔帧渲染
 * - dormant     12fps: sleeping / 失焦>30s / document.hidden — 只保呼吸眨眼
 * 规则: 升档即时, 降档稳定满 5s 才执行 (防横跳). 积分始终用真实 dt.
 */

const TIERS = {
  interactive: { fps: 60, interval: 1000 / 60, pixelRatioCap: 2 },
  companion: { fps: 30, interval: 1000 / 30, pixelRatioCap: 1.5 },
  dormant: { fps: 12, interval: 1000 / 12, pixelRatioCap: 1 },
};

class FpsScheduler {
  constructor({ downgradeDelayMs = 5000, blurDormantMs = 30000 } = {}) {
    this.tier = "companion";
    this.candidate = "companion";
    this.candidateSince = 0;
    this.lastInteractionAt = 0;
    this.lastRenderAt = -Infinity;
    this.blurredSince = null;
    this.hidden = false;
    this.state = "idle"; // FaceEngine activeState
    this.interacting = false;
    this.renderCount = 0;
    this.frameTimes = []; // rolling, capped 120
    this.downgradeDelayMs = downgradeDelayMs;
    this.blurDormantMs = blurDormantMs;
  }

  notifyInteraction(now) { this.lastInteractionAt = now; this.interacting = true; }
  endInteraction() { this.interacting = false; }
  setState(state) { this.state = state; }
  setHidden(hidden) { this.hidden = !!hidden; }
  setBlurred(now) { if (this.blurredSince === null) this.blurredSince = now; }
  setFocused() { this.blurredSince = null; }

  desiredTier(now) {
    if (this.hidden) return "dormant";
    if (this.state === "sleeping" || this.state === "powering-down") return "dormant";
    if (this.blurredSince !== null && now - this.blurredSince >= this.blurDormantMs) return "dormant";
    if (this.interacting) return "interactive";
    if (now - this.lastInteractionAt < 2000) return "interactive";
    return "companion";
  }

  // 每 RAF 调用: 返回 true 才真正 renderer.render()
  tick(now) {
    const desired = this.desiredTier(now);
    const rank = { dormant: 0, companion: 1, interactive: 2 };
    if (rank[desired] > rank[this.tier]) {
      this.tier = desired; this.candidate = desired; // 升档即时
    } else if (rank[desired] < rank[this.tier]) {
      if (this.candidate !== desired) { this.candidate = desired; this.candidateSince = now; }
      else if (now - this.candidateSince >= this.downgradeDelayMs) { this.tier = desired; }
    } else {
      this.candidate = desired;
    }
    const interval = TIERS[this.tier].interval;
    // 60fps 档: 每 RAF 都渲染 (interval 16.67 <= 典型 16.7 帧距, 留 0.5ms 容差)
    if (this.tier === "interactive" || now - this.lastRenderAt >= interval - 0.5) {
      if (this.lastRenderAt !== -Infinity) {
        const ft = now - this.lastRenderAt;
        this.frameTimes.push(ft); if (this.frameTimes.length > 120) this.frameTimes.shift();
      }
      this.lastRenderAt = now;
      this.renderCount++;
      return true;
    }
    return false;
  }

  getTier() { return this.tier; }
  getPixelRatioCap(dpr = 1) { return Math.min(dpr, TIERS[this.tier].pixelRatioCap); }
  medianFrameTime() {
    if (!this.frameTimes.length) return 0;
    const s = [...this.frameTimes].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }
}

if (typeof window !== "undefined") {
  window.FpsScheduler = FpsScheduler;
}
if (typeof module !== "undefined") module.exports = { FpsScheduler, TIERS };
