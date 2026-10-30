/**
 * Moodie Pet v2.0 — 系统与 Agent 感知引擎 (System & Agent Perception Engine)
 * =========================================================================
 * 零第三方依赖原生实现：
 * 1. 本地 HTTP REST + RFC 6455 WebSocket 双协议端点 (默认 127.0.0.1:17530)
 * 2. 真实系统遥测：CPU 负载差分采样、内存占用、高负载编译/Agent 进程识别、深夜/空闲检测
 * 3. 三大核心联动状态：
 *    - coding : 正在敲代码或长任务编译 → 进入「专注搬砖 / 向心粒子汇聚」(Action 2 + working)
 *    - error  : 任务出错或进程异常     → 触发「感叹号与蓝球警告」(Action 6 + alerting)
 *    - sleep  : 空闲休息或深夜时       → 切换「柔光呼吸 / 趴着打呼」(soft-breath + sleeping)
 */

const http = require('http');
const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');
const { EventEmitter } = require('events');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// 状态元数据定义
const STATE_PROFILES = {
  coding: {
    state: 'coding',
    mood: 'working',
    action: 2, // Action 2: 向心粒子汇聚
    fx: 'converge',
    badge: '⚡ 专注搬砖',
    title: '专注搬砖 · 向心粒子汇聚',
    defaultLines: [
      '侦测到主人在敲代码/跑长任务，向心粒子充能中 ⚡',
      '算力全开！所有彩色粒子正在向核心汇聚~',
      '编译别慌，我在旁边帮你盯着进度条！',
      '键盘敲得冒火星啦，专注场的能量好满 ✨'
    ]
  },
  error: {
    state: 'error',
    mood: 'alerting',
    action: 6, // Action 6: 感叹号与蓝球警告
    fx: 'error-blue-orb',
    badge: '⚠️ 异常警告',
    title: '任务异常 · 感叹号与蓝球警告',
    defaultLines: [
      '⚠️ 捕捉到任务报错或进程异常！感叹号与蓝球已就位！',
      '别慌别慌，先看眼堆栈最后三行，我们一起排查~',
      '叮！检测到非零退出码/异常信号，快检查一下终端！',
      '蓝球护体！Bug 退散！深呼吸，一行一行看 💡'
    ]
  },
  sleep: {
    state: 'sleep',
    mood: 'sleeping',
    action: 0, // 柔光呼吸 / 趴着打呼
    fx: 'soft-breath',
    badge: '🌙 柔光呼吸',
    title: '空闲/深夜 · 柔光呼吸打呼',
    defaultLines: [
      '呼……吸…… 主人休息会儿吧，我开启柔光呼吸陪你 zzZ',
      '夜深/空闲静谧时刻，把光芒调成最柔和的呼吸频率 🌙',
      '趴着打个小呼噜……有新任务叫我一声就醒~',
      '眼睛该休息一下啦，一起跟着柔光深呼吸 🫧'
    ]
  },
  normal: {
    state: 'normal',
    mood: 'normal',
    action: null,
    fx: 'none',
    badge: '✨ 灵动伴随',
    title: '系统感知在线 · 灵动伴随',
    defaultLines: [
      '系统感知引擎已连接，随时响应你的工作流 ✨'
    ]
  }
};

// 别名归一映射
const STATE_ALIAS = {
  coding: 'coding',
  focus: 'coding',
  working: 'coding',
  build: 'coding',
  compile: 'coding',
  busy: 'coding',
  'focus-coding': 'coding',
  error: 'error',
  alert: 'error',
  alerting: 'error',
  fail: 'error',
  exception: 'error',
  warn: 'error',
  'error-alert': 'error',
  sleep: 'sleep',
  sleeping: 'sleep',
  idle: 'sleep',
  rest: 'sleep',
  night: 'sleep',
  'sleep-breath': 'sleep',
  normal: 'normal',
  reset: 'normal',
  auto: 'normal'
};

// 常见研发/编译/Agent 进程特征
const COMPILER_OR_AGENT_PROCS = [
  'cargo.exe', 'rustc.exe', 'gcc.exe', 'clang.exe', 'msbuild.exe',
  'gradle.exe', 'java.exe', 'javac.exe', 'kotlinc.exe',
  'pytest.exe', 'python.exe', 'uv.exe', 'esbuild.exe', 'rollup',
  'webpack', 'vite', 'tsc', 'claude.exe', 'codex.exe'
];
const EDITOR_PROCS = [
  'code.exe', 'cursor.exe', 'windsurf.exe', 'antigravity.exe',
  'devenv.exe', 'idea64.exe', 'pycharm64.exe', 'webstorm64.exe', 'nvim.exe'
];
const CRASH_PROCS = [
  'werfault.exe', 'werfaultsecure.exe', 'dwwin.exe'
];

class SystemSensorEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 17530;
    this.host = options.host || '127.0.0.1';
    this.autoSense = options.autoSense !== false;
    this.pollIntervalMs = options.pollIntervalMs || 8000;

    this.currentState = 'normal';
    this.overrideState = null;
    this.overrideUntil = 0;
    this.lastReason = '系统感知守护已启动';
    this.lastTaskName = '';
    this.lastLine = '';
    this.lastActivityAt = Date.now();
    this.idleThresholdSec = options.idleThresholdSec || 180; // 3分钟无活动可进入柔光呼吸

    this.metrics = {
      cpuPercent: 0,
      memPercent: 0,
      idleSec: 0,
      activeProcesses: [],
      matchedCompilers: [],
      matchedEditors: [],
      isLateNight: false,
      hour: new Date().getHours(),
      updatedAt: new Date().toISOString()
    };

    this.history = [];
    this.wsClients = new Set();
    this.server = null;
    this.pollTimer = null;
    this.overrideTimer = null;
    this._prevCpuInfo = os.cpus();
  }

  /**
   * 采样两次 os.cpus() 之间的真实 CPU 使用率 (%)
   */
  _sampleCpuPercent() {
    const cpus = os.cpus();
    let idleDiff = 0;
    let totalDiff = 0;
    for (let i = 0; i < cpus.length; i++) {
      const prev = this._prevCpuInfo[i] || cpus[i];
      const curr = cpus[i];
      const prevTotal = Object.values(prev.times).reduce((a, b) => a + b, 0);
      const currTotal = Object.values(curr.times).reduce((a, b) => a + b, 0);
      idleDiff += curr.times.idle - prev.times.idle;
      totalDiff += currTotal - prevTotal;
    }
    this._prevCpuInfo = cpus;
    if (totalDiff <= 0) return this.metrics.cpuPercent || 5;
    const usage = Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
    return Math.max(0, Math.min(100, usage));
  }

  /**
   * 采样内存使用率 (%)
   */
  _sampleMemPercent() {
    const total = os.totalmem();
    const free = os.freemem();
    if (!total) return 0;
    return Math.round(((total - free) / total) * 100);
  }

  /**
   * 异步探测当前活跃研发/编译/异常进程
   */
  _scanProcesses() {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec('tasklist /FO CSV /NH', { timeout: 3500, windowsHide: true }, (err, stdout) => {
          if (err || !stdout) return resolve({ compilers: [], editors: [], crashes: [] });
          const names = new Set();
          const lines = stdout.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line || line[0] !== '"') continue;
            const endIdx = line.indexOf('"', 1);
            if (endIdx > 1) {
              names.add(line.slice(1, endIdx).toLowerCase());
            }
          }
          const compilers = COMPILER_OR_AGENT_PROCS.filter((p) => names.has(p));
          const editors = EDITOR_PROCS.filter((p) => names.has(p));
          const crashes = CRASH_PROCS.filter((p) => names.has(p));
          resolve({ compilers, editors, crashes });
        });
      } else {
        exec('ps -A -o comm=', { timeout: 2500 }, (err, stdout) => {
          if (err || !stdout) return resolve({ compilers: [], editors: [], crashes: [] });
          const lower = stdout.toLowerCase();
          const compilers = COMPILER_OR_AGENT_PROCS.filter((p) => lower.includes(p.replace('.exe', '')));
          const editors = EDITOR_PROCS.filter((p) => lower.includes(p.replace('.exe', '')));
          resolve({ compilers, editors, crashes: [] });
        });
      }
    });
  }

  /**
   * 记录用户或 Agent 交互活动（重置空闲计时）
   */
  recordActivity(source = 'user') {
    this.lastActivityAt = Date.now();
    this.metrics.idleSec = 0;
    if (this.currentState === 'sleep' && !this.overrideState && source === 'user') {
      this._transitionTo('normal', {
        reason: '检测到用户交互唤醒',
        source: 'activity'
      });
    }
  }

  /**
   * 外部或菜单主动触发状态（支持持续时间，默认 45 秒后恢复或保持）
   */
  triggerState(rawState, options = {}) {
    const normalized = STATE_ALIAS[String(rawState || '').toLowerCase().trim()];
    if (!normalized) {
      return { ok: false, error: `Unknown state: ${rawState}` };
    }

    if (this.overrideTimer) {
      clearTimeout(this.overrideTimer);
      this.overrideTimer = null;
    }

    if (normalized === 'normal' && options.clearOverride !== false) {
      this.overrideState = null;
      this.overrideUntil = 0;
      this.lastActivityAt = Date.now();
      return this._transitionTo('normal', {
        reason: options.reason || '已恢复灵动伴随模式',
        taskName: options.taskName || '',
        line: options.line || '',
        source: options.source || 'manual',
        forceEmit: true
      });
    }

    const durationMs = Number(options.durationMs) || 60000;
    this.overrideState = normalized;
    this.overrideUntil = Date.now() + durationMs;

    if (normalized !== 'sleep') {
      this.lastActivityAt = Date.now();
    }

    const result = this._transitionTo(normalized, {
      reason: options.reason || STATE_PROFILES[normalized].title,
      taskName: options.taskName || '',
      line: options.line || '',
      source: options.source || 'api',
      forceEmit: true
    });

    if (durationMs > 0 && options.persistent !== true) {
      this.overrideTimer = setTimeout(() => {
        this.overrideState = null;
        this.overrideUntil = 0;
        this._evaluateAutoState();
      }, durationMs);
    }

    return result;
  }

  setAutoSense(enabled) {
    this.autoSense = Boolean(enabled);
    this._broadcast({
      type: 'sensor-config',
      autoSense: this.autoSense,
      status: this.getStatus()
    });
    if (this.autoSense && !this.overrideState) {
      this._evaluateAutoState();
    }
    return this.getStatus();
  }

  /**
   * 内部状态切换与广播
   */
  _transitionTo(targetState, meta = {}) {
    const profile = STATE_PROFILES[targetState] || STATE_PROFILES.normal;
    const prevState = this.currentState;
    const changed = prevState !== targetState || Boolean(meta.forceEmit);

    this.currentState = targetState;
    this.lastReason = meta.reason || profile.title;
    this.lastTaskName = meta.taskName || '';

    const defaultPool = profile.defaultLines || [];
    const chosenLine =
      meta.line ||
      defaultPool[Math.floor(Math.random() * defaultPool.length)] ||
      profile.title;
    this.lastLine = chosenLine;

    const payload = {
      type: 'system-state',
      state: targetState,
      prevState,
      mood: profile.mood,
      action: profile.action,
      fx: profile.fx,
      badge: profile.badge,
      title: profile.title,
      reason: this.lastReason,
      taskName: this.lastTaskName,
      line: chosenLine,
      source: meta.source || 'auto',
      autoSense: this.autoSense,
      metrics: { ...this.metrics },
      timestamp: new Date().toISOString()
    };

    if (changed) {
      this.history.unshift({
        state: targetState,
        reason: this.lastReason,
        taskName: this.lastTaskName,
        source: payload.source,
        timestamp: payload.timestamp
      });
      if (this.history.length > 30) this.history.length = 30;

      this.emit('state-change', payload);
      this._broadcast(payload);
    }

    return { ok: true, ...payload };
  }

  /**
   * 自动遥测评估循环
   */
  async _evaluateAutoState() {
    const cpuPercent = this._sampleCpuPercent();
    const memPercent = this._sampleMemPercent();
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLateNight = (hour === 23 && minute >= 30) || hour < 6;
    const idleSec = Math.floor((Date.now() - this.lastActivityAt) / 1000);

    const procInfo = await this._scanProcesses();

    this.metrics = {
      cpuPercent,
      memPercent,
      idleSec,
      activeProcesses: [...procInfo.compilers, ...procInfo.editors].slice(0, 8),
      matchedCompilers: procInfo.compilers,
      matchedEditors: procInfo.editors,
      isLateNight,
      hour,
      updatedAt: now.toISOString()
    };

    // 发送轻量级遥测心跳
    this._broadcast({
      type: 'telemetry',
      state: this.currentState,
      autoSense: this.autoSense,
      metrics: this.metrics
    });

    // 若当前处于手动/API 锁定窗口期，优先保持锁定状态
    if (this.overrideState && Date.now() < this.overrideUntil) {
      return;
    }
    this.overrideState = null;

    if (!this.autoSense) return;

    // 1. 异常告警检测
    if (procInfo.crashes.length > 0) {
      this._transitionTo('error', {
        reason: `捕获系统崩溃诊断进程 (${procInfo.crashes.join(', ')})`,
        taskName: procInfo.crashes[0],
        source: 'os-sensor'
      });
      return;
    }

    // 2. 正在敲代码或长任务编译检测
    const hasHeavyCompile = procInfo.compilers.length > 0 && cpuPercent >= 18;
    const hasActiveCoding = procInfo.editors.length > 0 && cpuPercent >= 25 && idleSec < 90;
    if (hasHeavyCompile || hasActiveCoding || cpuPercent >= 55) {
      const taskLabel = procInfo.compilers[0] || procInfo.editors[0] || `CPU ${cpuPercent}%`;
      this._transitionTo('coding', {
        reason: `正在专注运行 (${taskLabel} · CPU ${cpuPercent}%)`,
        taskName: taskLabel,
        source: 'os-sensor'
      });
      return;
    }

    // 3. 空闲休息或深夜检测
    if (isLateNight || idleSec >= this.idleThresholdSec) {
      const sleepReason = isLateNight
        ? `深夜静谧时段 (${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')})`
        : `已空闲休息 ${Math.floor(idleSec / 60)} 分钟`;
      this._transitionTo('sleep', {
        reason: sleepReason,
        source: 'os-sensor'
      });
      return;
    }

    // 4. 恢复正常陪伴
    if (this.currentState !== 'normal') {
      this._transitionTo('normal', {
        reason: '系统负载平稳，灵动伴随中',
        source: 'os-sensor'
      });
    }
  }

  getStatus() {
    const profile = STATE_PROFILES[this.currentState] || STATE_PROFILES.normal;
    return {
      ok: true,
      port: this.port,
      state: this.currentState,
      mood: profile.mood,
      action: profile.action,
      fx: profile.fx,
      badge: profile.badge,
      title: profile.title,
      reason: this.lastReason,
      taskName: this.lastTaskName,
      line: this.lastLine,
      autoSense: this.autoSense,
      overrideState: this.overrideState,
      metrics: this.metrics,
      connectedClients: this.wsClients.size,
      history: this.history.slice(0, 10)
    };
  }

  /**
   * 编码 RFC 6455 WebSocket 文本帧 (Server -> Client)
   */
  _encodeWsFrame(dataObj) {
    const json = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
    const payload = Buffer.from(json, 'utf8');
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + Text frame
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    return Buffer.concat([header, payload]);
  }

  /**
   * 解码客户端发来的掩码 WebSocket 帧 (Client -> Server)
   */
  _decodeWsFrame(buffer) {
    if (buffer.length < 2) return null;
    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x08) return { type: 'close' }; // Close frame
    if (opcode === 0x09) return { type: 'ping' };
    if (opcode !== 0x01) return null;

    const isMasked = (buffer[1] & 0x80) !== 0;
    let payloadLen = buffer[1] & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
      if (buffer.length < 4) return null;
      payloadLen = buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLen === 127) {
      if (buffer.length < 10) return null;
      payloadLen = Number(buffer.readBigUInt64BE(2));
      offset = 10;
    }

    let maskKey = null;
    if (isMasked) {
      if (buffer.length < offset + 4) return null;
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    if (buffer.length < offset + payloadLen) return null;
    const payload = Buffer.alloc(payloadLen);
    for (let i = 0; i < payloadLen; i++) {
      payload[i] = isMasked ? buffer[offset + i] ^ maskKey[i % 4] : buffer[offset + i];
    }
    return { type: 'text', text: payload.toString('utf8') };
  }

  _broadcast(messageObj) {
    if (this.wsClients.size === 0) return;
    const frame = this._encodeWsFrame(messageObj);
    for (const socket of this.wsClients) {
      if (socket.destroyed || !socket.writable) {
        this.wsClients.delete(socket);
        continue;
      }
      try {
        socket.write(frame);
      } catch (_) {
        this.wsClients.delete(socket);
      }
    }
  }

  _handleHttpRequest(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url || '/', `http://${this.host}:${this.port}`);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && (pathname === '/api/status' || pathname === '/status')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(this.getStatus()));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/trigger') {
      const state = parsedUrl.searchParams.get('state') || 'normal';
      const reason = parsedUrl.searchParams.get('reason') || '';
      const taskName = parsedUrl.searchParams.get('task') || '';
      const line = parsedUrl.searchParams.get('line') || '';
      const durationMs = Number(parsedUrl.searchParams.get('duration')) || 60000;
      const out = this.triggerState(state, {
        reason,
        taskName,
        line,
        durationMs,
        source: 'http-get'
      });
      res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(out));
      return;
    }

    if (req.method === 'POST' && (pathname === '/api/state' || pathname === '/api/trigger')) {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 65536) req.destroy();
      });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          if (typeof data.autoSense === 'boolean') {
            this.setAutoSense(data.autoSense);
          }
          if (data.activity) {
            this.recordActivity(data.source || 'http-activity');
          }
          let out = this.getStatus();
          if (data.state) {
            out = this.triggerState(data.state, {
              reason: data.reason,
              taskName: data.taskName || data.task,
              line: data.line,
              durationMs: data.durationMs || data.duration,
              persistent: data.persistent,
              source: data.source || 'http-post'
            });
          }
          res.writeHead(out.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(out));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: false,
      error: 'Not Found',
      endpoints: [
        'GET  /api/status',
        'GET  /api/trigger?state=coding|error|sleep|normal&reason=...',
        'POST /api/state  {"state":"coding|error|sleep|normal","reason":"...","taskName":"..."}',
        'WS   ws://127.0.0.1:' + this.port
      ]
    }));
  }

  _handleUpgrade(req, socket) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const acceptKey = crypto
      .createHash('sha1')
      .update(key + WS_GUID)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      ''
    ];
    socket.write(headers.join('\r\n'));
    this.wsClients.add(socket);

    // 连接建立后在下一事件循环推送一次完整状态，确保客户端已完成 101 Upgrade 握手
    setImmediate(() => {
      if (socket.destroyed || !socket.writable) return;
      try {
        socket.write(this._encodeWsFrame({
          type: 'hello',
          ...this.getStatus()
        }));
      } catch (_) {}
    });

    socket.on('data', (buf) => {
      const decoded = this._decodeWsFrame(buf);
      if (!decoded) return;
      if (decoded.type === 'close') {
        this.wsClients.delete(socket);
        socket.end();
        return;
      }
      if (decoded.type === 'ping') {
        const pong = Buffer.from([0x8a, 0x00]);
        try { socket.write(pong); } catch (_) {}
        return;
      }
      if (decoded.type === 'text' && decoded.text) {
        try {
          const msg = JSON.parse(decoded.text);
          if (msg.type === 'activity') {
            this.recordActivity(msg.source || 'ws');
          } else if (msg.type === 'trigger' || msg.state) {
            this.triggerState(msg.state, {
              reason: msg.reason,
              taskName: msg.taskName || msg.task,
              line: msg.line,
              durationMs: msg.durationMs,
              source: msg.source || 'ws-client'
            });
          } else if (typeof msg.autoSense === 'boolean') {
            this.setAutoSense(msg.autoSense);
          }
        } catch (_) {}
      }
    });

    socket.on('close', () => this.wsClients.delete(socket));
    socket.on('error', () => this.wsClients.delete(socket));
  }

  /**
   * 启动本地 HTTP + WebSocket 感知服务（支持端口冲突自动顺延）
   */
  start() {
    return new Promise((resolve) => {
      if (this.server) {
        return resolve({ ok: true, port: this.port });
      }

      const tryListen = (candidatePort, retriesLeft) => {
        const srv = http.createServer((req, res) => this._handleHttpRequest(req, res));
        srv.on('upgrade', (req, socket) => this._handleUpgrade(req, socket));

        srv.once('error', (err) => {
          if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
            tryListen(candidatePort + 1, retriesLeft - 1);
          } else {
            resolve({ ok: false, error: err.message, port: candidatePort });
          }
        });

        srv.listen(candidatePort, this.host, () => {
          this.port = candidatePort;
          this.server = srv;
          // 启动定时系统遥测
          this._evaluateAutoState();
          this.pollTimer = setInterval(() => {
            this._evaluateAutoState();
          }, this.pollIntervalMs);
          resolve({ ok: true, port: this.port, host: this.host });
        });
      };

      tryListen(this.port, 8);
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      if (this.overrideTimer) {
        clearTimeout(this.overrideTimer);
        this.overrideTimer = null;
      }
      for (const sock of this.wsClients) {
        try { sock.destroy(); } catch (_) {}
      }
      this.wsClients.clear();
      if (!this.server) return resolve();
      const srv = this.server;
      this.server = null;
      srv.close(() => resolve());
    });
  }
}

module.exports = {
  SystemSensorEngine,
  STATE_PROFILES,
  STATE_ALIAS
};
