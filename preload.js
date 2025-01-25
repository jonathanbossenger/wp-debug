const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
  watchDebugLog: (directory) => ipcRenderer.invoke('watchDebugLog', directory),
  clearDebugLog: (directory) => ipcRenderer.invoke('clearDebugLog', directory),
  onDebugLogUpdated: (callback) => ipcRenderer.on('debugLogUpdated', (event, content) => callback(content)),
  checkDebugSettings: (directory) => ipcRenderer.invoke('checkDebugSettings', directory),
  updateDebugSettings: (directory) => ipcRenderer.invoke('updateDebugSettings', directory),
}); 
