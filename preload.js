const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  watchDebugLog: (directory) => ipcRenderer.invoke('watch-debug-log', directory),
  clearDebugLog: (directory) => ipcRenderer.invoke('clear-debug-log', directory),
  onDebugLogUpdated: (callback) => ipcRenderer.on('debug-log-updated', (event, content) => callback(content)),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getRecentDirectories: () => ipcRenderer.invoke('get-recent-directories'),
  selectRecentDirectory: (directory) => ipcRenderer.invoke('select-recent-directory', directory),
}); 
