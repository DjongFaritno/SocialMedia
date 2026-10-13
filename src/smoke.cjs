const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { layout, cleanSettings } = require('./core.cjs');
module.exports = async ({ app, win, views, settings, state, overlay, showOverlay, handleAccountAction, about }) => {
 const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
 const ready = async () => { const deadline = Date.now() + 8000; while (Object.values(views).some(view => view.webContents.isLoading())) { if (Date.now() > deadline) throw Error('Views did not load'); await sleep(40); } await sleep(100); };
 const ui = code => win.webContents.executeJavaScript(code);
 await ready(); assert.equal(Object.keys(views).length, 2);
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
 console.log('BIG UPDATE SMOKE PASS: migration, isolated dual WhatsApp, lazy profiles, switching/swapping, background/pause, all providers, native overlay hover bounds, modal, escaped labels, themes, About, sandbox and preserved session cookies.');
};
