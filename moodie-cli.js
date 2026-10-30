#!/usr/bin/env node
/**
 * Moodie Pet v2.0 — 命令行 / Agent 联动控制器 (moodie-cli.js)
 * ============================================================
 * 用法示例：
 *   node moodie-cli.js status
 *   node moodie-cli.js coding "正在执行 Vite 生产打包" --task="vite build"
 *   node moodie-cli.js error  "单元测试断言失败 (Exit Code 1)" --task="pytest"
 *   node moodie-cli.js sleep  "深夜静谧休息模式"
 *   node moodie-cli.js normal "恢复正常陪伴"
 */

const http = require('http');

const DEFAULT_PORT = Number(process.env.MOODIE_PORT) || 17530;
const HOST = '127.0.0.1';

function request(method, path, body = null, port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const req = http.request(
      {
        hostname: HOST,
        port,
        path,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': payload.length
            }
          : {},
        timeout: 3000
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (_) {
            resolve({ ok: false, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = (args[0] || 'status').toLowerCase();

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(`
Moodie Pet v2.0 — 系统与 Agent 感知 CLI
=======================================
用法:
  node moodie-cli.js status                     查看当前 Moodie 感知状态与系统遥测
  node moodie-cli.js coding [原因] [--task=名称] 触发「专注搬砖 / 向心粒子汇聚」(Action 2)
  node moodie-cli.js error  [原因] [--task=名称] 触发「感叹号与蓝球警告」(Action 6)
  node moodie-cli.js sleep  [原因]              触发「柔光呼吸 / 趴着打呼」
  node moodie-cli.js normal [原因]              恢复「灵动伴随」并解除手动锁定
`);
    return;
  }

  try {
    if (cmd === 'status') {
      const status = await request('GET', '/api/status');
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    let reason = '';
    let taskName = '';
    let line = '';
    let durationMs = 60000;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--task=')) {
        taskName = arg.slice('--task='.length);
      } else if (arg.startsWith('--line=')) {
        line = arg.slice('--line='.length);
      } else if (arg.startsWith('--duration=')) {
        durationMs = Number(arg.slice('--duration='.length)) || 60000;
      } else if (!reason) {
        reason = arg;
      }
    }

    const res = await request('POST', '/api/state', {
      state: cmd,
      reason,
      taskName,
      line,
      durationMs,
      source: 'moodie-cli'
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(`[moodie-cli] 无法连接到 Moodie 感知端口 (127.0.0.1:${DEFAULT_PORT}): ${err.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { request };
