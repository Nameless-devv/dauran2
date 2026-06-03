const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // SQLite (offline DB)
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
  },
  // Chek printer
  printer: {
    print: (data) => ipcRenderer.invoke('printer:print', data),
  },
  // Sinxronizatsiya holati
  onSyncStatus: (callback) => ipcRenderer.on('sync:status', (_, data) => callback(data)),
});
