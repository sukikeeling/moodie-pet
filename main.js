const { app, BrowserWindow, ipcMain, Menu, screen, dialog, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');

/* ============================================================
   Moodie 桌宠 · 主进程  →  Sonnet Bot · 主进程
   成熟结构参考：live2d-widget / electron 桌宠通用实践
   - 单实例锁，避免重复启动
   - 所有日志写 userData（打包后 __dirname 在只读 app.asar，写它会 EROFS 崩）
   - uncaughtException 兜底：记日志 + 弹窗，绝不让进程"隐形崩溃"
   - ready-to-show 后才 show，避免透明窗口闪现/未渲染
   ============================================================ */

const LOG = path.join(app.getPath('userData'), 'moodie.log');
function log(msg) { try { fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {} }
try { fs.writeFileSync(LOG, ''); } catch (_) {}

process.on('uncaughtException', err => {
  const s = (err && err.stack) || String(err);
  log('UNCAUGHT: ' + s);
  try { dialog.showErrorBox('Sonnet Bot 出错了', '请把下面的信息反馈给开发者：\n\n' + s); } catch (_) {}
});
process.on('unhandledRejection', err => log('UNHANDLED-REJECTION: ' + ((err && err.stack) || String(err))));

// 单实例锁：重复启动时把已有窗口顶起来，而不是再开一个
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let win = null;
let dragging = false, lastCursor = null;

function createWindow() {
  const work = screen.getPrimaryDisplay().workArea;
  const W = 250, H = 300;
  win = new BrowserWindow({
    width: W, height: H,
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
    icon: (() => { const p = path.join(__dirname, 'build', 'icon.ico'); try { return fs.existsSync(p) ? p : undefined; } catch (_) { return undefined; } })(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 桌面穿透：默认透明区放行鼠标，渲染器在指针进入宠物本体时再接管
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'pet.html'));
  win.once('ready-to-show', () => win.show());

  win.webContents.on('console-message', (_e, level, message, line, source) =>
    log(`[r${level}] ${message}  (${source}:${line})`));
  win.webContents.on('render-process-gone', (_e, d) => log('RENDER-GONE: ' + JSON.stringify(d)));
  win.webContents.on('did-fail-load', (_e, code, desc) => log('FAIL-LOAD: ' + code + ' ' + desc));
  win.on('closed', () => { win = null; });
}

/* ---- 拖动：按屏幕绝对光标位移移动窗口（DPI 无关，比 movementX 稳） ---- */
ipcMain.on('pet:drag-start', () => { dragging = true; lastCursor = screen.getCursorScreenPoint(); });
ipcMain.on('pet:drag-move', () => {
  if (!dragging || !win) return;
  const c = screen.getCursorScreenPoint();
  if (lastCursor) {
    const [x, y] = win.getPosition();
    win.setPosition(x + (c.x - lastCursor.x), y + (c.y - lastCursor.y), false);
  }
  lastCursor = c;
});
ipcMain.on('pet:drag-end', () => { dragging = false; lastCursor = null; });

/* ---- 透明区点击穿透开关 ---- */
ipcMain.on('pet:set-ignore', (_e, ignore) => {
  if (!win) return;
  win.setIgnoreMouseEvents(ignore, { forward: true });
});

/* ---- 右键菜单 ---- */
ipcMain.on('pet:menu', () => {
  if (!win) return;
  const send = action => win.webContents.send('pet:menu-action', action);
  const menu = Menu.buildFromTemplate([
    { label: '😊 换个心情', click: () => send('nextMood') },
    { label: '🎲 随机换装', click: () => send('randomLook') },
    {
      label: '🔲 选形状',
      submenu: [
        { label: '原始形态', click: () => send('shape:blob') },
        { label: '鹅卵石', click: () => send('shape:pebble') },
        { label: '圆角方', click: () => send('shape:squircle') },
        { label: '胶囊', click: () => send('shape:capsule') },
        { label: '三角体', click: () => send('shape:triangle') },
        { label: '六边体', click: () => send('shape:hex') },
        { label: '云朵', click: () => send('shape:cloud') },
        { label: '水滴', click: () => send('shape:drop') },
      ],
    },
    { type: 'separator' },
    {
      label: '尺寸',
      submenu: [
        { label: '缩小（×2/3）', click: () => send('size:minus') },
        { label: '放大（×3/2）', click: () => send('size:plus') },
        { label: '默认大小（×2/3）', click: () => send('size:reset') },
      ],
    },
    {
      label: '配饰',
      submenu: [
        { label: '👒 草帽', click: () => send('accessory:straw-hat') },
        { label: '👓 眼镜', click: () => send('accessory:glasses') },
        { label: '🎀 蝴蝶结', click: () => send('accessory:bowtie') },
        { label: '🦸 披风', click: () => send('accessory:cape') },
        { type: 'separator' },
        { label: '取消全部配饰', click: () => send('accessory:clear') },
      ],
    },
    { type: 'separator' },
    { label: '⏸️ 暂停 / 继续轮询', click: () => send('togglePause') },
    {
      label: '🚀 开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          args: [app.getAppPath()],
        });
        send(item.checked ? 'autostart:on' : 'autostart:off');
      },
    },
    { type: 'separator' },
    {
      label: '🎨 主题',
      submenu: [
        { label: '🌈 彩色可爱', click: () => send('theme:colorful') },
        { label: '⚫ Sonnet 极简（黑球白眼）', click: () => send('theme:grok') },
      ],
    },
    {
      label: '颜色',
      submenu: [
        '可可棕 #9a6737', '活力红 #ff3347', '暖橙 #ff6a00', '琥珀 #ff9800',
        '青绿 #08c77a', '湖蓝 #08b9a9', '经典蓝 #2f86ed', '梦幻紫 #8656f6',
        '桃粉 #ff2d8b', '纯黑 #000000',
      ].map(c => {
        const [name, hex] = c.split(' ');
        return { label: name, click: () => send('color:' + hex) };
      }),
    },
    { type: 'separator' },
    { label: '❌ 退出', click: () => app.quit() },
  ]);
  menu.popup();
});

ipcMain.on('pet:quit', () => app.quit());

/* ===== 系统空闲暂停：光标 5 分钟没动 → 暂停桌宠，让 Windows 正常熄屏/锁屏 ===== */
const IDLE_MS = 5 * 60 * 1000;   // 光标静止 5 分钟判定空闲
let idleTimer = null, idleLastCursor = null, staticSince = Date.now(), petPaused = false;
const sendIdle = (a) => { if (win && !win.isDestroyed()) win.webContents.send('pet:menu-action', a); };
function startIdleWatch() {
  idleLastCursor = screen.getCursorScreenPoint();
  staticSince = Date.now();
  petPaused = false;
  idleTimer = setInterval(() => {
    const c = screen.getCursorScreenPoint();
    if (c.x !== idleLastCursor.x || c.y !== idleLastCursor.y) {
      idleLastCursor = c; staticSince = Date.now();
      if (petPaused) { petPaused = false; sendIdle('idleResume'); }   // 光标一动就醒
    } else if (!petPaused && Date.now() - staticSince > IDLE_MS) {
      petPaused = true; sendIdle('idlePause');                        // 空够久就暂停
    }
  }, 8000);
}
// 兜底：锁屏 / 系统休眠 → 暂停；解锁 / 恢复 → 唤醒
powerMonitor.on('lock-screen', () => { petPaused = true; sendIdle('idlePause'); });
powerMonitor.on('unlock-screen', () => { petPaused = false; staticSince = Date.now(); sendIdle('idleResume'); });
powerMonitor.on('suspend', () => { petPaused = true; sendIdle('idlePause'); });
powerMonitor.on('resume', () => { petPaused = false; staticSince = Date.now(); sendIdle('idleResume'); });

app.whenReady().then(() => { createWindow(); startIdleWatch(); });
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
