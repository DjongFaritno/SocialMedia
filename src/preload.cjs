const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('duo', {
  blurAction: (action, input) => ipcRenderer.invoke('blur:action', action, input),
  privacyAction: (action, input) => ipcRenderer.invoke('privacy:action', action, input),
  accountAction: (action, input) => ipcRenderer.invoke('account:action', action, input),
  overlay: (mode, focus = false) => ipcRenderer.invoke('ui:overlay', mode, focus),
  updateAction: action => ipcRenderer.invoke('update:action', action),
  windowAction: action => ipcRenderer.invoke('window:action', action),
  setLanguage: value => ipcRenderer.invoke('language:set', value),
  setTheme: value => ipcRenderer.invoke('theme:set', value),
  closeAbout: () => ipcRenderer.invoke('about:close'),
  getAbout: () => ipcRenderer.invoke('about:info'),
  openAuthorWebsite: () => ipcRenderer.invoke('about:website'),
  getState: () => ipcRenderer.invoke('state:get'),
  setRatio: value => ipcRenderer.invoke('ratio:set', value),
  action: (id, action) => ipcRenderer.invoke('service:action', id, action),
  onState: callback => { const listener = (_event, state) => callback(state); ipcRenderer.on('state', listener); return () => ipcRenderer.removeListener('state', listener); }
});
