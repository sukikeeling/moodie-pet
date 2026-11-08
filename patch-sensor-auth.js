/**
 * Moodie Pet v2.5 — 安全通信与生态联动增强补丁 (patch-sensor-auth.js)
 * ================================================================
 * 1. 轻量本地 Token 鉴权 (AuthMiddleware) 与 Origin 白名单防护
 * 2. 解耦的 Pub/Sub 事件总线 (SensorEventBus)
 * 3. 增强版感知网关代理与双向 IDE/Agent 联动接口规范
 */

const { EventEmitter } = require('events');

class SensorEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  subscribe(topic, handler) {
    this.on(topic, handler);
    return () => this.off(topic, handler);
  }

  publish(topic, payload) {
    this.emit(topic, payload);
    this.emit('*', { topic, payload, timestamp: Date.now() });
  }
}

class AuthMiddleware {
  constructor(options = {}) {
    this.token = options.token || 'moodie-secret-token-v25';
    this.allowedOrigins = options.allowedOrigins || [
      'http://127.0.0.1',
      'http://localhost',
      'vscode-webview://'
    ];
  }

  validateOrigin(origin) {
    if (!origin) return true; // 本地脚本调用无 Origin，默认放行
    return this.allowedOrigins.some((allowed) => origin.startsWith(allowed));
  }

  validateToken(reqToken) {
    if (!this.token) return true;
    return reqToken === this.token;
  }

  handleHttpRequest(req, res, next) {
    const origin = req.headers['origin'];
    if (origin && !this.validateOrigin(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Forbidden: Invalid Origin' }));
      return false;
    }

    const authHeader = req.headers['x-moodie-token'] || req.headers['authorization'];
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

    if (!this.validateToken(token)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized: Invalid or missing token' }));
      return false;
    }

    if (typeof next === 'function') next();
    return true;
  }

  validateWsUpgrade(req) {
    const origin = req.headers['origin'];
    if (origin && !this.validateOrigin(origin)) {
      return { ok: false, code: 403, reason: 'Invalid Origin' };
    }

    const protocols = req.headers['sec-websocket-protocol'] || '';
    const parts = protocols.split(',').map((s) => s.trim());
    const tokenPart = parts.find((p) => p.startsWith('token.'));
    const token = tokenPart ? tokenPart.slice(6) : (req.headers['x-moodie-token'] || null);

    if (!this.validateToken(token)) {
      return { ok: false, code: 401, reason: 'Unauthorized Token' };
    }

    return { ok: true, acceptedProtocol: tokenPart || parts[0] };
  }
}

module.exports = {
  SensorEventBus,
  AuthMiddleware
};
