const t = DuoI18n.t;
const providerNames = { whatsapp: 'WhatsApp', telegram: 'Telegram', discord: 'Discord', x: 'X', instagram: 'Instagram', threads: 'Threads', messenger: 'Messenger', facebook: 'Facebook', wechat: 'WeChat', slack: 'Slack', linkedin: 'LinkedIn' };
const providerNotes = {
 slack: t('Masuk ke workspace Slack. SSO perusahaan ke domain lain mungkin perlu browser luar; sesinya terpisah dari DuoChat.'),
 linkedin: t('Feed dan pesan LinkedIn versi web. Pilihan blur berlaku pada elemen yang dikenali.'),
 messenger: t('Pesan Facebook dibuka lewat facebook.com/messages. Sesi terpisah dari akun Facebook lain di DuoChat.'),
 facebook: t('Feed dan pesan Facebook versi web. Login, panggilan, dan notifikasi mengikuti dukungan Facebook.'),
 wechat: t('Eksperimental. Pindai QR dengan WeChat di ponsel. Akses web bergantung akun dan kebijakan WeChat; panggilan tidak dijamin.')
};
const providerPaths = {
 slack: '<path d="M9 2v13M15 9v13M2 9h13M9 15h13"/><path d="M5 2v3H2M22 5h-3V2M2 19h3v3M19 22v-3h3"/>',
 linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".5"/>',
 messenger: '<path d="M21 11a9 9 0 0 1-9 9H7l-4 2v-6a9 9 0 1 1 18-5z"/><path d="m6 14 5-6 2 4 5-2-5 6-2-4-5 2z"/>',
 facebook: '<path d="M14 22V13h4l1-4h-5V6c0-2 1-3 4-3h2V0h-3c-5 0-7 2-7 6v3H6v4h4v9"/>',
 wechat: '<path d="M14 14c-2 2-5 2-7 1l-4 2 1-4C-1 5 12 0 17 7"/><path d="M21 18l1 3-4-1c-8 2-11-9-3-11 7-2 11 5 6 9z"/><circle cx="7" cy="8" r=".5"/><circle cx="12" cy="8" r=".5"/><circle cx="15" cy="14" r=".5"/><circle cx="19" cy="14" r=".5"/>',
 whatsapp: '<path d="M20.5 11.6a8.6 8.6 0 0 1-12.9 7.5L3 20.5l1.4-4.3a8.6 8.6 0 1 1 16.1-4.6z"/><path d="m8 8 2 2-1 1c1 2 2 3 4 4l1-1 2 1"/>',
 telegram: '<path d="m21 3-5 18-5-7-8-3 18-8z"/><path d="m11 14 5-6"/>',
 discord: '<path d="m8 5-3 1c-2 3-3 7-3 11l5 2 1-2h8l1 2 5-2c0-4-1-8-3-11l-3-1-1 2H9L8 5z"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>',
 x: '<path d="m4 3 16 18M20 3 4 21M4 3h5l11 18h-5L4 3z"/>',
 instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
 threads: '<path d="M19 7c-2-5-12-6-15 0-2 4-1 12 4 14 5 2 12-1 12-6 0-5-9-7-11-3-3 5 8 7 7-2-.4-3-3-5-7-3"/>'
};
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function providerIcon(service) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${providerPaths[service] || ''}</svg>`; }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = t(message); el.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 4200); }
async function accountAction(action, input) { const result = await window.duo.accountAction(action, input); if (!result?.ok) toast(result?.error || t('Aksi belum berhasil.')); return result; }
function renderRail(state) {
 const signature = JSON.stringify([state.accounts, state.slots, state.language]); if (renderRail.signature === signature) return; renderRail.signature = signature;
 document.querySelector('#rail-accounts').innerHTML = state.accounts.map(account => {
  const side = Object.keys(state.slots).find(side => state.slots[side] === account.id);
  return `<button class="rail-account ${account.service} ${side ? 'in-view' : account.keepActive ? '' : 'paused'}" data-account="${account.id}" aria-label="${escapeHTML(account.name)} · ${providerNames[account.service]}${side ? t(' · panel {side}', {side:t(side === 'left' ? 'kiri' : 'kanan')}) : ''}" title="${escapeHTML(account.name)} · ${providerNames[account.service]}">${providerIcon(account.service)}<small>${escapeHTML(account.name.slice(0, 2).toUpperCase())}</small>${side ? '<span class="rail-dot">' + (side === 'left' ? 'L' : 'R') + '</span>' : ''}</button>`;
 }).join('');
}
function railEvents(getState) {
 document.addEventListener('click', event => {
  const overlay = event.target.closest('[data-overlay]'); if (overlay) { void window.duo.overlay(overlay.dataset.overlay === 'close' ? null : overlay.dataset.overlay); return; }
  const rail = event.target.closest('[data-account]'); if (rail) {
   const state = getState(); if (Object.values(state.slots).includes(rail.dataset.account)) { toast(t('Akun ini sudah tampil di salah satu panel.')); return; }
   void accountAction('select', { side: 'right', id: rail.dataset.account });
  }
 });
}
