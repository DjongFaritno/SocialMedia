const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('duo', {
  windowAction: action => ipcRenderer.invoke('window:action', action),
  setTheme: value => ipcRenderer.invoke('theme:set', value),
  closeAbout: () => ipcRenderer.invoke('about:close'),
  getAbout: () => ipcRenderer.invoke('about:info'),
  openAuthorWebsite: () => ipcRenderer.invoke('about:website'),
  getState: () => ipcRenderer.invoke('state:get'),
  setRatio: value => ipcRenderer.invoke('ratio:set', value),
  action: (id, action) => ipcRenderer.invoke('service:action', id, action),
  onState: callback => { const listener = (_event, state) => callback(state); ipcRenderer.on('state', listener); return () => ipcRenderer.removeListener('state', listener); }
});
