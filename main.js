const { app, BrowserWindow, ipcMain, Menu, screen, dialog, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { SystemSensorEngine } = require('./system-sensor');
const { AsyncRingLogger, getAutostartPath } = require('./patch-engine');

/* ============================================================
   Moodie 桌宠 v2.5 · 极效美学版
   ============================================================ */

let logger = null;
function log(msg) { if (logger) logger.log(msg); else console.log(msg); }


process.on('uncaughtException', (err) => {
  const s = (err && err.stack) || String(err);
  log('UNCAUGHT: ' + s);
  try {
    dialog.showErrorBox('Sonnet Bot 出错了', '请把下面的信息反馈给开发者：\n\n' + s);
  } catch (_) {}
});
process.on('unhandledRejection', (err) =>
  log('UNHANDLED-REJECTION: ' + ((err && err.stack) || String(err)))
);

// 单实例锁：重复启动时把已有窗口顶起来，而不是再开一个
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let win = null;
let dragging = false;
let lastCursor = null;

// 渲染层状态镜像（用于右键菜单高亮勾选项）
const uiMirror = {
  theme: 'grok',
  systemState: 'normal',
  autoSense: true,
  paused: false
};

// 初始化系统与 Agent 感知引擎
const sensorEngine = new SystemSensorEngine({
  port: Number(process.env.MOODIE_PORT) || 17530,
  autoSense: true
});

sensorEngine.on('state-change', (payload) => {
  uiMirror.systemState = payload.state;
  uiMirror.autoSense = payload.autoSense;
  log(`SENSOR-STATE -> ${payload.state} (${payload.reason})`);
  if (win && !win.isDestroyed()) {
    win.webContents.send('pet:system-state', payload);
  }
});

function createWindow() {
  const work = screen.getPrimaryDisplay().workArea;
  const W = 280;
  const H = 340;
  win = new BrowserWindow({
    width: W,
    height: H,
    x: work.x + work.width - W - 30,
    y: work.y + work.height - H - 10,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    icon: (() => {
      const p = path.join(__dirname, 'build', 'icon.ico');
      try {
        return fs.existsSync(p) ? p : undefined;
      } catch (_) {
        return undefined;
      }
    })(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 桌面穿透：默认透明区放行鼠标，渲染器在指针进入宠物本体时再接管
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'pet.html'));
  win.once('ready-to-show', () => {
    win.show();
    // 窗口就绪后立即同步当前系统感知状态
    win.webContents.send('pet:system-state', {
      type: 'system-state',
      ...sensorEngine.getStatus()
    });
  });

  win.webContents.on('console-message', (_e, level, message, line, source) =>
    log(`[r${level}] ${message}  (${source}:${line})`)
  );
  win.webContents.on('render-process-gone', (_e, d) =>
    log('RENDER-GONE: ' + JSON.stringify(d))
  );
  win.webContents.on('did-fail-load', (_e, code, desc) =>
    log('FAIL-LOAD: ' + code + ' ' + desc)
  );
  win.on('closed', () => {
    win = null;
  });
}

/* ---- 拖动：按屏幕绝对光标位移移动窗口（DPI 无关，比 movementX 稳） ---- */
ipcMain.on('pet:drag-start', () => {
  dragging = true;
  lastCursor = screen.getCursorScreenPoint();
  sensorEngine.recordActivity('drag');
});
ipcMain.on('pet:drag-move', () => {
  if (!dragging || !win) return;
  const c = screen.getCursorScreenPoint();
  if (lastCursor) {
    const [x, y] = win.getPosition();
    win.setPosition(x + (c.x - lastCursor.x), y + (c.y - lastCursor.y), false);
  }
  lastCursor = c;
});
ipcMain.on('pet:drag-end', () => {
  dragging = false;
  lastCursor = null;
});

/* ---- 透明区点击穿透开关 ---- */
ipcMain.on('pet:set-ignore', (_e, ignore) => {
  if (!win || win.isDestroyed()) return;
  win.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
});

/* ---- 渲染层状态同步与主动感知触发 ---- */
ipcMain.on('pet:sync-ui-state', (_e, stateObj) => {
  if (!stateObj || typeof stateObj !== 'object') return;
  if (stateObj.theme) uiMirror.theme = stateObj.theme;
  if (stateObj.systemState) uiMirror.systemState = stateObj.systemState;
  if (typeof stateObj.paused === 'boolean') uiMirror.paused = stateObj.paused;
});

ipcMain.on('pet:trigger-system', (_e, payload) => {
  if (!payload || !payload.state) return;
  sensorEngine.triggerState(payload.state, {
    reason: payload.reason || '',
    taskName: payload.taskName || '',
    source: 'ipc'
  });
});

/* ---- 右键菜单 ---- */
ipcMain.on('pet:menu', () => {
  if (!win || win.isDestroyed()) return;
  const send = (action) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('pet:menu-action', action);
    }
  };

  const menu = Menu.buildFromTemplate([
    { label: '😊 换个心情', click: () => send('nextMood') },
    { label: '🎲 随机换装', click: () => send('randomLook') },
    { type: 'separator' },
    {
      label: '🎨 主题与分身皮肤 (4合1)',
      submenu: [
        {
          label: '🌈 彩色可爱 (Colorful 2D)',
          type: 'radio',
          checked: uiMirror.theme === 'colorful',
          click: () => {
            uiMirror.theme = 'colorful';
            send('theme:colorful');
          }
        },
        {
          label: '⚫ Sonnet 极简 (Grok 粒子)',
          type: 'radio',
          checked: uiMirror.theme === 'grok',
          click: () => {
            uiMirror.theme = 'grok';
            send('theme:grok');
          }
        },
        {
          label: '🏺 3D 骨瓷天使球 (Ceramic 3D)',
          type: 'radio',
          checked: uiMirror.theme === 'ceramic',
          click: () => {
            uiMirror.theme = 'ceramic';
            send('theme:ceramic');
          }
        },
        {
          label: '🫧 深海驾驶舱全息球 (Submarine Holo)',
          type: 'radio',
          checked: uiMirror.theme === 'submarine',
          click: () => {
            uiMirror.theme = 'submarine';
            send('theme:submarine');
          }
        }
      ]
    },
    {
      label: '🧠 系统与 Agent 感知联动',
      submenu: [
        {
          label: '🔄 自动感知工作流 (CPU/编译/深夜)',
          type: 'checkbox',
          checked: sensorEngine.autoSense,
          click: (item) => {
            sensorEngine.setAutoSense(item.checked);
            send(item.checked ? 'sys:auto-on' : 'sys:auto-off');
          }
        },
        { type: 'separator' },
        {
          label: '⚡ 触发：专注搬砖 (向心粒子汇聚)',
          type: 'radio',
          checked: sensorEngine.currentState === 'coding',
          click: () =>
            sensorEngine.triggerState('coding', {
              reason: '手动开启：专注搬砖 / 向心粒子汇聚',
              source: 'context-menu'
            })
        },
        {
          label: '⚠️ 触发：任务异常 (感叹号与蓝球警告)',
          type: 'radio',
          checked: sensorEngine.currentState === 'error',
          click: () =>
            sensorEngine.triggerState('error', {
              reason: '手动演示：任务出错 / 感叹号与蓝球警告',
              source: 'context-menu'
            })
        },
        {
          label: '🌙 触发：空闲深夜 (柔光呼吸/趴着打呼)',
          type: 'radio',
          checked: sensorEngine.currentState === 'sleep',
          click: () =>
            sensorEngine.triggerState('sleep', {
              reason: '手动开启：空闲休息 / 柔光呼吸打呼',
              source: 'context-menu'
            })
        },
        {
          label: '✨ 恢复：灵动伴随模式',
          type: 'radio',
          checked: sensorEngine.currentState === 'normal',
          click: () =>
            sensorEngine.triggerState('normal', {
              reason: '恢复正常灵动伴随',
              source: 'context-menu'
            })
        },
        { type: 'separator' },
        {
          label: `📡 感知端口: 127.0.0.1:${sensorEngine.port} (HTTP/WS)`,
          enabled: false
        }
      ]
    },
    { type: 'separator' },
    {
      label: '🔲 选形状 (2D 彩色模式)',
      submenu: [
        { label: '原始形态', click: () => send('shape:blob') },
        { label: '鹅卵石', click: () => send('shape:pebble') },
        { label: '圆角方', click: () => send('shape:squircle') },
        { label: '胶囊', click: () => send('shape:capsule') },
        { label: '三角体', click: () => send('shape:triangle') },
        { label: '六边体', click: () => send('shape:hex') },
        { label: '云朵', click: () => send('shape:cloud') },
        { label: '水滴', click: () => send('shape:drop') }
      ]
    },
    {
      label: '尺寸',
      submenu: [
        { label: '缩小（×2/3）', click: () => send('size:minus') },
        { label: '放大（×3/2）', click: () => send('size:plus') },
        { label: '默认大小（×2/3）', click: () => send('size:reset') }
      ]
    },
    {
      label: '配饰',
      submenu: [
        { label: '👒 草帽', click: () => send('accessory:straw-hat') },
        { label: '👓 眼镜', click: () => send('accessory:glasses') },
        { label: '🎀 蝴蝶结', click: () => send('accessory:bowtie') },
        { label: '🦸 披风', click: () => send('accessory:cape') },
        { type: 'separator' },
        { label: '取消全部配饰', click: () => send('accessory:clear') }
      ]
    },
    {
      label: '颜色',
      submenu: [
        '可可棕 #9a6737',
        '活力红 #ff3347',
        '暖橙 #ff6a00',
        '琥珀 #ff9800',
        '青绿 #08c77a',
        '湖蓝 #08b9a9',
        '经典蓝 #2f86ed',
        '梦幻紫 #8656f6',
        '桃粉 #ff2d8b',
        '纯黑 #000000'
      ].map((c) => {
        const [name, hex] = c.split(' ');
        return { label: name, click: () => send('color:' + hex) };
      })
    },
    { type: 'separator' },
    { label: '⏸️ 暂停 / 继续轮询', click: () => send('togglePause') },
    {
      label: '🚀 开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        const exe = getAutostartPath();
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          path: exe,
          args: [exe]
        });
        send(item.checked ? 'autostart:on' : 'autostart:off');
      }
    },
    { type: 'separator' },
    { label: '❌ 退出', click: () => app.quit() }
  ]);
  menu.popup();
});

ipcMain.on('pet:quit', () => app.quit());

/* ===== 系统空闲暂停：光标 5 分钟没动 → 切换柔光呼吸并暂停高频轮询 ===== */
const IDLE_MS = 5 * 60 * 1000;
let idleTimer = null;
let idleLastCursor = null;
let staticSince = Date.now();
let petPaused = false;
const sendIdle = (a) => {
  if (win && !win.isDestroyed()) win.webContents.send('pet:menu-action', a);
};
function startIdleWatch() {
  idleLastCursor = screen.getCursorScreenPoint();
  staticSince = Date.now();
  petPaused = false;
  idleTimer = setInterval(() => {
    const c = screen.getCursorScreenPoint();
    if (c.x !== idleLastCursor.x || c.y !== idleLastCursor.y) {
      idleLastCursor = c;
      staticSince = Date.now();
      sensorEngine.recordActivity('cursor');
      if (petPaused) {
        petPaused = false;
        sendIdle('idleResume');
      }
    } else if (!petPaused && Date.now() - staticSince > IDLE_MS) {
      petPaused = true;
      sensorEngine.triggerState('sleep', {
        reason: '光标静止满 5 分钟，自动切换柔光呼吸',
        source: 'idle-watch'
      });
      sendIdle('idlePause');
    }
  }, 8000);
}

powerMonitor.on('lock-screen', () => {
  petPaused = true;
  sendIdle('idlePause');
});
powerMonitor.on('unlock-screen', () => {
  petPaused = false;
  staticSince = Date.now();
  sensorEngine.recordActivity('unlock');
  sendIdle('idleResume');
});
powerMonitor.on('suspend', () => {
  petPaused = true;
  sendIdle('idlePause');
});
powerMonitor.on('resume', () => {
  petPaused = false;
  staticSince = Date.now();
  sensorEngine.recordActivity('resume');
  sendIdle('idleResume');
});

app.whenReady().then(async () => {
  const LOG = path.join(app.getPath('userData'), 'moodie.log');
  logger = new AsyncRingLogger(LOG);
  try { fs.writeFileSync(LOG, ''); } catch (_) {}
  const started = await sensorEngine.start();
  log(`SENSOR-SERVER started: ${JSON.stringify(started)}`);
  createWindow();
  startIdleWatch();
});

app.on('before-quit', () => {
  if (idleTimer) clearInterval(idleTimer);
  sensorEngine.stop();
});
app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
