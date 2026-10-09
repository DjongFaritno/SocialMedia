const { app, BrowserWindow, WebContentsView, ipcMain, dialog, shell, Menu, session, nativeTheme, systemPreferences, nativeImage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { SERVICES, trusted, ratio, layout, cleanSettings, browserUserAgent } = require('./core.cjs');
const { servicePermitted, nativeMediaGate } = require('./permissions.cjs');
const mediaGate = nativeMediaGate(process.platform, systemPreferences);
const smoke = process.argv.includes('--smoke');
if (smoke) app.setPath('userData', fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'duochat-smoke-')));
let win, aboutWindow, settings, settingsPath, saveTimer;
// Use the same profile lock on every launch; never create a second pair of chats.
const primaryInstance = app.requestSingleInstanceLock();
if (!primaryInstance) app.quit();
let pendingFocus = false;
function focusExistingWindow() {
  if (!win || win.isDestroyed()) { pendingFocus = true; return; }
  if (win.isMinimized()) win.restore();
  win.show(); win.focus();
  if (aboutWindow && !aboutWindow.isDestroyed()) aboutWindow.focus();
  pendingFocus = false;
}
app.on('second-instance', focusExistingWindow);
let fullscreenHeaderVisible = false;
const views = {}, statuses = {};
// Small window icon, decoded once and shared by main/About windows.
const windowIcon = primaryInstance ? nativeImage.createFromPath(path.join(__dirname, 'assets', 'duochat-window-icon.png')) : null;
const authorWebsite = 'https://djongfaritno.github.io/';
const aboutURL = pathToFileURL(path.join(__dirname, 'about.html')).href;
const uiURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
function save() { clearTimeout(saveTimer); fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { mode: 0o600 }); }
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
function state() {
  const fullscreen = win.isFullScreen();
  return { ...settings, statuses, fullscreen, effectiveTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light', headerHidden: fullscreen ? !fullscreenHeaderVisible : settings.hideHeader };
}
function send() { if (win && !win.isDestroyed()) win.webContents.send('state', state()); }
function updateColors() {
  const dark = nativeTheme.shouldUseDarkColors;
  win.setBackgroundColor(dark ? '#161e1b' : '#edf2f1');
  for (const view of Object.values(views)) view.setBackgroundColor(dark ? '#1c2622' : '#ffffff');
  send();
}
function setTheme(value) {
  if (!['auto', 'light', 'dark'].includes(value)) return;
  settings.theme = value;
  nativeTheme.themeSource = value === 'auto' ? 'system' : value;
  updateColors(); queueSave();
}
function updatePresentation() {
  win.setMenuBarVisibility(!state().headerHidden);
  arrange();
}
function showAbout() {
  if (aboutWindow && !aboutWindow.isDestroyed()) { aboutWindow.focus(); return; }
  aboutWindow = new BrowserWindow({
    icon: windowIcon, width: 480, height: 460, resizable: false, closable: true, title: 'About DuoChat', parent: win, modal: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c2622' : '#fafcfb',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false }
  });
  aboutWindow.setMenu(null);
  aboutWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  aboutWindow.webContents.on('will-navigate', event => event.preventDefault());
  aboutWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') { event.preventDefault(); aboutWindow.close(); }
  });
  aboutWindow.on('closed', () => { aboutWindow = null; });
  void aboutWindow.loadFile(path.join(__dirname, 'about.html'));
}
function ownAbout(event) {
  return aboutWindow && event.sender === aboutWindow.webContents && event.senderFrame?.url === aboutURL;
}
function windowAction(action) {
  if (action === 'about') showAbout();
  if (action === 'fullscreen') win.setFullScreen(!win.isFullScreen());
  if (action === 'header') {
    if (win.isFullScreen()) fullscreenHeaderVisible = !fullscreenHeaderVisible;
    else settings.hideHeader = !settings.hideHeader;
    updatePresentation();
  }
}
function shortcuts(contents) {
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    const key = input.key.toLowerCase();
    if (key === 'f11') { event.preventDefault(); windowAction('fullscreen'); }
    else if ((input.control || input.meta) && input.shift && key === 'h') { event.preventDefault(); windowAction('header'); }
    else if (key === 'escape' && win.isFullScreen()) { event.preventDefault(); win.setFullScreen(false); }
  });
}
function arrange() {
  const [width, height] = win.getContentSize();
  const bounds = layout(width, height, settings.ratio, state().headerHidden);
  for (const id of Object.keys(views)) views[id].setBounds(bounds[id]);
  if (!win.isMaximized() && !win.isFullScreen()) { const [w, h] = win.getSize(); settings.width = w; settings.height = h; }
  queueSave(); send();
}
async function external(url) {
  let parsed; try { parsed = new URL(url); } catch { return; }
  if (!['https:', 'http:'].includes(parsed.protocol)) return;
  const result = await dialog.showMessageBox(win, { type: 'question', message: 'Buka tautan di browser?', detail: parsed.href, buttons: ['Batal', 'Buka browser'], defaultId: 0, cancelId: 0 });
  if (result.response === 1) await shell.openExternal(parsed.href);
}
function protect(contents, id) {
  contents.on('will-navigate', (event, url) => { if (!trusted(id, url)) { event.preventDefault(); void external(url); } });
  contents.on('will-redirect', (event, url) => { if (!trusted(id, url)) event.preventDefault(); });
  contents.setWindowOpenHandler(({ url }) => {
    if (!trusted(id, url)) { void external(url); return { action: 'deny' }; }
    return { action: 'allow', overrideBrowserWindowOptions: { width: 760, height: 680, autoHideMenuBar: true, webPreferences: { ...(id === 'telegram' ? { preload: path.join(__dirname, 'telegram-preload.cjs') } : {}), partition: `persist:${id}`, nodeIntegration: false, contextIsolation: true, sandbox: true } } };
  });
  contents.on('did-create-window', child => { child.setMenu(null); protect(child.webContents, id); });
}
function addService(id) {
  const ses = session.fromPartition(`persist:${id}`);
  ses.setUserAgent(app.userAgentFallback);
  const permitted = (wc, permission, origin) => {
    if (wc?.isDestroyed()) return false;
    return servicePermitted(id, settings.permissions[id], permission, origin, wc ? wc.getURL() : null);
  };
  ses.setPermissionCheckHandler((wc, permission, origin, details) => {
    if (!permitted(wc, permission, origin)) return false;
    if (permission === 'media' && details?.mediaType === 'audio') return mediaGate.check('microphone');
    if (permission === 'media' && details?.mediaType === 'video') return mediaGate.check('camera');
    return true;
  });
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (!permitted(wc, permission, details.requestingUrl)) { callback(false); return; }
    if (permission !== 'media') { callback(true); return; }
    void mediaGate.requestTypes(details.mediaTypes || []).then(granted => {
      // Permission may have been revoked or the requesting page changed while
      // the operating-system dialog was open.
      callback(granted && permitted(wc, permission, details.requestingUrl));
    }).catch(() => callback(false));
  });
  ses.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())) });
  });
  const view = new WebContentsView({ webPreferences: { ...(id === 'telegram' ? { preload: path.join(__dirname, 'telegram-preload.cjs') } : {}), partition: `persist:${id}`, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  view.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1c2622' : '#ffffff');
  views[id] = view; win.contentView.addChildView(view);
  protect(view.webContents, id);
  shortcuts(view.webContents);
  const update = (state, message = '') => { statuses[id] = { state, message }; send(); };
  view.webContents.on('did-start-loading', () => update('loading'));
  view.webContents.on('did-finish-load', () => { if (trusted(id, view.webContents.getURL()) || smoke) update('ready'); });
  view.webContents.on('did-fail-load', (_e, code, _description, _url, mainFrame) => { if (mainFrame && code !== -3) {
      update('error', `Gagal memuat (${code}). Periksa koneksi, lalu muat ulang.`);
      void view.webContents.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
    } });
  view.webContents.on('render-process-gone', () => update('error', 'Panel berhenti. Tekan Muat ulang.'));
  void view.webContents.loadURL(smoke ? `data:text/html,<h1>${SERVICES[id].name} smoke fixture</h1>` : SERVICES[id].url).catch(() => {});
}
function ownUI(event) { return win && event.sender === win.webContents && event.senderFrame?.url === uiURL; }
ipcMain.handle('state:get', event => ownUI(event) ? state() : null);
ipcMain.handle('about:info', event => ownAbout(event) ? { version: app.getVersion() } : null);
ipcMain.handle('about:close', event => { if (!ownAbout(event)) return null; aboutWindow.close(); return true; });
ipcMain.handle('about:website', event => { if (ownAbout(event)) return shell.openExternal(authorWebsite); });
ipcMain.handle('theme:set', (event, value) => { if (ownUI(event)) setTheme(value); });
ipcMain.handle('window:action', (event, action) => { if (ownUI(event)) windowAction(action); });
ipcMain.handle('ratio:set', (event, value) => { if (!ownUI(event)) return; settings.ratio = ratio(value); arrange(); });
ipcMain.handle('service:action', async (event, id, action) => {
  if (!ownUI(event) || !Object.hasOwn(SERVICES, id)) return;
  if (action === 'reload') { void views[id].webContents.loadURL(SERVICES[id].url).catch(() => {}); }
  if (action === 'browser') await external(SERVICES[id].url);
  if (action === 'permissions') {
    const result = await dialog.showMessageBox(win, { type: 'question', message: `Izin untuk ${SERVICES[id].name}`, detail: 'Izinkan situs resmi layanan ini memakai kamera, mikrofon, dan notifikasi di DuoChat. Sistem operasi dapat meminta izin tambahan. Dukungan panggilan mengikuti layanan web.', buttons: ['Batal', 'Izinkan', 'Cabut izin'], defaultId: 0, cancelId: 0 });
    if (result.response !== 0) {
      settings.permissions[id] = result.response === 1; save(); send();
      if (result.response === 1 && process.platform === 'darwin') {
        const microphone = await mediaGate.request('microphone');
        const camera = await mediaGate.request('camera');
        if (!microphone || !camera) await dialog.showMessageBox(win, {
          type: 'info', message: 'Periksa izin perangkat di macOS',
          detail: 'Buka System Settings → Privacy & Security → Microphone / Camera, lalu aktifkan DuoChat untuk perangkat yang ingin dipakai. Jika izin baru diubah, tutup dan buka lagi DuoChat. Untuk notifikasi, periksa System Settings → Notifications → DuoChat dan pengaturan notifikasi di layanan.',
          buttons: ['Oke']
        });
      }
    }
  }
});
if (primaryInstance) app.whenReady().then(async () => {
  app.userAgentFallback = browserUserAgent(app.userAgentFallback, app.getName());
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try { settings = cleanSettings(JSON.parse(fs.readFileSync(settingsPath, 'utf8'))); } catch { settings = cleanSettings(); }
  nativeTheme.themeSource = settings.theme === 'auto' ? 'system' : settings.theme;
  win = new BrowserWindow({ icon: windowIcon, width: settings.width, height: settings.height, minWidth: 1000, minHeight: 650, title: 'DuoChat', backgroundColor: '#edf2f1', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'DuoChat', submenu: [{ label: 'About DuoChat', click: showAbout }, { role: 'quit' }] }, { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] }, { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { label: 'Layar penuh (F11)', click: () => windowAction('fullscreen') }, { label: 'Tampilkan/sembunyikan header (Ctrl+Shift+H)', click: () => windowAction('header') }] }]));
  nativeTheme.on('updated', () => { if (win && !win.isDestroyed()) updateColors(); });
  updateColors();
  shortcuts(win.webContents);
  win.on('enter-full-screen', () => { fullscreenHeaderVisible = false; updatePresentation(); });
  win.on('leave-full-screen', () => { fullscreenHeaderVisible = false; updatePresentation(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  await win.loadFile(path.join(__dirname, 'index.html'));
  for (const id of Object.keys(SERVICES)) addService(id);
  updatePresentation(); win.on('resize', arrange);
  if (pendingFocus) focusExistingWindow();
  win.on('close', () => { save(); for (const view of Object.values(views)) if (!view.webContents.isDestroyed()) view.webContents.close(); });
  if (smoke) {
    setTimeout(async () => {
      try {
        const assert = require('node:assert/strict');
        assert.equal(Object.keys(views).length, 2);
        console.log(`Runtime: Electron ${process.versions.electron}; Chromium ${process.versions.chrome}`);
        for (const view of Object.values(views)) {
          const ua = await view.webContents.executeJavaScript('navigator.userAgent');
          assert.equal(ua, app.userAgentFallback);
          assert.ok(ua.includes(`Chrome/${process.versions.chrome}`));
          assert.ok(!ua.includes('Electron/') && !ua.includes('duochat-desktop/'));
          assert.equal(view.webContents.session.getUserAgent(), ua);
        }
        console.log(`Browser identity: ${app.userAgentFallback}`);
        assert.notEqual(views.whatsapp.webContents.session, views.telegram.webContents.session);
        await win.webContents.executeJavaScript('window.duo.setRatio(0.6)');
        assert.equal(settings.ratio, .6);
        const [cw, ch] = win.getContentSize();
        assert.deepEqual(views.whatsapp.getBounds(), layout(cw, ch, .6).whatsapp);
        assert.deepEqual(views.telegram.getBounds(), layout(cw, ch, .6).telegram);
        assert.match(await views.whatsapp.webContents.executeJavaScript('document.body.textContent'), /WhatsApp smoke fixture/);
        assert.equal(await views.telegram.webContents.executeJavaScript('typeof window.duo'), 'undefined');
        assert.equal(await win.webContents.executeJavaScript('typeof require'), 'undefined');
        assert.equal(await views.whatsapp.webContents.executeJavaScript('typeof require'), 'undefined');
        await win.webContents.executeJavaScript("window.duo.windowAction('header')");
        assert.equal(state().headerHidden, true);
        if (process.platform !== 'darwin') assert.equal(win.isMenuBarVisible(), false);
        assert.equal(views.whatsapp.getBounds().y, 56);
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('header')).display"), 'none');
        assert.equal(await win.webContents.executeJavaScript("getComputedStyle(document.querySelector('#restore-header')).display !== 'none'"), true);
        views.telegram.webContents.focus();
        views.telegram.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'H', modifiers: ['control', 'shift'] });
        views.telegram.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'H', modifiers: ['control', 'shift'] });
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(state().headerHidden, false);
        assert.equal(views.whatsapp.getBounds().y, 136);
        if (process.platform !== 'darwin') assert.equal(win.isMenuBarVisible(), true);
        // Fullscreen is exercised only when the test display has a window manager.
        if (process.argv.includes('--test-fullscreen')) {
          const transition = enabled => new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Fullscreen transition timed out')), 5000);
            win.once(enabled ? 'enter-full-screen' : 'leave-full-screen', () => { clearTimeout(timer); resolve(); });
            win.setFullScreen(enabled);
          });
          await transition(true);
          assert.equal(state().fullscreen, true);
          assert.equal(state().headerHidden, true);
          assert.equal(views.whatsapp.getBounds().y, 56);
          await win.webContents.executeJavaScript("window.duo.windowAction('header')");
          assert.equal(state().headerHidden, false);
          await transition(false);
          assert.equal(state().headerHidden, false);
          assert.equal(views.whatsapp.getBounds().y, 136);
          console.log('FULLSCREEN PASS: enter, automatic hide, recovery, exit');
        }
        await win.webContents.executeJavaScript("window.duo.setTheme('dark')");
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(state().effectiveTheme, 'dark');
        for (const view of Object.values(views)) assert.equal(await view.webContents.executeJavaScript("matchMedia('(prefers-color-scheme: dark)').matches"), true);
        assert.equal(await win.webContents.executeJavaScript("document.documentElement.dataset.theme"), 'dark');
        await win.webContents.executeJavaScript("window.duo.setTheme('light')");
        await new Promise(resolve => setTimeout(resolve, 100));
        for (const view of Object.values(views)) assert.equal(await view.webContents.executeJavaScript("matchMedia('(prefers-color-scheme: dark)').matches"), false);
        await win.webContents.executeJavaScript("window.duo.setTheme('auto')");
        assert.equal(nativeTheme.themeSource, 'system');
        console.log('THEME PASS: dark/light preferences reach both services; auto restores system');
        console.log('HEADER PASS: hide, menu visibility, recovered from Telegram keyboard focus');
        fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
        if (!process.argv.includes('--skip-capture')) fs.writeFileSync(path.join(process.cwd(), 'artifacts', 'shell.png'), (await win.capturePage()).toPNG());
        if (process.argv.includes('--capture-root')) require('node:child_process').execFileSync('import', ['-window', 'root', path.join(process.cwd(), 'artifacts', 'smoke.png')]);
        await win.webContents.executeJavaScript("window.duo.windowAction('about')");
        if (aboutWindow.webContents.isLoading()) await new Promise(resolve => aboutWindow.webContents.once('did-finish-load', resolve));
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(await aboutWindow.webContents.executeJavaScript("document.querySelector('#version').textContent"), app.getVersion());
        assert.equal(await aboutWindow.webContents.executeJavaScript("document.querySelector('#author-website').href"), authorWebsite);
        assert.match(await aboutWindow.webContents.executeJavaScript('document.body.textContent'), /by Codex.*prompt by TjongFaritno/);
        assert.equal(await aboutWindow.webContents.executeJavaScript('typeof require'), 'undefined');
        assert.equal(await win.webContents.executeJavaScript('window.duo.getAbout()'), null);
        if (process.argv.includes('--capture-root')) require('node:child_process').execFileSync('import', ['-window', 'root', path.join(process.cwd(), 'artifacts', 'about.png')]);
        assert.equal(await win.webContents.executeJavaScript('window.duo.closeAbout()'), null);
        const closingAbout = aboutWindow;
        const aboutClosed = new Promise(resolve => closingAbout.once('closed', resolve));
        await closingAbout.webContents.executeJavaScript('document.querySelector("#close-about").click()').catch(error => {
          if (!closingAbout.isDestroyed()) throw error;
        });
        await aboutClosed;
        assert.equal(aboutWindow, null);
        console.log('ABOUT PASS: runtime version, author credit, website link, restricted IPC');
        console.log('SMOKE PASS: two loaded views, isolated sessions, IPC, bounds, Node isolation');
        app.exit(0);
      } catch (error) { console.error(error); app.exit(1); }
    }, 2000);
  }
});
app.on('window-all-closed', () => app.quit());
