const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('opalUpdate', {
  onPayload: (cb) => ipcRenderer.on('update-payload', (e, p) => cb(p)),
  onProgress: (cb) => ipcRenderer.on('download-progress', (e, p) => cb(p)),
  checkAgain: () => ipcRenderer.invoke('update-check-again'),
  download: (url) => ipcRenderer.invoke('update-download', url),
  close: () => ipcRenderer.invoke('update-close'),
})
