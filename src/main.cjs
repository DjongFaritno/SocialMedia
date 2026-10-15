const { app, BrowserWindow, WebContentsView, ipcMain, dialog, shell, Menu, session, nativeTheme, systemPreferences, nativeImage, net, webContents, powerMonitor } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { SERVICES, trusted, ratio, layout, cleanSettings, browserUserAgent } = require('./core.cjs');
const { servicePermitted, nativeMediaGate } = require('./permissions.cjs');
const { randomUUID } = require('node:crypto');
const { MAX_ACCOUNTS, partition, switchAccount, liveAccounts } = require('./accounts.cjs');
const { navigationAllowed, protectNavigation } = require('./navigation.cjs');
const { createUpdates } = require('./updates.cjs');
const { createPrivacy, defaults: privacyDefaults } = require('./privacy.cjs');
const { cleanBlur, blurSupport, attachBlur } = require('./blur.cjs');
const blurControllers = new Map(), blurStatuses = {};
let updates, privacy, idleTimer;
const privacyHiddenChildren = new Set();
const mediaGate = nativeMediaGate(process.platform, systemPreferences);
const smoke = process.argv.includes('--smoke');
if (smoke) app.setPath('userData', fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'duochat-smoke-')));
let win, aboutWindow, overlay, settings, settingsPath, saveTimer;
let overlayMode = null, overlayReturnFocus;
const configuredSessions = new Set(), childWindows = new Map();
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
const overlayURL = pathToFileURL(path.join(__dirname, 'overlay.html')).href;
const uiURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
function save() { clearTimeout(saveTimer); fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { mode: 0o600 }); }
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
function state() {
  const fullscreen = win.isFullScreen();
  return { ...settings, blurSupport: blurSupport(), blurStatuses, privacy: privacy?.snapshot(), updates: updates?.snapshot(), statuses, fullscreen, effectiveTheme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light', headerHidden: fullscreen ? !fullscreenHeaderVisible : settings.hideHeader };
}
function send() { if (win && !win.isDestroyed()) win.webContents.send('state', state()); if (overlay && !overlay.webContents.isDestroyed()) overlay.webContents.send('state', { ...state(), overlayMode }); }
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
  if (!state().headerHidden && overlayMode === "rail") showOverlay(null);
  win.setMenuBarVisibility(!state().headerHidden);
  arrange();
  // Hiding the native menu changes content height without a resize event.
  setTimeout(() => { if (win && !win.isDestroyed()) arrange(); }, 100);
}
function showAbout() {
  if (privacy?.snapshot().locked) return;
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
  if (privacy?.snapshot().locked && action !== 'fullscreen') return;
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
    if ((input.control || input.meta) && input.shift && key === 'l') { event.preventDefault(); lockOrSetup(); return; }
    if (key === 'escape' && overlayMode) { event.preventDefault(); showOverlay(null); return; }
    if (key === 'f11') { event.preventDefault(); windowAction('fullscreen'); }
    else if ((input.control || input.meta) && input.shift && key === 'h') { event.preventDefault(); windowAction('header'); }
    else if (key === 'escape' && win.isFullScreen()) { event.preventDefault(); win.setFullScreen(false); }
  });
}
function arrange() {
  const [width, height] = win.getContentSize();
  const bounds = layout(width, height, settings.ratio, state().headerHidden);
  for (const [id, view] of Object.entries(views)) {
    const side = Object.entries(settings.slots).find(([, accountId]) => accountId === id)?.[0];
    view.setVisible(Boolean(side) && !privacy.concealed(side));
    if (side) view.setBounds(bounds[side === 'left' ? 'whatsapp' : 'telegram']);
  }
  if (overlay) {
    overlay.setBounds(overlayMode === 'rail' ? { x: 0, y: state().headerHidden ? 0 : 80, width: 88, height: Math.max(1, height - 40 - (state().headerHidden ? 0 : 80)) } : { x: 0, y: 0, width, height });
  }
  if (!win.isMaximized() && !win.isFullScreen()) { const [w, h] = win.getSize(); settings.width = w; settings.height = h; }
  queueSave(); send();
}
async function external(url, accountId) {
  if (privacy?.snapshot().locked || (accountId && accountConcealed(accountId))) return;
  let parsed; try { parsed = new URL(url); } catch { return; }
  if (!['https:', 'http:'].includes(parsed.protocol)) return;
  const result = await dialog.showMessageBox(win, { type: 'question', message: 'Buka tautan di browser?', detail: parsed.href, buttons: ['Batal', 'Buka browser'], defaultId: 0, cancelId: 0 });
  if (result.response === 1 && !privacy.snapshot().locked && !(accountId && accountConcealed(accountId))) await shell.openExternal(parsed.href);
}
function accountById(id) { return settings.accounts.find(item => item.id === id); }
function accountConcealed(id) {
  const side = Object.entries(settings.slots).find(([, accountId]) => accountId === id)?.[0];
  return privacy?.snapshot().locked || Boolean(side && privacy.concealed(side));
}
function lockOrSetup() {
  if (!privacy.snapshot().configured) showOverlay('privacy');
  else privacy.lock();
}
function privacyChanged() {
  if (!win || win.isDestroyed() || !overlay) return;
  const locked = privacy.snapshot().locked;
  if (locked && aboutWindow && !aboutWindow.isDestroyed()) aboutWindow.close();
  for (const [id, children] of childWindows) for (const child of children) {
    if (child.isDestroyed()) { privacyHiddenChildren.delete(child); continue; }
    if (accountConcealed(id)) {
      if (child.isVisible()) privacyHiddenChildren.add(child);
      child.hide();
    } else if (privacyHiddenChildren.delete(child)) child.show();
  }
  if (locked) showOverlay('lock');
  else if (overlayMode === 'lock') showOverlay(null);
  else arrange();
}
function protect(contents, account) {
  const service = account.service;
  const blurController = attachBlur(contents, service, () => settings.blur, value => {
    if (views[account.id]?.webContents === contents) { blurStatuses[account.id] = value; send(); }
  });
  blurControllers.set(contents.id, blurController);
  contents.once('destroyed', () => blurControllers.delete(contents.id));
  protectNavigation(contents, {
    service, external: url => external(url, account.id), canOpen: () => !accountConcealed(account.id),
    popupPreferences: () => ({ width: 760, height: 680, autoHideMenuBar: true, webPreferences: { ...(service === 'telegram' ? { preload: path.join(__dirname, 'telegram-preload.cjs') } : {}), partition: partition(account), nodeIntegration: false, contextIsolation: true, sandbox: true } }),
    onChild: child => {
      child.setMenu(null); protect(child.webContents, account); shortcuts(child.webContents);
      const children = childWindows.get(account.id) || new Set(); children.add(child); childWindows.set(account.id, children);
      child.on('show', () => { if (accountConcealed(account.id)) { privacyHiddenChildren.add(child); child.hide(); } });
      if (accountConcealed(account.id)) { privacyHiddenChildren.add(child); child.hide(); }
      child.on('closed', () => { children.delete(child); privacyHiddenChildren.delete(child); });
    }
  });
}
function addService(account) {
  const id = account.id, service = account.service;
  const ses = session.fromPartition(partition(account));
  ses.setUserAgent(app.userAgentFallback);
  if (!configuredSessions.has(id)) {
    configuredSessions.add(id);
    const permitted = (wc, permission, origin) => {
      const current = accountById(id);
      if (!current || !views[id] || wc?.isDestroyed() || accountConcealed(id)) return false;
      return servicePermitted(service, current.permissions, permission, origin, wc ? wc.getURL() : null);
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
      void mediaGate.requestTypes(details.mediaTypes || []).then(granted => callback(granted && permitted(wc, permission, details.requestingUrl))).catch(() => callback(false));
    });
    ses.on('will-download', (_event, item) => {
      if (!accountById(id) || !views[id] || accountConcealed(id)) { item.cancel(); return; }
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())) });
    });
  }
  const view = new WebContentsView({ webPreferences: { ...(service === 'telegram' ? { preload: path.join(__dirname, 'telegram-preload.cjs') } : {}), partition: partition(account), sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  view.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1c2622' : '#ffffff');
  view.setVisible(false);
  views[id] = view; win.contentView.addChildView(view);
  protect(view.webContents, account); shortcuts(view.webContents);
  const update = (value, message = '') => { if (views[id] === view) { statuses[id] = { state: value, message }; send(); } };
  view.webContents.on('did-start-loading', () => update('loading'));
  view.webContents.on('did-finish-load', () => { if (navigationAllowed(service, view.webContents.getURL()) || smoke) update('ready'); });
  view.webContents.on('did-fail-load', (_e, code, _description, _url, mainFrame) => {
    if (mainFrame && code !== -3 && views[id] === view) {
      update('error', `Gagal memuat (${code}). Periksa koneksi, lalu muat ulang.`);
      void view.webContents.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
    }
  });
  view.webContents.on('render-process-gone', () => update('error', 'Panel berhenti. Tekan Muat ulang.'));
  void view.webContents.loadURL(smoke ? `data:text/html,<h1>${SERVICES[service].name} smoke fixture</h1>` : SERVICES[service].url).catch(() => {});
}
function closeAccount(id) {
  for (const child of childWindows.get(id) || []) if (!child.isDestroyed()) child.destroy();
  childWindows.delete(id);
  const view = views[id]; delete views[id]; delete blurStatuses[id]; statuses[id] = { state: 'paused' };
  if (view) { win.contentView.removeChildView(view); if (!view.webContents.isDestroyed()) view.webContents.close(); }
}
function syncAccounts() {
  const live = new Set(liveAccounts(settings).map(item => item.id));
  for (const id of Object.keys(views)) if (!live.has(id)) closeAccount(id);
  for (const account of liveAccounts(settings)) if (!views[account.id]) addService(account);
  // Native child views cover the HTML shell. Keep our trusted overlay above them.
  if (overlay) { win.contentView.removeChildView(overlay); win.contentView.addChildView(overlay); }
  arrange();
}
function showOverlay(mode, focus = false) {
  if (privacy.snapshot().locked) mode = 'lock';
  if (!['rail', 'add', 'manage', 'privacy', 'blur', 'lock', null].includes(mode)) return;
  if (mode === 'rail' && !state().headerHidden) return;
  if (mode && !overlayMode) overlayReturnFocus = webContents.getFocusedWebContents();
  const hadOverlayFocus = overlay.webContents.isFocused();
  overlayMode = mode;
  overlay.setVisible(Boolean(mode)); arrange(); send();
  if (mode && (mode !== 'rail' || focus)) overlay.webContents.focus();
  if (!mode && hadOverlayFocus) {
    const target = overlayReturnFocus && !overlayReturnFocus.isDestroyed() ? overlayReturnFocus : win.webContents;
    target.focus();
  }
}
function editableUI(event) { return ownUI(event) && !privacy?.snapshot().locked; }
ipcMain.handle('privacy:action', (event, action, input) => {
  if (!ownUI(event) || !privacy) return { ok: false };
  if (['save', 'disable', 'unlock', 'biometric'].includes(action) && event.sender !== overlay?.webContents) return { ok: false };
  if (action === 'cover') return togglePanelCover(input);
  return privacy.action(action, input);
});
function togglePanelCover(input) {
  if (!input || !['left', 'right'].includes(input.side) || privacy.snapshot().locked) return { ok: false };
  return privacy.action('cover', { side: input.side });
}
let blurActions = Promise.resolve();
ipcMain.handle('blur:action', (event, action, input) => {
  if (!editableUI(event)) return { ok: false, error: 'Buka kunci dulu.' };
  const run = async () => {
    if (!editableUI(event)) return { ok: false, error: 'Buka kunci dulu.' };
    const previous = settings.blur;
    if (action === 'toggle') settings.blur = cleanBlur({ ...settings.blur, enabled: !settings.blur.enabled });
    else if (action === 'save' && input && typeof input === 'object' && !Array.isArray(input)) settings.blur = cleanBlur(input);
    else return { ok: false, error: 'Pengaturan blur tidak valid.' };
    if (settings.blur.enabled && !Object.values(settings.blur.elements).some(Boolean)) { settings.blur = previous; return { ok: false, error: 'Pilih minimal satu elemen untuk mengaktifkan blur.' }; }
    try { save(); } catch { settings.blur = previous; return { ok: false, error: 'Pengaturan belum tersimpan. Periksa penyimpanan lalu coba lagi.' }; } send();
    await Promise.allSettled([...blurControllers.values()].map(controller => controller.refresh()));
    return { ok: true };
  };
  const operation = blurActions.then(run, run); blurActions = operation.catch(() => {});
  return operation;
});
function ownUI(event) { return win && ((event.sender === win.webContents && event.senderFrame?.url === uiURL) || (overlay && event.sender === overlay.webContents && event.senderFrame?.url === overlayURL)); }
ipcMain.handle('state:get', event => ownUI(event) ? { ...state(), overlayMode } : null);
ipcMain.handle('about:info', event => ownAbout(event) ? { version: app.getVersion() } : null);
ipcMain.handle('about:close', event => { if (!ownAbout(event)) return null; aboutWindow.close(); return true; });
ipcMain.handle('about:website', event => { if (ownAbout(event)) return shell.openExternal(authorWebsite); });
ipcMain.handle('update:action', (event, action) => { if (!privacy?.snapshot().locked && (ownUI(event) || ownAbout(event))) return updates?.action(action); });
ipcMain.handle('theme:set', (event, value) => { if (editableUI(event)) setTheme(value); });
ipcMain.handle('window:action', (event, action) => { if (ownUI(event)) windowAction(action); });
ipcMain.handle('ratio:set', (event, value) => { if (!editableUI(event)) return; settings.ratio = ratio(value); arrange(); });
ipcMain.handle('service:action', async (event, id, action) => {
  if (!editableUI(event)) return;
  const account = accountById(id); if (!account || accountConcealed(id)) return;
  const service = account.service;
  if (action === 'reload') { if (!views[id]) return; void views[id].webContents.loadURL(smoke ? `data:text/html,<h1>${SERVICES[service].name} smoke fixture</h1>` : SERVICES[service].url).catch(() => {}); }
  if (action === 'browser') await external(SERVICES[service].url, id);
  if (action === 'permissions') {
    const result = await dialog.showMessageBox(win, { type: 'question', message: `Izin untuk ${account.name}`, detail: 'Izinkan situs resmi layanan ini memakai kamera, mikrofon, dan notifikasi di DuoChat. Sistem operasi dapat meminta izin tambahan. Dukungan panggilan mengikuti layanan web.', buttons: ['Batal', 'Izinkan', 'Cabut izin'], defaultId: 0, cancelId: 0 });
    if (result.response !== 0) {
      if (accountById(id) !== account || accountConcealed(id)) return; account.permissions = result.response === 1; if (['whatsapp', 'telegram'].includes(id)) settings.permissions[id] = account.permissions; save(); send();
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
ipcMain.handle('ui:overlay', (event, mode, focus) => { if (ownUI(event)) showOverlay(mode, focus === true); });
let accountActions = Promise.resolve();
ipcMain.handle('account:action', (event, action, input) => {
  if (!editableUI(event)) return null;
  const run = () => handleAccountAction(action, input);
  const operation = accountActions.then(run, run); accountActions = operation.catch(() => {}); return operation;
});
async function handleAccountAction(action, input = {}) {
  if (privacy.snapshot().locked) return { ok: false, error: 'Buka kunci dulu.' };
  if (!input || typeof input !== 'object') return { ok: false, error: 'Permintaan akun tidak valid.' };
  let account = accountById(input.id);
  if (action === 'add') {
    if (!Object.hasOwn(SERVICES, input.service) || settings.accounts.length >= MAX_ACCOUNTS) return { ok: false, error: 'Layanan tidak valid atau batas 30 akun tercapai.' };
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
    if (!name) return { ok: false, error: 'Isi nama akun dulu.' };
    account = { id: 'account-' + randomUUID(), service: input.service, name, keepActive: false, permissions: false };
    settings.accounts.push(account); save(); send(); return { ok: true, id: account.id };
  }
  if (!account) return { ok: false, error: 'Akun tidak ditemukan.' };
  if (action === 'select') {
    if (!['left', 'right'].includes(input.side)) return { ok: false, error: 'Panel tidak valid.' };
    const previous = accountById(settings.slots[input.side]);
    // Never silently terminate an account when it leaves a panel. The user
    // can keep its connection (including calls) alive or explicitly pause it.
    if (previous.id !== account.id && !previous.keepActive && !Object.values(settings.slots).includes(account.id) && !smoke) {
      const result = await dialog.showMessageBox(win, { type: 'question', message: `Ganti panel ${input.side === 'left' ? 'kiri' : 'kanan'}?`, detail: `${previous.name} akan keluar dari panel. Menjeda akun menghentikan halaman, panggilan, dan notifikasinya. Pilih Tetap aktif jika masih ingin terhubung.`, buttons: ['Batal', 'Tetap aktif', 'Jeda akun lama'], defaultId: 1, cancelId: 0 });
      if (result.response === 0 || privacy.snapshot().locked) return { ok: false, error: 'Pergantian akun dibatalkan.' };
      if (result.response === 1) previous.keepActive = true;
    }
    switchAccount(settings, input.side, account.id);
  } else if (action === 'rename') {
    const name = typeof input.name === 'string' ? input.name.trim().slice(0, 40) : '';
    if (!name) return { ok: false, error: 'Nama akun tidak boleh kosong.' }; account.name = name;
  } else if (action === 'keep') {
    if (typeof input.value !== 'boolean') return { ok: false, error: 'Status akun tidak valid.' };
    if (!input.value && account.keepActive && !Object.values(settings.slots).includes(account.id) && !smoke) {
      const result = await dialog.showMessageBox(win, { type: 'question', message: `Jeda ${account.name}?`, detail: 'Halaman akun akan ditutup. Panggilan dan notifikasi akun ini berhenti sampai dibuka lagi.', buttons: ['Batal', 'Jeda'], defaultId: 0, cancelId: 0 });
      if (result.response !== 1 || privacy.snapshot().locked) return { ok: false, error: 'Akun tetap aktif.' };
    }
    account.keepActive = input.value;
  } else if (action === 'remove') {
    if (settings.accounts.length <= 2) return { ok: false, error: 'Sisakan minimal dua akun untuk kedua panel.' };
    if (Object.values(settings.slots).includes(account.id)) return { ok: false, error: 'Ganti akun di panel dulu sebelum menghapusnya.' };
    const result = await dialog.showMessageBox(win, { type: 'warning', message: `Hapus ${account.name} dari DuoChat?`, detail: 'Sesi login dan data situs akun ini di komputer akan dihapus. Akun layanan dan percakapan di layanan tidak dihapus.', buttons: ['Batal', 'Hapus dari DuoChat'], defaultId: 0, cancelId: 0 });
    if (result.response !== 1 || privacy.snapshot().locked) return { ok: false, error: 'Penghapusan dibatalkan.' };
    closeAccount(account.id);
    const ses = session.fromPartition(partition(account));
    try { await ses.clearStorageData(); await ses.clearCache(); await ses.closeAllConnections(); } catch { return { ok: false, error: 'Data sesi belum berhasil dihapus. Coba lagi.' }; }
    settings.accounts = settings.accounts.filter(item => item.id !== account.id);
  } else return { ok: false, error: 'Aksi akun tidak dikenal.' };
  save(); syncAccounts(); return { ok: true, id: account.id };
}
if (primaryInstance) app.whenReady().then(async () => {
  app.userAgentFallback = browserUserAgent(app.userAgentFallback, app.getName());
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try { settings = cleanSettings(JSON.parse(fs.readFileSync(settingsPath, 'utf8'))); } catch { settings = cleanSettings(); }
  const privacyPath = path.join(app.getPath('userData'), 'privacy.json');
  let record = privacyDefaults();
  try {
    if (fs.existsSync(privacyPath)) record = JSON.parse(fs.readFileSync(privacyPath, 'utf8'));
    privacy = createPrivacy({
      record, changed: privacyChanged,
      persist: next => { const temporary = privacyPath + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(next), { mode: 0o600 }); fs.renameSync(temporary, privacyPath); },
      canBiometric: () => process.platform === 'darwin' && systemPreferences.canPromptTouchID(),
      promptBiometric: () => systemPreferences.promptTouchID('membuka ruang ngobrolmu di DuoChat')
    });
  } catch {
    dialog.showErrorBox('Pengaturan privasi tidak terbaca', 'DuoChat tidak membuka percakapan karena pengaturan privasi rusak. Pulihkan privacy.json dari cadangan di direktori data aplikasi. Jangan hapus profil chat untuk mengatasinya.');
    app.exit(1); return;
  }
  powerMonitor.on('lock-screen', () => privacy.systemLock());
  powerMonitor.on('suspend', () => privacy.systemLock());
  powerMonitor.on('resume', () => privacy.systemLock());
  idleTimer = setInterval(() => { try { privacy.idle(powerMonitor.getSystemIdleTime()); } catch { /* OS may not expose idle time. */ } }, 5000);
  idleTimer.unref();
  nativeTheme.themeSource = settings.theme === 'auto' ? 'system' : settings.theme;
  win = new BrowserWindow({ show: false, icon: windowIcon, width: settings.width, height: settings.height, minWidth: 1000, minHeight: 650, title: 'DuoChat', backgroundColor: '#edf2f1', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  updates = createUpdates({ app, net, dialog, shell, getWindow: () => aboutWindow && !aboutWindow.isDestroyed() ? aboutWindow : win, getSettings: () => settings, save, notify: send });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'DuoChat', submenu: [{ label: 'About DuoChat', click: showAbout }, { label: 'Tambah akun…', click: () => showOverlay('add') }, { label: 'Kelola akun…', click: () => showOverlay('manage') }, { label: 'Privasi…', click: () => showOverlay('privacy') }, { label: 'Atur blur semua panel…', click: () => showOverlay('blur') }, { label: 'Kunci DuoChat', accelerator: 'CommandOrControl+Shift+L', click: lockOrSetup }, { label: 'Cek pembaruan…', click: () => void updates.check(true) }, { type: 'separator' }, { label: 'Periksa pembaruan otomatis', type: 'checkbox', checked: settings.autoCheckUpdates, click: item => updates.preference('autoCheckUpdates', item.checked) }, { label: 'Unduh pembaruan otomatis', type: 'checkbox', checked: settings.autoDownloadUpdates, enabled: updates.snapshot().mode === 'native', click: item => updates.preference('autoDownloadUpdates', item.checked) }, { type: 'separator' }, { role: 'quit' }] }, { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] }, { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { label: 'Layar penuh (F11)', click: () => windowAction('fullscreen') }, { label: 'Tampilkan/sembunyikan header (Ctrl+Shift+H)', click: () => windowAction('header') }] }]));
  nativeTheme.on('updated', () => { if (win && !win.isDestroyed()) updateColors(); });
  updateColors();
  shortcuts(win.webContents);
  win.on('enter-full-screen', () => { fullscreenHeaderVisible = false; updatePresentation(); });
  win.on('leave-full-screen', () => { fullscreenHeaderVisible = false; updatePresentation(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  await win.loadFile(path.join(__dirname, 'index.html'));
  overlay = new WebContentsView({ webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  overlay.setBackgroundColor('#00000000'); overlay.setVisible(false); win.contentView.addChildView(overlay);
  overlay.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  overlay.webContents.on('will-navigate', event => event.preventDefault()); shortcuts(overlay.webContents);
  await overlay.webContents.loadFile(path.join(__dirname, 'overlay.html'));
  syncAccounts();
  privacyChanged(); win.show();
  updatePresentation(); win.on('resize', arrange);
  if (!smoke && app.isPackaged) updates.start();
  if (pendingFocus) focusExistingWindow();
  win.on('close', () => { save(); clearTimeout(saveTimer); for (const id of Object.keys(views)) closeAccount(id); if (overlay && !overlay.webContents.isDestroyed()) overlay.webContents.close(); });
  if (smoke) setTimeout(() => require('./smoke.cjs')({ app, win, views, settings, state, overlay, showOverlay, handleAccountAction, privacy, childWindows, powerMonitor, blurControllers, mediaGate, about: () => aboutWindow }).then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1); }), 1600);
});
app.on('before-quit', () => { clearInterval(idleTimer); updates?.stop(); });
app.on('window-all-closed', () => app.quit());
