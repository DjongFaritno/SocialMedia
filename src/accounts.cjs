const { randomUUID } = require('node:crypto');
const SERVICES = Object.freeze({
  whatsapp: { name: 'WhatsApp', url: 'https://web.whatsapp.com/', origins: ['https://web.whatsapp.com'] },
  telegram: { name: 'Telegram', url: 'https://web.telegram.org/a/', origins: ['https://web.telegram.org'] },
  discord: { name: 'Discord', url: 'https://discord.com/app', origins: ['https://discord.com'] },
  x: { name: 'X', url: 'https://x.com/', origins: ['https://x.com', 'https://twitter.com'] },
  instagram: { name: 'Instagram', url: 'https://www.instagram.com/', origins: ['https://www.instagram.com'] },
  threads: { name: 'Threads', url: 'https://www.threads.com/', origins: ['https://www.threads.com', 'https://threads.com', 'https://www.threads.net'] },
  messenger: { name: 'Messenger', url: 'https://www.facebook.com/messages/', origins: ['https://www.facebook.com', 'https://facebook.com', 'https://m.facebook.com', 'https://web.facebook.com'] },
  facebook: { name: 'Facebook', url: 'https://www.facebook.com/', origins: ['https://www.facebook.com', 'https://facebook.com', 'https://m.facebook.com', 'https://web.facebook.com'] },
  googlechat: { name: 'Google Chat', url: 'https://chat.google.com/', origins: ['https://chat.google.com'] },
  wechat: { name: 'WeChat', url: 'https://web.wechat.com/', origins: ['https://web.wechat.com', 'https://web2.wechat.com', 'https://wx.qq.com', 'https://wx2.qq.com', 'https://wx8.qq.com'] },
  slack: { name: 'Slack', url: 'https://app.slack.com/client/', origins: ['https://app.slack.com'] },
  teams: { name: 'Microsoft Teams', url: 'https://teams.cloud.microsoft/v2/', origins: ['https://teams.cloud.microsoft', 'https://teams.microsoft.com', 'https://teams.live.com'] },
  linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com/feed/', origins: ['https://www.linkedin.com', 'https://linkedin.com'] }
});
const MAX_ACCOUNTS = 30;
function validId(id) { return typeof id === 'string' && /^(whatsapp|telegram|account-[a-f0-9-]{36})$/.test(id); }
function cleanAccount(raw) {
  if (!raw || !validId(raw.id) || !Object.hasOwn(SERVICES, raw.service)) return null;
  if (['whatsapp', 'telegram'].includes(raw.id) && raw.id !== raw.service) return null;
  return { id: raw.id, service: raw.service, name: (typeof raw.name === 'string' ? raw.name.trim().slice(0, 40) : '') || SERVICES[raw.service].name, keepActive: raw.keepActive === true, permissions: raw.permissions === true };
}
function accountState(raw) {
  const seen = new Set();
  const accounts = (Array.isArray(raw.accounts) ? raw.accounts : []).map(cleanAccount).filter(item => item && !seen.has(item.id) && seen.add(item.id)).slice(0, MAX_ACCOUNTS);
  // Preserve the old partition names, so existing QR logins survive the upgrade.
  if (!accounts.length) for (const service of ['whatsapp', 'telegram']) accounts.push({ id: service, service, name: SERVICES[service].name, keepActive: false, permissions: raw.schema !== 2 && raw.permissions?.[service] === true });
  if (accounts.length === 1) accounts.push({ id: 'account-' + randomUUID(), service: 'telegram', name: 'Telegram', keepActive: false, permissions: false });
  const ids = new Set(accounts.map(item => item.id));
  const left = ids.has(raw.slots?.left) ? raw.slots.left : accounts[0].id;
  const right = ids.has(raw.slots?.right) && raw.slots.right !== left ? raw.slots.right : accounts.find(item => item.id !== left).id;
  return { schema: 2, accounts, slots: { left, right } };
}
function partition(account) {
  if (!cleanAccount(account)) throw new Error('Invalid account');
  return ['whatsapp', 'telegram'].includes(account.id) ? `persist:${account.id}` : `persist:duochat-${account.id}`;
}
function switchAccount(settings, side, id) {
  if (!['left', 'right'].includes(side) || !settings.accounts.some(item => item.id === id)) return false;
  const other = side === 'left' ? 'right' : 'left';
  if (settings.slots[other] === id) settings.slots[other] = settings.slots[side];
  settings.slots[side] = id; return true;
}
function liveAccounts(settings) { return settings.accounts.filter(item => Object.values(settings.slots).includes(item.id) || item.keepActive); }
module.exports = { SERVICES, MAX_ACCOUNTS, validId, cleanAccount, accountState, partition, switchAccount, liveAccounts };
