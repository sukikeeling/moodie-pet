const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const LOG = path.join(__dirname, 'renderer.log');
fs.writeFileSync(LOG, '');

let win = null;
// drag via absolute cursor screen pos (DPI-correct, unlike CSS movementX)
let dragging = false, lastCursor = null;

function createWindow() {
  const work = screen.getPrimaryDisplay().workArea;
  const W = 250, H = 300;
  win = new BrowserWindow({
    width: W, height: H,
    x: work.x + work.width - W - 30, y: work.y + work.height - H - 10,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // start click-through; renderer re-enables mouse over the pet body
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'pet.html'));
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    fs.appendFileSync(LOG, `[${level}] ${message}  (${source}:${line})\n`);
  });
  win.webContents.on('render-process-gone', (_e, d) => fs.appendFileSync(LOG, `RENDER-GONE: ${JSON.stringify(d)}\n`));
  win.webContents.on('did-fail-load', (_e, code, desc) => fs.appendFileSync(LOG, `FAIL-LOAD: ${code} ${desc}\n`));
  win.on('closed', () => { win = null; });
}

// ---- drag: track cursor screen point, move window by the same delta ----
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

// ---- click-through toggle (transparent areas pass mouse to desktop) ----
ipcMain.on('pet:set-ignore', (_e, ignore) => {
  if (!win) return;
  win.setIgnoreMouseEvents(ignore, { forward: true });
});

// ---- native right-click context menu ----
ipcMain.on('pet:menu', () => {
  if (!win) return;
  const menu = Menu.buildFromTemplate([
    { label: '😊 换个心情', click: () => win.webContents.send('pet:menu-action', 'nextMood') },
    { label: '🎲 随机换装', click: () => win.webContents.send('pet:menu-action', 'randomLook') },
    { type: 'separator' },
    {
      label: '尺寸',
      submenu: [
        { label: '缩小（×2/3）', click: () => win.webContents.send('pet:menu-action', 'size:minus') },
        { label: '放大（×3/2）', click: () => win.webContents.send('pet:menu-action', 'size:plus') },
        { label: '原始大小', click: () => win.webContents.send('pet:menu-action', 'size:reset') },
      ],
    },
    {
      label: '配饰',
      submenu: [
        { label: '👒 草帽', click: () => win.webContents.send('pet:menu-action', 'accessory:straw-hat') },
        { label: '👓 眼镜', click: () => win.webContents.send('pet:menu-action', 'accessory:glasses') },
        { label: '🎀 蝴蝶结', click: () => win.webContents.send('pet:menu-action', 'accessory:bowtie') },
        { label: '🦸 披风', click: () => win.webContents.send('pet:menu-action', 'accessory:cape') },
        { type: 'separator' },
        { label: '取消全部配饰', click: () => win.webContents.send('pet:menu-action', 'accessory:clear') },
      ],
    },
    { type: 'separator' },
    { label: '⏸️ 暂停 / 继续轮询', click: () => win.webContents.send('pet:menu-action', 'togglePause') },
    { type: 'separator' },
    {
      label: '颜色',
      submenu: [
        '可可棕 #9a6737', '活力红 #ff3347', '暖橙 #ff6a00', '琥珀 #ff9800',
        '青绿 #08c77a', '湖蓝 #08b9a9', '经典蓝 #2f86ed', '梦幻紫 #8656f6',
        '桃粉 #ff2d8b', '纯黑 #000000',
      ].map(c => {
        const [name, hex] = c.split(' ');
        return { label: name, click: () => win.webContents.send('pet:menu-action', 'color:' + hex) };
      }),
    },
    { type: 'separator' },
    { label: '❌ 退出', click: () => app.quit() },
  ]);
  menu.popup();
});

ipcMain.on('pet:quit', () => app.quit());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
