const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const bwipjs = require('bwip-js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('choose-folder', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return res.filePaths[0];
});

ipcMain.handle('render', async (_, opts) => {
  const svg = bwipjs.toSVG({
    bcid: 'dotcode',
    text: opts.payload || 'ABC123',
    scale: 4,
    padding: 10
  });

  return {
    baseSvg: svg,
    replacedSvg: svg,
    metrics: {
      cols: 20,
      rows: 20,
      widthMm: 20,
      heightMm: 20,
      widthPx: 236,
      heightPx: 236
    }
  };
});