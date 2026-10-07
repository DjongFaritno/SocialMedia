const { app, BrowserWindow, WebContentsView, ipcMain, dialog, shell, Menu, session } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { SERVICES, trusted, ratio, layout, cleanSettings, browserUserAgent } = require('./core.cjs');
const smoke = process.argv.includes('--smoke');
if (smoke) app.setPath('userData', fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'duochat-smoke-')));
let win, settings, settingsPath, saveTimer;
const views = {}, statuses = {};
const uiURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
function save() { clearTimeout(saveTimer); fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), { mode: 0o600 }); }
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }
function send() { if (win && !win.isDestroyed()) win.webContents.send('state', { ...settings, statuses }); }
function arrange() {
  const [width, height] = win.getContentSize();
  const bounds = layout(width, height, settings.ratio);
  for (const id of Object.keys(views)) views[id].setBounds(bounds[id]);
  if (!win.isMaximized()) { const [w, h] = win.getSize(); settings.width = w; settings.height = h; }
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
    return { action: 'allow', overrideBrowserWindowOptions: { width: 760, height: 680, autoHideMenuBar: true, webPreferences: { partition: `persist:${id}`, nodeIntegration: false, contextIsolation: true, sandbox: true } } };
  });
  contents.on('did-create-window', child => { child.setMenu(null); protect(child.webContents, id); });
}
function addService(id) {
  const ses = session.fromPartition(`persist:${id}`);
  ses.setUserAgent(app.userAgentFallback);
  const permitted = (wc, permission, origin) => ['media', 'notifications'].includes(permission) && settings.permissions[id] && trusted(id, origin) && wc && trusted(id, wc.getURL());
  ses.setPermissionCheckHandler((wc, permission, origin) => Boolean(permitted(wc, permission, origin)));
  ses.setPermissionRequestHandler((wc, permission, callback, details) => callback(Boolean(permitted(wc, permission, details.requestingUrl))));
  ses.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())) });
  });
  const view = new WebContentsView({ webPreferences: { partition: `persist:${id}`, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } });
  view.setBackgroundColor('#ffffff');
  views[id] = view; win.contentView.addChildView(view);
  protect(view.webContents, id);
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
ipcMain.handle('state:get', event => ownUI(event) ? { ...settings, statuses } : null);
ipcMain.handle('ratio:set', (event, value) => { if (!ownUI(event)) return; settings.ratio = ratio(value); arrange(); });
ipcMain.handle('service:action', async (event, id, action) => {
  if (!ownUI(event) || !Object.hasOwn(SERVICES, id)) return;
  if (action === 'reload') { void views[id].webContents.loadURL(SERVICES[id].url).catch(() => {}); }
  if (action === 'browser') await external(SERVICES[id].url);
  if (action === 'permissions') {
    const result = await dialog.showMessageBox(win, { type: 'question', message: `Izin untuk ${SERVICES[id].name}`, detail: 'Izinkan situs resmi layanan ini memakai kamera, mikrofon, dan notifikasi di DuoChat. Sistem operasi dapat meminta izin tambahan. Dukungan panggilan mengikuti layanan web.', buttons: ['Batal', 'Izinkan', 'Cabut izin'], defaultId: 0, cancelId: 0 });
    if (result.response !== 0) { settings.permissions[id] = result.response === 1; save(); send(); }
  }
});
app.whenReady().then(async () => {
  app.userAgentFallback = browserUserAgent(app.userAgentFallback, app.getName());
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try { settings = cleanSettings(JSON.parse(fs.readFileSync(settingsPath, 'utf8'))); } catch { settings = cleanSettings(); }
  win = new BrowserWindow({ width: settings.width, height: settings.height, minWidth: 1000, minHeight: 650, title: 'DuoChat', backgroundColor: '#edf2f1', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false } });
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'DuoChat', submenu: [{ role: 'about' }, { role: 'quit' }] }, { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] }, { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }] }]));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  await win.loadFile(path.join(__dirname, 'index.html'));
  for (const id of Object.keys(SERVICES)) addService(id);
  arrange(); win.on('resize', arrange);
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
        fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), 'artifacts', 'shell.png'), (await win.capturePage()).toPNG());
        if (process.argv.includes('--capture-root')) require('node:child_process').execFileSync('import', ['-window', 'root', path.join(process.cwd(), 'artifacts', 'smoke.png')]);
        console.log('SMOKE PASS: two loaded views, isolated sessions, IPC, bounds, Node isolation');
        app.exit(0);
      } catch (error) { console.error(error); app.exit(1); }
    }, 2000);
  }
});
app.on('window-all-closed', () => app.quit());
