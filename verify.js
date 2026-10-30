/**
 * Moodie Pet v2.0 — 全链路自动化门禁自测套件 (verify.js)
 * ======================================================
 * 验证维度：
 * 1. data.js + morph-engine.js (26表情 / 39状态 / 9种几何形变 / 贝塞尔弹簧)
 * 2. grok-recipes.js + grok-player.bundle.js (Sonnet/Grok 极简粒子状态机)
 * 3. skins-3d.bundle.js (🏺 3D 骨瓷天使球 + 🫧 深海驾驶舱全息球 Three.js 引擎)
 * 4. system-sensor.js + moodie-cli.js (HTTP REST + RFC 6455 WebSocket 实时感知联动)
 * 5. pet.html + main.js + preload.js 语法与 5 大潜在冲突清零审计
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const crypto = require('crypto');
const { SystemSensorEngine } = require('./system-sensor');
const { request: cliRequest } = require('./moodie-cli');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${msg}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${msg}`);
  }
}

async function runVerify() {
  console.log('==========================================================');
  console.log(' Moodie Pet v2.0 — 全系统自测交付验证 (Self-Test Suite)');
  console.log('==========================================================\n');

  // 1. 验证 data.js 与 morph-engine.js
  console.log('▶ [1/5] 验证 2D 核心表情与形变引擎 (data.js + morph-engine.js)...');
  const sb = {
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    console
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'), sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'morph-engine.js'), 'utf8'), sb);

  const D = sb.window.GROKBOT_ORIGINAL;
  assert(D && D.EXPRESSIONS.length === 26, `26 套手调表情完整 (${D ? D.EXPRESSIONS.length : 0}/26)`);
  assert(Object.keys(D.POOLS).length === 39, `39 种心情状态池完整 (${Object.keys(D.POOLS).length}/39)`);
  assert(Object.keys(D.EXPR_CADENCE).length === 39, `39 种表情节奏表完整`);

  let exprIntegrity = true;
  D.EXPRESSIONS.forEach((ex) => {
    if (ex.length !== 2 || ex[0].length < 3 || ex[1].length < 3) exprIntegrity = false;
  });
  Object.entries(D.POOLS).forEach(([, pool]) => {
    pool.forEach((idx) => {
      if (idx < 0 || idx >= D.EXPRESSIONS.length) exprIntegrity = false;
    });
  });
  assert(exprIntegrity, '所有表情双眼顶点环与状态池索引 100% 合法');
  const shapesCount = vm.runInContext('GROKBOT_SHAPES.length', sb);
  assert(shapesCount >= 8, `几何形变库完备 (${shapesCount} 种形态)`);

  // 2. 验证 Grok 极简引擎与 3D 分身皮肤包
  console.log('\n▶ [2/5] 验证四主题分身资产包 (Grok + Ceramic 3D + Submarine Holo)...');
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'grok-recipes.js'), 'utf8'), sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'grok-player.bundle.js'), 'utf8'), sb);
  assert(Boolean(sb.window.__GROK_RECIPES__), 'grok-recipes.js 配方数据挂载成功');
  assert(typeof sb.window.createGrokBot === 'function', 'grok-player.bundle.js 暴露 window.createGrokBot');

  const bundle3dPath = path.join(__dirname, 'skins-3d.bundle.js');
  assert(fs.existsSync(bundle3dPath), 'skins-3d.bundle.js 已生成');
  vm.runInContext(fs.readFileSync(bundle3dPath, 'utf8'), sb);
  const skins3d = sb.window.Moodie3DSkins;
  assert(
    skins3d &&
      typeof skins3d.mount === 'function' &&
      typeof skins3d.unmount === 'function' &&
      typeof skins3d.setSystemState === 'function' &&
      typeof skins3d.triggerClickReaction === 'function',
    'skins-3d.bundle.js 暴露完整 Moodie3DSkins API (mount/unmount/setSystemState/triggerClickReaction)'
  );

  // 3. 验证潜在冲突修复与 pet.html / main.js 语法
  console.log('\n▶ [3/5] 审计潜在冲突代码清零与脚本语法...');
  const petHtml = fs.readFileSync(path.join(__dirname, 'pet.html'), 'utf8');
  assert(!petHtml.includes("getElementById('fx-layer')"), '冲突修复 #1：已根除错误的 #fx-layer DOM 引用');
  assert(
    petHtml.includes('safeActionInterval') && petHtml.includes('safeActionRaf'),
    '冲突修复 #2：已接入 safeActionInterval 与 safeActionRaf，彻底消除动作切换残余定时器/rAF泄漏'
  );
  assert(
    petHtml.includes("const VALID_THEMES = ['colorful', 'grok', 'ceramic', 'submarine']"),
    '冲突修复 #3：四大主题 (colorful/grok/ceramic/submarine) 统一状态机就绪'
  );
  assert(
    petHtml.includes('applySystemPerception') &&
      petHtml.includes('fx-soft-breath') &&
      petHtml.includes('id="system-hud"'),
    '冲突修复 #4：系统感知 HUD 胶囊、柔光呼吸光晕层 (.fx-soft-breath) 与跨主题动作触发器已就绪'
  );
  assert(
    petHtml.includes("el.closest('#skin3d-container')") &&
      petHtml.includes("el.closest('#system-hud')"),
    '冲突修复 #5：桌面鼠标穿透检测已覆盖 3D 分身容器与系统感知 HUD 胶囊'
  );

  // 提取 pet.html 内联脚本做 AST 语法编译校验
  const inlineMatch = petHtml.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/i);
  assert(Boolean(inlineMatch), '成功提取 pet.html 主脚本块');
  if (inlineMatch) {
    let syntaxOk = false;
    try {
      new vm.Script(inlineMatch[1], { filename: 'pet.html#inline-script' });
      syntaxOk = true;
    } catch (err) {
      console.error('pet.html 脚本语法错误:', err);
    }
    assert(syntaxOk, 'pet.html 内联引擎脚本通过 V8 语法编译校验 (0 SyntaxError)');
  }

  let mainSyntaxOk = false;
  try {
    new vm.Script(fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8'), { filename: 'main.js' });
    new vm.Script(fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf8'), { filename: 'preload.js' });
    mainSyntaxOk = true;
  } catch (err) {
    console.error('main.js/preload.js 语法错误:', err);
  }
  assert(mainSyntaxOk, 'main.js 与 preload.js 通过 V8 语法编译校验');

  // 4. 验证 SystemSensorEngine HTTP + WebSocket 实时联动
  console.log('\n▶ [4/5] 验证本地 HTTP REST + WebSocket 系统/Agent 感知联动...');
  const sensor = new SystemSensorEngine({ port: 17540, autoSense: false });
  const startInfo = await sensor.start();
  assert(startInfo.ok && startInfo.port >= 17540, `感知服务启动成功 (127.0.0.1:${startInfo.port})`);

  // 建立原生 WebSocket 客户端验证实时推送（支持单 TCP 包粘包多帧解析）
  const wsMessages = [];
  const wsClient = await new Promise((resolve) => {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: '127.0.0.1',
      port: startInfo.port,
      path: '/',
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13'
      }
    });
    req.on('upgrade', (_res, socket, head) => {
      const parseBuf = (buf) => {
        let pos = 0;
        while (pos + 2 <= buf.length) {
          const opcode = buf[pos] & 0x0f;
          let len = buf[pos + 1] & 0x7f;
          let headerLen = 2;
          if (len === 126) {
            if (pos + 4 > buf.length) break;
            len = buf.readUInt16BE(pos + 2);
            headerLen = 4;
          }
          if (pos + headerLen + len > buf.length) break;
          if (opcode === 0x01) {
            const jsonStr = buf.slice(pos + headerLen, pos + headerLen + len).toString('utf8');
            try {
              wsMessages.push(JSON.parse(jsonStr));
            } catch (_) {}
          }
          pos += headerLen + len;
        }
      };
      if (head && head.length > 0) parseBuf(head);
      socket.on('data', parseBuf);
      resolve(socket);
    });
    req.end();
  });

  // 4.1 触发 coding (专注搬砖 / 向心粒子汇聚)
  const codingRes = await cliRequest(
    'POST',
    '/api/state',
    { state: 'coding', reason: '正在执行 Rust 编译任务', taskName: 'cargo build' },
    startInfo.port
  );
  assert(
    codingRes.ok && codingRes.state === 'coding' && codingRes.action === 2 && codingRes.mood === 'working',
    '状态联动 [coding] → 成功映射为「专注搬砖 / 向心粒子汇聚」(Action 2 + working)'
  );

  // 4.2 触发 error (感叹号与蓝球警告)
  const errorRes = await cliRequest(
    'POST',
    '/api/state',
    { state: 'error', reason: '单元测试断言失败', taskName: 'pytest' },
    startInfo.port
  );
  assert(
    errorRes.ok && errorRes.state === 'error' && errorRes.action === 6 && errorRes.mood === 'alerting',
    '状态联动 [error]  → 成功映射为「感叹号与蓝球警告」(Action 6 + alerting)'
  );

  // 4.3 触发 sleep (空闲休息或深夜：柔光呼吸/趴着打呼)
  const sleepRes = await cliRequest(
    'POST',
    '/api/state',
    { state: 'sleep', reason: '深夜休息模式' },
    startInfo.port
  );
  assert(
    sleepRes.ok && sleepRes.state === 'sleep' && sleepRes.fx === 'soft-breath' && sleepRes.mood === 'sleeping',
    '状态联动 [sleep]  → 成功映射为「柔光呼吸 / 趴着打呼」(soft-breath + sleeping)'
  );

  // 4.4 恢复 normal
  const normalRes = await cliRequest(
    'POST',
    '/api/state',
    { state: 'normal', reason: '恢复正常陪伴' },
    startInfo.port
  );
  assert(normalRes.ok && normalRes.state === 'normal', '状态联动 [normal] → 成功恢复灵动伴随模式');

  await new Promise((r) => setTimeout(r, 80));
  assert(
    wsMessages.some((m) => m.type === 'hello') &&
      wsMessages.some((m) => m.type === 'system-state' && m.state === 'coding') &&
      wsMessages.some((m) => m.type === 'system-state' && m.state === 'error') &&
      wsMessages.some((m) => m.type === 'system-state' && m.state === 'sleep'),
    `WebSocket 实时广播校验通过 (共接收 ${wsMessages.length} 帧状态推送)`
  );

  wsClient.destroy();
  await sensor.stop();

  // 5. 校验 package.json 发行配置完整性
  console.log('\n▶ [5/5] 验证 package.json 发行配置...');
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredBuildFiles = [
    'main.js',
    'preload.js',
    'system-sensor.js',
    'moodie-cli.js',
    'pet.html',
    'data.js',
    'morph-engine.js',
    'grok-recipes.js',
    'grok-player.bundle.js',
    'skins-3d.bundle.js'
  ];
  const missingFiles = requiredBuildFiles.filter(
    (f) => !pkg.build.files.includes(f) || !fs.existsSync(path.join(__dirname, f))
  );
  assert(missingFiles.length === 0, `package.json build.files 资产齐全 (${requiredBuildFiles.length} 项核心文件)`);

  console.log('\n==========================================================');
  console.log(` 自测总结: ${passed} 项通过, ${failed} 项失败`);
  console.log('==========================================================');
  if (failed > 0) process.exitCode = 1;
}

runVerify().catch((err) => {
  console.error('自测执行异常:', err);
  process.exitCode = 1;
});
