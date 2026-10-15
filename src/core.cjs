const { cleanBlurPreferences, cleanBlurPanels } = require('./blur.cjs');
const { SERVICES, accountState } = require('./accounts.cjs');
function trusted(id, value) {
  try { const url = new URL(value); return SERVICES[id]?.origins.includes(url.origin) === true; } catch { return false; }
}
function ratio(value) { return Number.isFinite(value) ? Math.max(.3, Math.min(.75, value)) : .65; }
function layout(width, height, value, headerHidden = false) {
  const top = headerHidden ? 56 : 136, bottom = 40, gap = 12, padding = 16, rail = headerHidden ? 0 : 76;
  const available = Math.max(0, width - padding * 2 - gap - rail);
  const left = Math.round(available * ratio(value));
  const h = Math.max(0, height - top - bottom);
  return { whatsapp: { x: padding + rail, y: top, width: left, height: h }, telegram: { x: padding + rail + left + gap, y: top, width: available - left, height: h } };
}
function cleanSettings(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  return { ...accountState(raw), blur: cleanBlurPreferences(raw.blur), blurPanels: cleanBlurPanels(raw.blurPanels, raw.blur?.enabled === true), autoCheckUpdates: raw.autoCheckUpdates !== false, autoDownloadUpdates: raw.autoDownloadUpdates === true, theme: ['auto', 'light', 'dark'].includes(raw.theme) ? raw.theme : 'auto', hideHeader: raw.hideHeader === true, ratio: ratio(raw.ratio), width: Math.max(1000, Math.min(3000, Number(raw.width) || 1440)), height: Math.max(650, Math.min(2000, Number(raw.height) || 900)), permissions: { whatsapp: raw.permissions?.whatsapp === true, telegram: raw.permissions?.telegram === true } };
}
// Keep Chromium's actual version and platform; remove Electron/app product tokens.
function browserUserAgent(original, appName = 'duochat-desktop') {
  const products = new Set(['Electron', 'DuoChat', appName]);
  return original.split(' ').filter(token => !products.has(token.split('/')[0])).join(' ');
}
module.exports = { SERVICES, trusted, ratio, layout, cleanSettings, browserUserAgent };
