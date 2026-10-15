// Local CSS and isolated media hit testing; no message reads or remote bridge.
const { SERVICES } = require('./accounts.cjs');
const ELEMENTS = Object.freeze(['messages', 'previews', 'names', 'avatars', 'media', 'composer']);
const ADAPTERS = Object.freeze({
 whatsapp: {
  messages: [
   '.message-in .selectable-text', '.message-out .selectable-text', '[data-testid="msg-text"]',
   '[data-testid="msg-container"] .selectable-text', '#main [data-id] .selectable-text', '#main [data-pre-plain-text] .selectable-text',
   '[data-testid="msg-container"] [data-lexical-text="true"]', '#main [data-id] [data-lexical-text="true"]',
   '#main [data-pre-plain-text] .copyable-text span[dir]:not(:has([dir]))',
   '#main [data-pre-plain-text].copyable-text > span[dir]:not(:has(img, video))',
   '[data-testid="msg-container"]:not(:has(.selectable-text, [data-lexical-text], img, video, canvas, audio))'
  ],
  previews: ['#pane-side [data-testid="cell-frame-secondary"]', '#pane-side [data-testid="last-msg-preview"]', '#pane-side div.xjbqb8w.x1iyjqo2.x1f6kntn.x1fc57z9.x6ikm8r.x10wlt62.x1yc453h.xlyipyv.xuxw1ft.xo1l8bm'],
  names: ['#pane-side [data-testid="cell-frame-title"]', '#pane-side [role="gridcell"] div.x14ug900.x78zum5.x1iyjqo2.x1jchvi3.xdod15v.x6ikm8r.x10wlt62.x1mzt3pk.x1yc453h.xo1l8bm', '#pane-side ._ak8q', '#main header span[title]', '[data-testid="conversation-info-header-chat-title"]'],
  avatars: ['#pane-side img', '#main header img', '[data-testid="conversation-info-header"] img'],
  media: ['#main .message-in img', '#main .message-out img', '#main .message-in video', '#main .message-out video', '[data-testid="media-viewer"] img', '[data-testid="media-viewer"] video'],
  composer: ['[data-testid="conversation-compose-box-input"]', '#main footer [contenteditable="true"]']
 },
 telegram: {
  messages: ['.Message .text-content', '.message .text-content', '.bubble .message'],
  previews: ['.ListItem.Chat .subtitle', '.chatlist-chat .last-message', '.chatlist-chat .dialog-subtitle'],
  names: ['.ChatInfo .title', '.chat-info .peer-title', '.chatlist-chat .peer-title', '.Message .sender-title', '.bubble .name'],
  avatars: ['.Avatar', '.avatar'],
  media: ['.Message img.full-media', '.Message .media-inner img', '.Message video', '.Message .sticker', '.bubble .attachment img', '.bubble video', '.bubble .sticker'],
  composer: ['.input-message-input[contenteditable="true"]', '#message-input-text', '.MessageInput [contenteditable="true"]']
 },
 discord: {
  messages: ['[id^="message-content-"]', '[class*="messageContent_"]', '[class*="messageContent-"]'],
  previews: ['[class*="lastMessage_"]', '[class*="subText_"]'],
  names: ['[class*="username_"]', '[class*="username-"]', '[class*="channelName_"]', 'a[href^="/channels/@me/"] [class*="name_"]'],
  avatars: ['img[class*="avatar_"]', 'img[class*="avatar-"]', '[class*="avatarWrapper_"]'],
  media: ['[id^="chat-messages-"] [class*="imageWrapper_"] img', '[id^="chat-messages-"] video', '[class*="attachment_"] img', '[class*="stickerAsset_"]'],
  composer: ['[data-slate-editor="true"][role="textbox"]']
 },
 x: {
  messages: ['[data-testid="tweetText"]', '[data-testid="messageEntry"] [data-testid="message-text"]'],
  previews: ['[data-testid="conversation"] [data-testid="preview"]'],
  names: ['[data-testid="User-Name"]', '[data-testid="UserName"]'],
  avatars: ['[data-testid^="UserAvatar-Container"]'],
  media: ['[data-testid="tweetPhoto"] img', '[data-testid="videoPlayer"] video', '[data-testid="card.wrapper"] img'],
  composer: ['[data-testid="tweetTextarea_0"]', '[data-testid="dmComposerTextInput"]']
 },
 instagram: {
  messages: ['article h1', 'article ul li span[dir="auto"]:not(a *)', '[data-testid="message-text"]', '[role="main"] [role="grid"] [role="row"] [dir="auto"]:not(a *):not(:has(a)):not(:has([dir="auto"])):not(:has(img,video,picture,canvas))'],
  previews: ['[data-testid="direct-thread-preview"]'],
  names: ['article header a[href]:not(:has(img))', 'article h2 a[href]', 'article h3 a[href]', '[data-testid="direct-thread-title"]'],
  avatars: ['img[alt*="profile picture" i]', 'img[alt*="foto profil" i]', 'article header img', 'a[href^="/direct/t/"] img'],
  media: ['article img:not(header *):not([alt*="profile picture" i]):not([alt*="foto profil" i])', 'article video', '[role="grid"] video', '[data-testid="message-media"] img'],
  composer: ['[role="main"] [contenteditable="true"][role="textbox"]', 'textarea[placeholder="Message..."]', 'article textarea']
 },
 threads: {
  messages: ['[data-pressable-container="true"] [dir="auto"]:not(a *):not(:has(a)):not(:has([dir="auto"])):not(:has(img,video,picture,canvas))', '[data-testid="post-text"]'],
  previews: [],
  names: ['[data-pressable-container="true"] a[href^="/@"]:not(:has(img))', 'article a[href^="/@"]:not(:has(img))'],
  avatars: ['a[href^="/@"] img'],
  media: ['[data-pressable-container="true"] img:not(a[href^="/@"] *)', '[data-pressable-container="true"] video', 'article video'],
  composer: ['[role="main"] [contenteditable="true"][role="textbox"]', '[role="dialog"] [contenteditable="true"][role="textbox"]']
 }
});
function cleanBlur(raw = {}) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
 const elements = raw.elements && typeof raw.elements === 'object' ? raw.elements : {};
 return { enabled: raw.enabled === true, strength: Number.isFinite(raw.strength) ? Math.round(Math.max(4, Math.min(20, raw.strength))) : 10, revealOnHover: raw.revealOnHover !== false,
  elements: Object.fromEntries(ELEMENTS.map(key => [key, typeof elements[key] === 'boolean' ? elements[key] : key !== 'composer'])) };
}
function cleanBlurPreferences(raw) {
 const { enabled, ...preferences } = cleanBlur(raw); return preferences;
}
function cleanBlurPanels(raw, legacyEnabled = false) {
 const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
 return Object.fromEntries(['left', 'right'].map(side => [side, typeof value?.[side] === 'boolean' ? value[side] : legacyEnabled === true]));
}
function accountBlur(settings, id) {
 const side = Object.entries(settings.slots).find(([, accountId]) => accountId === id)?.[0];
 // Hidden accounts have no panel. Their CSS is selected when they enter a slot.
 return { ...settings.blur, enabled: Boolean(side && settings.blurPanels[side]) };
}
function allowed(service, value) {
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && SERVICES[service]?.origins.includes(url.origin) === true; } catch { return false; }
}
function blurCSS(service, raw) {
 const config = cleanBlur(raw), adapter = ADAPTERS[service];
 if (!config.enabled || !adapter) return '';
 const normal = ELEMENTS.filter(key => key !== 'composer' && config.elements[key]).flatMap(key => adapter[key]);
 // Leave editors and their ancestors/children alone unless composer blur is explicitly selected.
 // Read-only message markup can carry contenteditable=false / role=textbox.
 // Exclude actual editors, not every element with these accessibility attributes.
 const editor = ':is(input,textarea,[contenteditable]:not([contenteditable="false"]))';
 const guard = ':not(' + editor + '):not(' + editor + ' *):not(:has(' + editor + '))';
 const targets = normal.length ? [':where(' + [...new Set(normal)].join(',') + ')' + guard] : [];
 if (config.elements.composer && adapter.composer.length) targets.push(':where(' + adapter.composer.join(',') + '):not(input[type="password"])');
 if (!targets.length) return '';
 const selected = ':where(' + targets.join(',') + ')';
 // Blur each outer selected element once; nested matches must not compound blur.
 const target = selected + ':not(' + selected + ' *)';
 let css = target + '{filter:blur(' + config.strength + 'px)!important;transition:none!important;}';
 // Revert only our layer on reveal, preserving service filters (e.g. spoilers).
 if (config.revealOnHover) {
  css += target + ':is(:hover,:focus-within){filter:revert-layer!important;}';
  if (config.elements.media && ['instagram', 'threads'].includes(service)) {
   css += target + '[data-duochat-media-reveal]{filter:revert-layer!important;}';
  }
 }
 return '@layer duochatPrivacyBlur{' + css + '}';
}
function blurSupport() {
 return Object.fromEntries(Object.entries(ADAPTERS).map(([service, adapter]) => [service, { name: SERVICES[service].name, elements: ELEMENTS.filter(key => adapter[key].length), experimental: !['whatsapp', 'telegram'].includes(service) }]));
}
// Runs in a separate isolated world. It only inspects local element geometry;
// no content is read/transmitted and no API is exposed to the service page.
function installMediaHover(selectors, enabled) {
 const key = '__duochatMediaHoverCleanup', attribute = 'data-duochat-media-reveal';
 globalThis[key]?.();
 if (!enabled) return;
 let frame = 0, current = null, point = null, disposed = false;
 const selector = selectors.join(',');
 function clear() { if (current) current.removeAttribute(attribute); current = null; }
 function update() {
  frame = 0; if (disposed) return;
  let found = null;
  if (point) {
   const hit = document.elementFromPoint(point.x, point.y);
   if (hit) for (const element of document.querySelectorAll(selector)) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) continue;
    // Accept sibling controls/overlays in the media's own widget, never an
    // unrelated dialog or the whole post/feed as the common ancestor.
    let root = element;
    for (let depth = 0; root && depth < 7; depth++, root = root.parentElement) {
     if (root !== element && root.matches('html,body,main,article,[role="main"],[data-pressable-container="true"]')) break;
     if (root.contains(hit)) { found = element; break; }
    }
    if (found) break;
   }
  }
  if (current !== found) { clear(); current = found; current?.setAttribute(attribute, ''); }
 }
 function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
 function pointer(event) { point = { x: event.clientX, y: event.clientY }; schedule(); }
 function leave() { point = null; if (frame) cancelAnimationFrame(frame); frame = 0; clear(); }
 function focused(event) {
  if (event.target === document.body || !event.target?.getBoundingClientRect) return;
  const rect = event.target.getBoundingClientRect(); point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; schedule();
 }
 const passive = { passive: true, capture: true };
 document.addEventListener('pointermove', pointer, passive);
 document.addEventListener('pointerleave', leave);
 document.addEventListener('scroll', schedule, passive);
 document.addEventListener('focusin', focused, true);
 document.addEventListener('focusout', leave, true);
 window.addEventListener('blur', leave);
 globalThis[key] = () => {
  disposed = true; leave();
  document.removeEventListener('pointermove', pointer, true);
  document.removeEventListener('pointerleave', leave);
  document.removeEventListener('scroll', schedule, true);
  document.removeEventListener('focusin', focused, true);
  document.removeEventListener('focusout', leave, true);
  window.removeEventListener('blur', leave); delete globalThis[key];
 };
}
function mediaHoverScript(service, raw) {
 const config = cleanBlur(raw);
 const enabled = ['instagram', 'threads'].includes(service) && config.enabled && config.revealOnHover && config.elements.media;
 return '(' + installMediaHover.toString() + ')(' + JSON.stringify(ADAPTERS[service]?.media || []) + ',' + enabled + ');';
}
function attachBlur(contents, service, getConfig, report = () => {}) {
 let key = null, revision = 0, queue = Promise.resolve(), disposed = false, hoverInstalled = false;
 function refresh() {
  const token = ++revision;
  const operation = async () => {
   if (disposed || contents.isDestroyed() || token !== revision) return;
   const trustedPage = allowed(service, contents.getURL()), config = cleanBlur(getConfig());
   const css = trustedPage ? blurCSS(service, config) : '';
   let next = null;
   try {
    // Electron 44's removal API uses Blink's default author origin.
    // A dedicated author layer is removable and preserves original filters.
    if (css) next = await contents.insertCSS(css, { cssOrigin: 'author' });
    if (disposed || contents.isDestroyed() || token !== revision) { if (next && !contents.isDestroyed()) await contents.removeInsertedCSS(next).catch(() => {}); return; }
    const previous = key; key = next;
    if (previous) await contents.removeInsertedCSS(previous).catch(() => {});
    const hoverNeeded = trustedPage && ['instagram', 'threads'].includes(service) && config.enabled && config.revealOnHover && config.elements.media;
    if (trustedPage && (hoverNeeded || hoverInstalled)) {
     await contents.executeJavaScriptInIsolatedWorld(42, [{ code: mediaHoverScript(service, config) }]);
     hoverInstalled = hoverNeeded;
    }
    report(css ? 'active' : 'off');
   } catch { report('error'); }
  };
  queue = queue.then(operation, operation); return queue;
 }
 const navigation = (_event, _url, _inPlace, mainFrame) => { if (mainFrame && !_inPlace) { revision++; key = null; hoverInstalled = false; } };
 contents.on('did-start-navigation', navigation);
 contents.on('dom-ready', refresh);
 contents.on('did-navigate-in-page', refresh);
 contents.once('destroyed', () => { disposed = true; revision++; });
 return { refresh, settled: () => queue };
}
module.exports = { ELEMENTS, ADAPTERS, cleanBlur, cleanBlurPreferences, cleanBlurPanels, accountBlur, allowed, blurCSS, blurSupport, mediaHoverScript, attachBlur };
