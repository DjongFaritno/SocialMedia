const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { layout, cleanSettings } = require('./core.cjs');
module.exports = async ({ app, win, views, settings, state, overlay, showOverlay, handleAccountAction, privacy, childWindows, powerMonitor, blurControllers, about }) => {
 const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
 const ready = async () => { const deadline = Date.now() + 8000; while (Object.values(views).some(view => view.webContents.isLoading())) { if (Date.now() > deadline) throw Error('Views did not load'); await sleep(40); } await sleep(100); };
 const ui = code => win.webContents.executeJavaScript(code);
 await ready(); assert.equal(Object.keys(views).length, 2);
 if (process.platform === 'win32' && app.isPackaged) {
  assert.equal(state().privacy.biometricLabel, 'Windows Hello');
  assert.ok(['Available','NotConfiguredForUser','DeviceNotPresent','DisabledByPolicy','DeviceBusy','UnknownError'].includes(state().privacy.biometricStatus), 'Native Windows Hello availability probe must load and run: ' + state().privacy.biometricStatus);
  const binding = require(path.join(process.resourcesPath, 'native', 'duochat_hello.node'));
  assert.throws(() => binding.verify(Buffer.alloc(0)));
  assert.throws(() => binding.verify(Buffer.alloc(8)));
  console.log('WINDOWS HELLO NATIVE PASS: packaged N-API binding, OS availability probe and invalid-window rejection; no CI biometric enrollment.');
 }
 assert.equal(await ui('typeof require'), 'undefined');
 assert.equal(await ui("document.querySelector('#update-button').textContent"), 'Cek update');
 for (const view of Object.values(views)) {
  assert.equal(await view.webContents.executeJavaScript('typeof window.duo'), 'undefined');
  assert.equal(await view.webContents.executeJavaScript('typeof require'), 'undefined');
  const ua = await view.webContents.executeJavaScript('navigator.userAgent'); assert.equal(ua, app.userAgentFallback); assert.ok(!ua.includes('Electron/'));
 }
 assert.notEqual(views.whatsapp.webContents.session, views.telegram.webContents.session);
 const oldSession = views.whatsapp.webContents.session;
 await oldSession.cookies.set({ url: 'https://web.whatsapp.com/', name: 'duochat-fixture', value: 'personal' });
 const added = await ui("window.duo.accountAction('add',{service:'whatsapp',name:'Toko kedua'})"); assert.equal(added.ok, true);
 assert.equal(Object.keys(views).length, 2, 'Stored account is lazy, not a live page');
 assert.equal(settings.accounts.length, 3);
 await ui(`window.duo.accountAction('select',{side:'right',id:${JSON.stringify(added.id)}})`); await ready();
 assert.equal(settings.slots.right, added.id); assert.equal(Object.keys(views).length, 2); assert.equal(views.telegram, undefined);
 const newSession = views[added.id].webContents.session; assert.notEqual(newSession, oldSession);
 assert.equal((await newSession.cookies.get({ url: 'https://web.whatsapp.com/' })).length, 0);
 assert.equal((await oldSession.cookies.get({ name: 'duochat-fixture' }))[0].value, 'personal');
 await ui(`window.duo.accountAction('select',{side:'left',id:${JSON.stringify(added.id)}})`);
 assert.equal(settings.slots.left, added.id); assert.equal(settings.slots.right, 'whatsapp');
 await ui("window.duo.accountAction('keep',{id:'telegram',value:true})"); await ready(); assert.equal(Object.keys(views).length, 3);
 assert.equal(views.telegram.getVisible(), false, 'Background connection has no visible panel');
 await ui("window.duo.accountAction('keep',{id:'telegram',value:false})"); assert.equal(Object.keys(views).length, 2);
 assert.equal((await ui("window.duo.accountAction('remove',{id:'whatsapp'})")).ok, false, 'Cannot delete a visible profile');
 assert.equal((await ui("window.duo.accountAction('select',{side:'oops',id:'whatsapp'})")).ok, false);
 assert.equal((await ui("window.duo.accountAction('add',{service:'unknown',name:'bad'})")).ok, false);
 await ui('window.duo.setRatio(.6)'); assert.equal(settings.ratio, .6);
 const [cw, ch] = win.getContentSize(); assert.deepEqual(views[added.id].getBounds(), layout(cw, ch, .6).whatsapp);
 await ui("window.duo.windowAction('header')"); await sleep(500);
 assert.equal(state().headerHidden, true); assert.equal(await ui("getComputedStyle(document.querySelector('header')).display"), 'none');
 assert.equal(await ui("getComputedStyle(document.querySelector('#account-rail')).display"), 'none');
 const bounds = views[added.id].getBounds();
 await ui("document.querySelector('#rail-trigger').dispatchEvent(new PointerEvent('pointerenter'))"); await sleep(100);
 assert.equal(overlay.getVisible(), true); assert.equal(overlay.getBounds().width, 88); assert.deepEqual(views[added.id].getBounds(), bounds);
 await overlay.webContents.executeJavaScript("window.dispatchEvent(new MouseEvent('mouseout',{relatedTarget:null}))"); await sleep(100); assert.equal(overlay.getVisible(), false);
 showOverlay('add'); await sleep(100); assert.equal(await overlay.webContents.executeJavaScript("document.querySelector('#add-dialog').open"), true);
 assert.equal(await overlay.webContents.executeJavaScript("document.querySelectorAll('[data-provider]').length"), 6);
 assert.equal(await overlay.webContents.executeJavaScript('typeof require'), 'undefined');
 await overlay.webContents.executeJavaScript("document.querySelector('[data-provider=instagram]').click();document.querySelector('#account-name').value='<img src=x onerror=alert(1)>';document.querySelector('#add-form').requestSubmit()"); await sleep(200);
 assert.equal(settings.accounts.length, 4); assert.equal(settings.accounts[3].service, 'instagram');
 assert.equal(await overlay.webContents.executeJavaScript("document.querySelectorAll('#account-settings img').length"), 0, 'Account labels are escaped');
 showOverlay(null); await ui("window.duo.windowAction('header')");
 for (const service of ['x', 'threads', 'discord']) {
  const result = await handleAccountAction('add', { service, name: service }); await handleAccountAction('select', { side: 'right', id: result.id }); await ready();
  assert.equal(Object.keys(views).length, 2); assert.match(await views[result.id].webContents.executeJavaScript('document.body.textContent'), /smoke fixture/);
 }
 await handleAccountAction('select', { side: 'left', id: 'whatsapp' }); await handleAccountAction('select', { side: 'right', id: 'telegram' }); await ready();
 assert.equal(views.whatsapp.webContents.session, oldSession); assert.equal((await oldSession.cookies.get({ name: 'duochat-fixture' }))[0].value, 'personal');
 assert.deepEqual(cleanSettings(JSON.parse(JSON.stringify(settings))).slots, settings.slots);
 for (const theme of ['dark', 'light']) {
  await ui(`window.duo.setTheme('${theme}')`); await sleep(100); assert.equal(await ui('document.documentElement.dataset.theme'), theme);
  for (const view of Object.values(views)) assert.equal(await view.webContents.executeJavaScript("matchMedia('(prefers-color-scheme: dark)').matches"), theme === 'dark');
 }
 await ui("window.duo.setTheme('auto')");
 fs.mkdirSync(path.join(process.cwd(), 'artifacts'), { recursive: true });
 if (!process.argv.includes('--skip-capture')) fs.writeFileSync(path.join(process.cwd(), 'artifacts', 'big-update.png'), (await win.capturePage()).toPNG());
 await ui("window.duo.windowAction('about')"); const aboutWindow = about(); if (aboutWindow.webContents.isLoading()) await new Promise(resolve => aboutWindow.webContents.once('did-finish-load', resolve)); await sleep(100);
 assert.equal(await aboutWindow.webContents.executeJavaScript("document.querySelector('#version').textContent"), app.getVersion());
 assert.match(await aboutWindow.webContents.executeJavaScript('document.body.textContent'), /prompt by TjongFaritno/);
 assert.equal(await ui('window.duo.getAbout()'), null);
 await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('About close timed out')), 5000); aboutWindow.once('closed', () => { clearTimeout(timer); resolve(); }); void aboutWindow.webContents.executeJavaScript("document.querySelector('#close-about').click()").catch(() => {}); });

 await require('./blur-smoke.cjs')({ app, win, views, settings, handleAccountAction, blurControllers });
 showOverlay('privacy'); await sleep(100);
 assert.equal(await overlay.webContents.executeJavaScript("document.querySelector('#privacy-dialog').open"), true);
 assert.equal(await overlay.webContents.executeJavaScript("document.querySelector('#biometric-row').hidden"), false);
 assert.equal(await overlay.webContents.executeJavaScript("document.querySelector('#biometric-on-start').disabled"), true);
 assert.match(await overlay.webContents.executeJavaScript("document.querySelector('#biometric-label').textContent"), process.platform === 'win32' ? /Windows Hello/ : process.platform === 'darwin' ? /Touch ID/ : /biometrik/);
 const privateUI = code => overlay.webContents.executeJavaScript(code);
 const password = 'smoke-only-password';
 assert.equal((await privateUI(`window.duo.privacyAction('save',{newPassword:${JSON.stringify(password)},confirmPassword:${JSON.stringify(password)},lockOnStart:true,lockOnOS:true})`)).ok, true);
 assert.equal(privacy.snapshot().configured, true);
 // Exercise the production session permission handlers on an intercepted,
 // secure official origin; this never contacts WhatsApp.
 const waSession = views.whatsapp.webContents.session;
 const waAccount = settings.accounts.find(item => item.id === 'whatsapp');
 waAccount.permissions = true;
 await waSession.protocol.handle('https', () => new Response('<!doctype html><title>Privacy fixture</title><h1>Private chat fixture</h1>', { headers: { 'Content-Type': 'text/html' } }));
 await views.whatsapp.webContents.loadURL('https://web.whatsapp.com/privacy-fixture');
 const notificationPermission = () => views.whatsapp.webContents.executeJavaScript('Notification.permission');
 assert.equal(await notificationPermission(), 'granted');
 const beforeLock = Object.fromEntries(Object.entries(views).map(([id, view]) => [id, view.webContents.id]));
 showOverlay(null);
 await ui("window.duo.privacyAction('cover',{side:'left'})"); await sleep(50);
 assert.equal(views.whatsapp.getVisible(), false); assert.equal(views.telegram.getVisible(), true);
 assert.equal(await notificationPermission(), 'denied', 'Covered account cannot show new notifications');
 assert.equal(await ui("document.querySelector('#left-cover').hidden"), false);
 await ui("window.duo.privacyAction('cover',{side:'left'})"); assert.equal(views.whatsapp.getVisible(), true);
 // Native popup, not a DOM simulation: it must hide with its account.
 const { BrowserWindow } = require('electron');
 const popup = new BrowserWindow({ show: true, webPreferences: { sandbox: true, nodeIntegration: false } });
 await popup.loadURL('data:text/html,<h1>Private popup fixture</h1>');
 childWindows.set('whatsapp', new Set([popup]));
 await ui("window.duo.privacyAction('lock')"); await sleep(100);
 assert.equal(state().privacy.locked, true); assert.equal(popup.isVisible(), false);
 assert.equal(await notificationPermission(), 'denied', 'Lock blocks notifications even after prior grant');
 assert.equal(await views.whatsapp.webContents.executeJavaScript("window.open('https://web.whatsapp.com/private-popup') === null"), true, 'Locked service cannot open a popup');
 assert.equal(overlay.getVisible(), true); assert.equal(overlay.getBounds().width, win.getContentSize()[0]);
 assert.equal(await privateUI("document.querySelector('#lock-screen').hidden"), false);
 for (const view of Object.values(views)) assert.equal(view.getVisible(), false);
 assert.equal(JSON.stringify(await ui('window.duo.getState()')).includes('credential'), false);
 const lockedBlur = JSON.stringify([settings.blur,settings.blurPanels]);
 assert.equal((await privateUI("window.duo.blurAction('toggle',{side:'left'})")).ok, false);
 assert.equal(JSON.stringify([settings.blur,settings.blurPanels]), lockedBlur);
 const originalRatio = settings.ratio; await ui('window.duo.setRatio(.3)'); assert.equal(settings.ratio, originalRatio);
 assert.equal(await ui("window.duo.accountAction('add',{service:'whatsapp',name:'Must not add'})"), null);
 const count = settings.accounts.length; assert.equal((await handleAccountAction('add', { service: 'whatsapp', name: 'Blocked' })).ok, false); assert.equal(settings.accounts.length, count);
 await ui("window.duo.overlay(null)"); assert.equal(overlay.getVisible(), true, 'Escape/close cannot remove lock');
 assert.equal((await ui(`window.duo.privacyAction('unlock',{password:${JSON.stringify(password)}})`)).ok, false, 'Unlock restricted to lock renderer');
 assert.equal((await privateUI("window.duo.privacyAction('unlock',{password:'wrong-password'})")).ok, false);
 await sleep(1100);
 assert.equal((await privateUI(`window.duo.privacyAction('unlock',{password:${JSON.stringify(password)}})`)).ok, true);
 await sleep(50);
 assert.equal(privacy.snapshot().locked, false); assert.equal(popup.isVisible(), true);
 assert.equal(await notificationPermission(), 'granted');
 assert.equal(views.whatsapp.getVisible(), true); assert.equal(views.telegram.getVisible(), true);
 for (const [id, wcId] of Object.entries(beforeLock)) assert.equal(views[id].webContents.id, wcId, 'Lock does not reload services or terminate sessions');
 powerMonitor.emit('lock-screen'); assert.equal(privacy.snapshot().locked, true);
 await privateUI(`window.duo.privacyAction('unlock',{password:${JSON.stringify(password)}})`);
 popup.destroy(); childWindows.delete('whatsapp');
 waSession.protocol.unhandle('https'); waAccount.permissions = false;
 assert.equal((await privateUI(`window.duo.privacyAction('disable',{currentPassword:${JSON.stringify(password)}})`)).ok, true);
 console.log('PRIVACY SMOKE PASS: settings UI, opaque native-view covers, real popup hidden/restored, full lock overlay, mutation/IPC guards, password rejection/unlock, preserved service processes and OS-lock event.');

 console.log('BIG UPDATE SMOKE PASS: migration, isolated dual WhatsApp, lazy profiles, switching/swapping, background/pause, all providers, native overlay hover bounds, modal, escaped labels, themes, About, sandbox and preserved session cookies.');
};
