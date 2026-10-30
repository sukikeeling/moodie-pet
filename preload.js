const { contextBridge, ipcRenderer } = require('electron');

// Exposed to pet.html as window.electronAPI. Guards in pet.html keep it
// working in a plain browser too (where WebSocket/HTTP fallback connects to 127.0.0.1:17530).
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragMove: () => ipcRenderer.send('pet:drag-move'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  setIgnore: (ignore) => ipcRenderer.send('pet:set-ignore', !!ignore),
  showMenu: () => ipcRenderer.send('pet:menu'),
  quit: () => ipcRenderer.send('pet:quit'),
  syncUiState: (uiState) => ipcRenderer.send('pet:sync-ui-state', uiState || {}),
  triggerSystemState: (state, reason, taskName) =>
    ipcRenderer.send('pet:trigger-system', { state, reason, taskName }),
  onMenuAction: (cb) => {
    ipcRenderer.removeAllListeners('pet:menu-action');
    ipcRenderer.on('pet:menu-action', (_e, action) => cb(action));
  },
  onSystemState: (cb) => {
    ipcRenderer.removeAllListeners('pet:system-state');
    ipcRenderer.on('pet:system-state', (_e, payload) => cb(payload));
  }
});
