// Declarative, local CSS only: no page scraping, screenshots, timers, or remote bridge.
const { SERVICES } = require('./accounts.cjs');
const ELEMENTS = Object.freeze(['messages', 'previews', 'names', 'avatars', 'media', 'composer']);
const ADAPTERS = Object.freeze({
 whatsapp: {
  messages: ['.message-in .selectable-text', '.message-out .selectable-text', '[data-testid="msg-text"]'],
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
  messages: ['article h1', 'article ul li span[dir="auto"]:not(a *)', '[data-testid="message-text"]', '[role="main"] [role="grid"] [role="row"] [dir="auto"]:not(a *):not(:has(a)):not(:has([dir="auto"]))'],
  previews: ['[data-testid="direct-thread-preview"]'],
  names: ['article header a[href]:not(:has(img))', 'article h2 a[href]', 'article h3 a[href]', '[data-testid="direct-thread-title"]'],
  avatars: ['img[alt*="profile picture" i]', 'img[alt*="foto profil" i]', 'article header img', 'a[href^="/direct/t/"] img'],
  media: ['article img:not(header *):not([alt*="profile picture" i]):not([alt*="foto profil" i])', 'article video', '[role="grid"] video', '[data-testid="message-media"] img'],
  composer: ['[role="main"] [contenteditable="true"][role="textbox"]', 'textarea[placeholder="Message..."]', 'article textarea']
 },
 threads: {
  messages: ['[data-pressable-container="true"] [dir="auto"]:not(a *):not(:has(a)):not(:has([dir="auto"]))', '[data-testid="post-text"]'],
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
function allowed(service, value) {
 try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && SERVICES[service]?.origins.includes(url.origin) === true; } catch { return false; }
}
function blurCSS(service, raw) {
 const config = cleanBlur(raw), adapter = ADAPTERS[service];
 if (!config.enabled || !adapter) return '';
 const normal = ELEMENTS.filter(key => key !== 'composer' && config.elements[key]).flatMap(key => adapter[key]);
 // Leave editors and their ancestors/children alone unless composer blur is explicitly selected.
 const guard = ':not(input):not(textarea):not([contenteditable]):not([role="textbox"]):not([contenteditable] *):not([role="textbox"] *):not(:has([contenteditable="true"], textarea, [role="textbox"]))';
 const targets = normal.length ? [':where(' + [...new Set(normal)].join(',') + ')' + guard] : [];
 if (config.elements.composer && adapter.composer.length) targets.push(':where(' + adapter.composer.join(',') + '):not(input[type="password"])');
 if (!targets.length) return '';
 const selected = ':where(' + targets.join(',') + ')';
 // Blur each outer selected element once; nested matches must not compound blur.
 const target = selected + ':not(' + selected + ' *)';
 let css = target + '{filter:blur(' + config.strength + 'px)!important;transition:none!important;}';
 // Revert only our layer on reveal, preserving service filters (e.g. spoilers).
 if (config.revealOnHover) css += target + ':is(:hover,:focus-within){filter:revert-layer!important;}';
 return '@layer duochatPrivacyBlur{' + css + '}';
}
function blurSupport() {
 return Object.fromEntries(Object.entries(ADAPTERS).map(([service, adapter]) => [service, { name: SERVICES[service].name, elements: ELEMENTS.filter(key => adapter[key].length), experimental: !['whatsapp', 'telegram'].includes(service) }]));
}
function attachBlur(contents, service, getConfig, report = () => {}) {
 let key = null, revision = 0, queue = Promise.resolve(), disposed = false;
 function refresh() {
  const token = ++revision;
  const operation = async () => {
   if (disposed || contents.isDestroyed() || token !== revision) return;
   const css = allowed(service, contents.getURL()) ? blurCSS(service, getConfig()) : '';
   let next = null;
   try {
    // Electron 44's removal API uses Blink's default author origin.
    // A dedicated author layer is removable and preserves original filters.
    if (css) next = await contents.insertCSS(css, { cssOrigin: 'author' });
    if (disposed || contents.isDestroyed() || token !== revision) { if (next && !contents.isDestroyed()) await contents.removeInsertedCSS(next).catch(() => {}); return; }
    const previous = key; key = next;
    if (process.argv.includes('--smoke')) console.log('BLUR-SHEET', JSON.stringify({ service, previous, next, reveal: getConfig().revealOnHover }));
    if (previous) await contents.removeInsertedCSS(previous).catch(() => {});
    report(css ? 'active' : 'off');
   } catch { report('error'); }
  };
  queue = queue.then(operation, operation); return queue;
 }
 const navigation = (_event, _url, _inPlace, mainFrame) => { if (mainFrame && !_inPlace) { revision++; key = null; } };
 contents.on('did-start-navigation', navigation);
 contents.on('dom-ready', refresh);
 contents.on('did-navigate-in-page', refresh);
 contents.once('destroyed', () => { disposed = true; revision++; });
 return { refresh, settled: () => queue };
}
module.exports = { ELEMENTS, ADAPTERS, cleanBlur, allowed, blurCSS, blurSupport, attachBlur };
