const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  watchDebugLog: (directory) => ipcRenderer.invoke('watch-debug-log', directory),
  clearDebugLog: (directory) => ipcRenderer.invoke('clear-debug-log', directory),
  onDebugLogUpdated: (callback) => ipcRenderer.on('debug-log-updated', (event, value) => callback(value)),
}); 
