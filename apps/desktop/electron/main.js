const path = require('path');
const fs = require('fs');

// DIAGNOSTIC: check require.resolve for electron
try { console.log('[DIAG] resolve:', require.resolve('electron')); } catch(e) { console.log('[DIAG] resolve error:', e.message); }
console.log('[DIAG] process.type:', process.type);

const _electronModule = require('electron');
console.log('[DIAG] electron type:', typeof _electronModule);

const { app, BrowserWindow, ipcMain } = _electronModule;

// dev rejimi: dist/index.html yo'q bo'lsa yoki NODE_ENV=development
const distHtml = path.join(__dirname, '../dist/index.html');
const isDev = process.env.NODE_ENV === 'development' || !fs.existsSync(distHtml);

let mainWindow;
let dbModule = null;

async function initDb() {
  const { setupDatabase, runQuery, getAll, getOne } = require('./database');
  await setupDatabase();
  dbModule = { runQuery, getAll, getOne };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Dauran POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11') mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });
}

app.whenReady().then(async () => {
  await initDb();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC: DB operatsiyalari
ipcMain.handle('db:query', async (_event, sql, params) => {
  if (!dbModule) throw new Error('DB not ready');
  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return dbModule.getAll(sql, params || []);
    }
    return dbModule.runQuery(sql, params || []);
  } catch (err) {
    throw new Error(err.message);
  }
});

ipcMain.handle('db:get', async (_event, sql, params) => {
  if (!dbModule) throw new Error('DB not ready');
  try {
    return dbModule.getOne(sql, params || []);
  } catch (err) {
    throw new Error(err.message);
  }
});

// IPC: Chek printer (ESC/POS)
ipcMain.handle('printer:print', async (_event, receiptData) => {
  const { printReceipt } = require('./printer');
  return printReceipt(receiptData);
});

// IPC: Sinxronizatsiya
ipcMain.handle('sync:start', async (_event, config) => {
  const { SyncService } = require('./sync');
  const { getAll, runQuery } = require('./database');
  const syncService = new SyncService({ getAll, runQuery }, mainWindow);
  syncService.configure(config.serverUrl, config.token);
  return syncService.syncAll();
});
