const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { cleanSettings } = require('../src/core.cjs');
const { ELEMENTS, ADAPTERS, cleanBlur, cleanBlurPreferences, cleanBlurPanels, accountBlur, allowed, blurCSS, attachBlur } = require('../src/blur.cjs');
test('shared blur preferences migrate and persist without accepting CSS or unknown fields', () => {
 const defaults = cleanSettings().blur; assert.equal(defaults.enabled, undefined); assert.equal(defaults.elements.composer, false);
 const input = { enabled: true, strength: 200, revealOnHover: false, elements: { names: false, messages: true, css: 'body{}' }, css: '@import evil' };
 const clean = cleanSettings({ blur: input }).blur;
 assert.equal(clean.strength, 20); assert.equal(clean.revealOnHover, false); assert.equal(clean.elements.names, false);
 assert.deepEqual(cleanSettings(JSON.parse(JSON.stringify({ blur: clean }))).blur, clean);
 assert.ok(!JSON.stringify(clean).includes('evil')); assert.ok(!Object.hasOwn(clean.elements, 'css'));
 for (const raw of [null, [], true, 'on']) assert.deepEqual(cleanBlurPreferences(raw), defaults);
 assert.equal(cleanBlur({ strength: NaN }).strength, 10); assert.equal(cleanBlur({ strength: -1 }).strength, 4);
});
test('only official HTTPS service origins receive blur, never Meta login or arbitrary pages', () => {
 assert.equal(allowed('whatsapp', 'https://web.whatsapp.com/'), true);
 assert.equal(allowed('threads', 'https://www.threads.com/@person'), true);
 for (const url of ['https://www.facebook.com/login', 'https://instagram.com.evil.test', 'https://www.instagram.com@evil.test', 'https://user:password@www.instagram.com/', 'file:///fixture.html', 'data:text/html,test', 'javascript:void(0)']) assert.equal(allowed('instagram', url), false);
});
test('category toggles build local CSS and no whole-page overlay or resources', () => {
 const empty = Object.fromEntries(ELEMENTS.map(key => [key, false]));
 assert.equal(blurCSS('whatsapp', { enabled: false }), '');
 assert.equal(blurCSS('whatsapp', { enabled: true, elements: empty }), '');
 assert.equal(blurCSS('unknown', { enabled: true }), '');
 const css = blurCSS('whatsapp', { enabled: true, elements: { ...empty, messages: true }, strength: 7 });
 assert.ok(css.includes('blur(7px)')); assert.ok(css.includes('.selectable-text')); assert.ok(!css.includes('cell-frame-title'));
 assert.ok(css.includes(':hover')); assert.ok(css.includes('filter:revert-layer!important'));
 assert.ok(!blurCSS('whatsapp', { enabled: true, revealOnHover: false }).includes(':hover'));
 for (const service of Object.keys(ADAPTERS)) assert.doesNotMatch(blurCSS(service, { enabled: true }), /@import|url\(|backdrop-filter|position:fixed/);
});
class Contents extends EventEmitter {
 constructor() { super(); this.url = 'https://web.whatsapp.com/'; this.sheets = new Map(); this.sequence = 0; }
 isDestroyed() { return false; }
 getURL() { return this.url; }
 async insertCSS(css, options) { assert.equal(options.cssOrigin, 'author'); const key = String(++this.sequence); this.sheets.set(key, css); return key; }
 async removeInsertedCSS(key) { this.sheets.delete(key); }
 async executeJavaScriptInIsolatedWorld(world, scripts) { assert.equal(world,42); assert.equal(scripts.length,1); }
}
test('rapid changes and hash navigation do not accumulate styles; disabled/login pages restore originals', async () => {
 const wc = new Contents(); let config = { enabled: true };
 const controller = attachBlur(wc, 'whatsapp', () => config);
 await Promise.all([controller.refresh(), controller.refresh(), controller.refresh()]);
 assert.equal(wc.sheets.size, 1);
 wc.emit('did-start-navigation', {}, wc.url + '#chat', true, true); wc.emit('did-navigate-in-page');
 await controller.settled(); assert.equal(wc.sheets.size, 1);
 config = { enabled: false }; await controller.refresh(); assert.equal(wc.sheets.size, 0);
 config = { enabled: true }; await controller.refresh(); wc.url = 'https://www.facebook.com/login'; await controller.refresh(); assert.equal(wc.sheets.size, 0);
});
test('navigation invalidates pending CSS insertion, errors are reported, and future refresh recovers', async () => {
 const wc = new Contents(); let finish;
 wc.insertCSS = css => new Promise(resolve => { finish = () => { wc.sheets.set('pending', css); resolve('pending'); }; });
 const states = []; const controller = attachBlur(wc, 'whatsapp', () => ({ enabled: true }), value => states.push(value));
 const pending = controller.refresh(); await new Promise(resolve => setImmediate(resolve));
 wc.url = 'https://www.facebook.com/login'; wc.emit('did-start-navigation', {}, wc.url, false, true);
 finish(); await pending; assert.equal(wc.sheets.size, 0);
 wc.url = 'https://web.whatsapp.com/'; wc.insertCSS = async () => { throw Error('renderer disappeared'); };
 await controller.refresh(); assert.equal(states.at(-1), 'error');
 wc.insertCSS = Contents.prototype.insertCSS.bind(wc); await controller.refresh(); assert.equal(states.at(-1), 'active'); assert.equal(wc.sheets.size, 1);
});

test('WhatsApp adapter supports message metadata without depending on message-in/out wrappers', () => {
 const css = blurCSS('whatsapp', { enabled: true });
 for (const marker of ['[data-testid="msg-container"]', '[data-id]', '[data-pre-plain-text]', '[data-lexical-text="true"]']) assert.ok(css.includes(marker), marker);
 assert.ok(css.includes('[contenteditable]:not([contenteditable="false"])'));
 assert.ok(!css.includes(':not([role="textbox"])'));
});

test('activation migrates once and stays per physical panel while preferences stay shared', () => {
 const migrated = cleanSettings({blur:{enabled:true,strength:13}});
 assert.deepEqual(migrated.blurPanels,{left:true,right:true});
 assert.equal(migrated.blur.enabled,undefined);
 const settings = cleanSettings({...migrated,blurPanels:{left:false,right:true}});
 assert.deepEqual(cleanSettings(JSON.parse(JSON.stringify(settings))),settings);
 assert.equal(accountBlur(settings,settings.slots.left).enabled,false);
 assert.equal(accountBlur(settings,settings.slots.right).enabled,true);
 const left=settings.slots.left;settings.slots.left=settings.slots.right;settings.slots.right=left;
 assert.equal(accountBlur(settings,left).enabled,true);
 assert.equal(accountBlur(settings,'background').enabled,false);
 assert.deepEqual(cleanBlurPanels({left:'yes',right:true,unknown:true}),{left:false,right:true});
 assert.deepEqual(cleanBlurPanels(null),{left:false,right:false});
});
test('Instagram media helper is isolated and removed when hover is disabled', async () => {
 const wc = new Contents(); wc.url='https://www.instagram.com/'; const calls=[];
 wc.executeJavaScriptInIsolatedWorld=async (world,scripts)=>{assert.equal(world,42);calls.push(scripts[0].code);};
 let config={enabled:true};const controller=attachBlur(wc,'instagram',()=>config);
 await controller.refresh();assert.match(calls.at(-1),/,true\);$/);
 config={enabled:true,revealOnHover:false};await controller.refresh();assert.match(calls.at(-1),/,false\);$/);
 wc.url='https://www.facebook.com/login';await controller.refresh();assert.equal(calls.length,2);
});

test('every provider installs and cleans isolated media hover when Media is toggled', async () => {
 const { SERVICES } = require('../src/accounts.cjs');
 for(const [service,provider] of Object.entries(SERVICES)){
  const wc=new Contents();wc.url=provider.url;const calls=[];
  wc.executeJavaScriptInIsolatedWorld=async(world,scripts)=>{assert.equal(world,42);calls.push(scripts[0].code);};
  let config={enabled:true};
  const controller=attachBlur(wc,service,()=>config);
  await controller.refresh();assert.match(calls.at(-1),/,true\);$/,service+' enables helper');
  config={enabled:true,elements:{media:false}};await controller.refresh();
  assert.match(calls.at(-1),/,false\);$/,service+' cleans helper when media off');
  assert.equal(calls.length,2);
  config={enabled:false};await controller.refresh();assert.equal(wc.sheets.size,0);
  assert.equal(calls.length,2,'disabled helper is not repeatedly injected');
 }
});
