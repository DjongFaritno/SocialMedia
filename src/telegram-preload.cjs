const { contextBridge } = require('electron');

// Electron exposes this API but does not implement persistent notifications.
// Correct feature detection lets Telegram use its own new Notification()
// fallback, including its existing click, sound and muted-chat behavior.
// This adds no Node/IPC bridge to the remote page and leaves worker caching intact.
contextBridge.executeInMainWorld({
  func: () => {
    if (location.origin !== 'https://web.telegram.org') return;
    if (typeof ServiceWorkerRegistration !== 'undefined') {
      Reflect.deleteProperty(ServiceWorkerRegistration.prototype, 'showNotification');
    }
  }
});
