const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SERVICES } = require('./accounts.cjs');
const { cleanBlur, ADAPTERS } = require('./blur.cjs');
const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const pic = attributes => '<img src="' + image + '" ' + attributes + '>';
const fixtures = {
 ...require('./blur-service-fixtures.cjs'),
 whatsapp: '<div id="pane-side"><div role="row"><span data-testid="cell-frame-title" id="person">Private contact</span><div data-testid="cell-frame-secondary" id="preview">Private preview</div>' + pic('id="avatar"') + '</div></div><div id="main"><div data-testid="msg-container" data-id="fixture-media"><span class="selectable-text" contenteditable="false" role="textbox" aria-readonly="true" id="message">Private message</span>' + pic('id="media"') + '</div><footer><div contenteditable="true" data-testid="conversation-compose-box-input" id="editor">Reply</div></footer></div>',
 telegram: '<div class="ChatInfo"><span class="title" id="person">Private contact</span></div><div class="ListItem Chat"><div class="subtitle" id="preview">Preview</div></div><div class="Avatar" id="avatar">AB</div><div class="Message"><span class="text-content" id="message">Private message</span>' + pic('class="full-media" id="media"') + '</div><div class="MessageInput"><div contenteditable="true" id="message-input-text"><span id="editor">Reply</span></div></div>',
 discord: '<span class="username_fixture" id="person">Private contact</span><span class="lastMessage_fixture" id="preview">Preview</span>' + pic('class="avatar_fixture" id="avatar"') + '<li id="chat-messages-1"><div id="message-content-1"><span id="message">Private message</span></div><div class="imageWrapper_fixture">' + pic('id="media"') + '</div></li><div data-slate-editor="true" role="textbox" contenteditable="true" id="editor">Reply</div>',
 x: '<div data-testid="User-Name" id="person">Private contact</div><div data-testid="conversation"><span data-testid="preview" id="preview">Preview</span></div><div data-testid="UserAvatar-Container-fixture" id="avatar">' + pic('') + '</div><div data-testid="tweetText" id="message">Private post</div><div data-testid="tweetPhoto">' + pic('id="media"') + '</div><div data-testid="tweetTextarea_0" role="textbox" contenteditable="true" id="editor">Reply</div>',
 instagram: '<main role="main"><article><header>' + pic('alt="Profile picture" id="avatar"') + '</header><h3><a href="/person/" id="person">Private contact</a></h3><h1 id="message">Private caption</h1>' + pic('id="media" alt="Photo"') + '</article><div data-testid="direct-thread-preview" id="preview">Preview</div><div role="textbox" contenteditable="true" id="editor">Reply</div></main>',
 threads: '<main role="main"><div data-pressable-container="true"><a href="/@person" id="person">Private contact</a><a href="/@person">' + pic('id="avatar"') + '</a><div dir="auto" id="message">Private post</div>' + pic('id="media"') + '</div><div role="textbox" contenteditable="true" id="editor">Reply</div></main>'
};
function html(service) {
 return '<!doctype html><html><head><style>body{padding:20px;margin:0;font:16px sans-serif}#message{display:block;width:160px;min-height:32px;padding:6px;margin:8px 0;filter:sepia(1)}img{display:block;width:36px;height:36px}#person,#preview{display:block;min-height:26px}#editor{min-height:32px}button{margin:8px}</style></head><body>' + fixtures[service] + '<button id="plain-button">Unchanged button</button></body></html>';
}
module.exports = async ({ app, win, views, settings, handleAccountAction, blurControllers }) => {
 const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
 const ui = code => win.webContents.executeJavaScript(code);
 const originalSlots = { ...settings.slots }, originalBlur = settings.blur, originalPanels = {...settings.blurPanels};
 let config = cleanBlur({ enabled: true });
 const save = async next => { config = cleanBlur(next); const result=await ui('window.duo.blurAction("save",' + JSON.stringify(config) + ')'); assert.equal(result.ok,true,'Saving blur: '+JSON.stringify(result)+' config='+JSON.stringify(config)); for(const side of ["left","right"]) assert.equal((await ui('window.duo.blurAction("set",'+JSON.stringify({side,enabled:config.enabled})+')')).ok,true); };
 const settled = wc => blurControllers.get(wc.id).refresh();
 const evaluate = (wc, code) => wc.executeJavaScript(code);
 const isBlurred = (wc, id) => evaluate(wc, '(() => {let e=document.getElementById(' + JSON.stringify(id) + ');for(;e;e=e.parentElement)if(getComputedStyle(e).filter.includes("blur("))return true;return false;})()');
 async function move(wc, x, y) {
  // Drive Chromium's pointer directly. macOS runner window focus/coordinate
  // routing can drop synthetic native mouse moves in WebContentsViews.
  if (!wc.debugger.isAttached()) wc.debugger.attach('1.3');
  await wc.debugger.sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
  await sleep(80);
 }
 async function hover(wc, id) {
  const point = await evaluate(wc, '(() => {const r=document.getElementById(' + JSON.stringify(id) + ').getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};})()');
  win.focus(); wc.focus(); await move(wc, point.x, point.y);
 }
 async function waitForDocument(wc) {
  const deadline = Date.now() + 8000;
  while (wc.isLoading() || !wc.getURL()) {
   assert.ok(Date.now() < deadline, 'Initial service fixture did not finish loading');
   await sleep(20);
  }
 }
 async function mount(account, service) {
  await handleAccountAction('select', { side: 'left', id: account.id });
  const wc = views[account.id].webContents, ses = wc.session;
  await waitForDocument(wc);
  await ses.protocol.handle('https', () => new Response(html(service), { headers: { 'Content-Type': 'text/html' } }));
  await wc.loadURL(SERVICES[service].url); await settled(wc);
  await move(wc, 2, 2);
  return wc;
 }
 // Exercise the real configuration form without ever setting an app password.
 await ui('window.duo.overlay("blur")'); await sleep(80);
 const overlay = require('electron').webContents.getAllWebContents().find(wc => wc.getURL().endsWith('/overlay.html'));
 assert.ok(overlay);
 await overlay.executeJavaScript('document.querySelector("#blur-strength").value=12;document.querySelector("#blur-form").requestSubmit()');
 const deadline = Date.now() + 5000;
 while (settings.blur.strength !== 12) { assert.ok(Date.now() < deadline, 'Blur form did not save'); await sleep(30); }
 assert.deepEqual(settings.blurPanels, originalPanels);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8')).blur, settings.blur);
 await ui('window.duo.overlay(null)');
 await save(config);
 for (const service of Object.keys(SERVICES)) {
  console.log('BLUR FIXTURE mount',service);
  const account = settings.accounts.find(item => item.service === service);
  assert.ok(account, 'Fixture account exists for ' + service);
  const wc = await mount(account, service); console.log('BLUR FIXTURE ready',service);
  for (const id of ['message', 'person', 'avatar', 'media', ...(ADAPTERS[service].previews.length ? ['preview'] : [])]) assert.equal(await isBlurred(wc, id), true, service + ' blurs ' + id);
  assert.equal(await isBlurred(wc, 'editor'), false, service + ' keeps composer clear by default');
  assert.equal(await isBlurred(wc, 'plain-button'), false, service + ' keeps controls usable');
  assert.equal(await evaluate(wc, 'typeof window.duo'), 'undefined');
  // New content is styled without observing, scraping, or retagging the DOM.
  await evaluate(wc, '(()=>{const e=document.getElementById("message"),n=e.cloneNode(true);n.id="new-message";n.textContent="New incoming content";e.after(n);})()');
  assert.equal(await isBlurred(wc, 'new-message'), true, service + ' styles dynamically inserted messages');
  await evaluate(wc, 'document.getElementById("editor").closest("[contenteditable=true]").focus()');
  await wc.insertText(' live reply'); await sleep(30);
  assert.match(await evaluate(wc, 'document.body.textContent'), /live reply/);
  await hover(wc, 'message'); assert.equal(await isBlurred(wc, 'message'), false, service + ' reveals only the hovered message');
  assert.equal(await isBlurred(wc, 'person'), true, service + ' does not reveal other content');
  await move(wc, 2, 2);
  assert.equal(await isBlurred(wc, 'message'), true, service + ' reblurs after hover');
  await save({ ...config, revealOnHover: false });
  await hover(wc, 'message'); assert.equal(await isBlurred(wc, 'message'), true, service + ' honors reveal off');
  const ids = { messages: 'message', previews: 'preview', names: 'person', avatars: 'avatar', media: 'media' };
  for (const [category, id] of Object.entries(ids)) {
   if (!ADAPTERS[service][category].length) continue;
   await save({ enabled: true, revealOnHover: false, elements: { [category]: false } });
   assert.equal(await isBlurred(wc, id), false, service + ' independently disables ' + category);
  }
  await save({ ...config, elements: { ...config.elements, composer: true } });
  assert.equal(await isBlurred(wc, 'editor'), true, service + ' supports opt-in composer blur');
  await save({ ...config, enabled: false });
  for (const id of ['message', 'person', 'avatar', 'media', 'editor']) assert.equal(await isBlurred(wc, id), false, service + ' restores original styles');
  assert.match(await evaluate(wc, 'getComputedStyle(document.getElementById("message")).filter'), /sepia/, service + ' restores service filters');
  await save({ enabled: true });
  if (service === 'telegram') {
   await require('./telegram-blur-smoke.cjs')({ wc, save, move, hover, isBlurred });
   await require('./telegram-list-blur-smoke.cjs')({ wc, save, move, hover, isBlurred });
  }
  if (service === 'whatsapp') {
   await require('./whatsapp-blur-smoke.cjs')({ wc, save, move, hover, isBlurred });
   await require('./whatsapp-media-blur-smoke.cjs')({ wc, save, move, hover, isBlurred });
  }
  await require('./media-blur-smoke.cjs')({wc,save,move,hover,isBlurred,service});
  await require('./blur-new-service-smoke.cjs')({wc,save,move,hover,isBlurred,service});
  if (service === 'instagram') {
   await wc.loadURL('https://www.facebook.com/login'); await settled(wc);
   assert.equal(await isBlurred(wc, 'message'), false, 'Facebook login does not inherit Instagram CSS');
  }
  if (wc.debugger.isAttached()) wc.debugger.detach();
  wc.session.protocol.unhandle('https'); console.log('BLUR FIXTURE pass',service);
 }
 await require('./blur-panel-smoke.cjs')({settings,views,handleAccountAction,waitForDocument,html,settled,ui,save,isBlurred,move});
 await save(originalBlur);
 for (const side of ["left","right"]) await ui('window.duo.blurAction("set",'+JSON.stringify({side,enabled:originalPanels[side]})+')');
 await handleAccountAction('select', { side: 'left', id: originalSlots.left });
 await handleAccountAction('select', { side: 'right', id: originalSlots.right });
 console.log('INTERACTIVE BLUR PASS: shared configuration form/persistence, thirteen service fixtures, selective categories, native Chromium hover/reblur and typing, original filters, no remote bridge, origin boundary and simultaneous panels. Real-account coverage still needs device testing.');
};
