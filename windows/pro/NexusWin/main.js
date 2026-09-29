const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
const { exec } = require('child_process');

// ── CRITICAL: Redirect Electron data to a NEW folder outside workspace ───────
// IDE file watchers (like VS Code or Antigravity) lock files in the workspace.
// If the cache is inside .appdata in the workspace, the watcher locks it instantly,
// causing "Acceso denegado (0x5)" when Chromium tries to move or write to it.
const appDataPath = path.join(app.getPath('appData'), 'NexusWinV2');
app.setPath('userData',   appDataPath);
app.setPath('logs',       path.join(appDataPath, 'logs'));
app.setPath('crashDumps', path.join(appDataPath, 'crashes'));

// ── CRITICAL: Disable Hardware Acceleration completely ──────────────────────
// This is the ONLY foolproof way to prevent Chromium from spawning GPU processes
// that try to touch the Dawn/Graphite cache and cause "Acceso denegado" errors.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-features', 'DawnGraphiteBackend,DawnGraphiteSharedContext,UseDawnGraphiteBackend');
app.commandLine.appendSwitch('log-severity', 'fatal');
app.commandLine.appendSwitch('disable-logging');
// ────────────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('index.html');

  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window-close',   () => win.close());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ── IPC: PowerShell via Base64 EncodedCommand ────────────────────────────────
ipcMain.handle('run-command', async (_e, command) => {
  return new Promise(resolve => {
    const encoded = Buffer.from(command, 'utf16le').toString('base64');
    exec(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`,
      { maxBuffer: 1024 * 1024 * 20 },
      (error, stdout) => resolve(error
        ? { success: false, error: error.message }
        : { success: true,  output: stdout })
    );
  });
});
