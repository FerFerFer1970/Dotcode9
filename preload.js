const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  render: (opts) => ipcRenderer.invoke('render', opts),
});