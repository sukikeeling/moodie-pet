const { contextBridge, ipcRenderer } = require('electron');

// Exposed to pet.html as window.electronAPI. Guards in pet.html keep it
// working in a plain browser too (where this never runs).
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragMove: () => ipcRenderer.send('pet:drag-move'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  setIgnore: (ignore) => ipcRenderer.send('pet:set-ignore', !!ignore),
  showMenu: () => ipcRenderer.send('pet:menu'),
  quit: () => ipcRenderer.send('pet:quit'),
  onMenuAction: (cb) => ipcRenderer.on('pet:menu-action', (_e, action) => cb(action)),
});
