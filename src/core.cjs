const SERVICES = Object.freeze({ whatsapp: { name: 'WhatsApp', url: 'https://web.whatsapp.com/' }, telegram: { name: 'Telegram', url: 'https://web.telegram.org/a/' } });
function trusted(id, value) {
  try { const url = new URL(value); return url.origin === new URL(SERVICES[id].url).origin; } catch { return false; }
}
function ratio(value) { return Number.isFinite(value) ? Math.max(.3, Math.min(.75, value)) : .65; }
function layout(width, height, value) {
  const top = 136, bottom = 40, gap = 12, padding = 16;
  const available = Math.max(0, width - padding * 2 - gap);
  const left = Math.round(available * ratio(value));
  const h = Math.max(0, height - top - bottom);
  return { whatsapp: { x: padding, y: top, width: left, height: h }, telegram: { x: padding + left + gap, y: top, width: available - left, height: h } };
}
function cleanSettings(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};
  return { ratio: ratio(raw.ratio), width: Math.max(1000, Math.min(3000, Number(raw.width) || 1440)), height: Math.max(650, Math.min(2000, Number(raw.height) || 900)), permissions: { whatsapp: raw.permissions?.whatsapp === true, telegram: raw.permissions?.telegram === true } };
}
module.exports = { SERVICES, trusted, ratio, layout, cleanSettings };
