const providerNames = { whatsapp: 'WhatsApp', telegram: 'Telegram', discord: 'Discord', x: 'X', instagram: 'Instagram', threads: 'Threads' };
const providerPaths = {
 whatsapp: '<path d="M20.5 11.6a8.6 8.6 0 0 1-12.9 7.5L3 20.5l1.4-4.3a8.6 8.6 0 1 1 16.1-4.6z"/><path d="m8 8 2 2-1 1c1 2 2 3 4 4l1-1 2 1"/>',
 telegram: '<path d="m21 3-5 18-5-7-8-3 18-8z"/><path d="m11 14 5-6"/>',
 discord: '<path d="m8 5-3 1c-2 3-3 7-3 11l5 2 1-2h8l1 2 5-2c0-4-1-8-3-11l-3-1-1 2H9L8 5z"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>',
 x: '<path d="m4 3 16 18M20 3 4 21M4 3h5l11 18h-5L4 3z"/>',
 instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
 threads: '<path d="M19 7c-2-5-12-6-15 0-2 4-1 12 4 14 5 2 12-1 12-6 0-5-9-7-11-3-3 5 8 7 7-2-.4-3-3-5-7-3"/>'
};
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function providerIcon(service) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${providerPaths[service] || ''}</svg>`; }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { el.hidden = true; }, 4200); }
async function accountAction(action, input) { const result = await window.duo.accountAction(action, input); if (!result?.ok) toast(result?.error || 'Aksi belum berhasil.'); return result; }
function renderRail(state) {
 const signature = JSON.stringify([state.accounts, state.slots]); if (renderRail.signature === signature) return; renderRail.signature = signature;
 document.querySelector('#rail-accounts').innerHTML = state.accounts.map(account => {
  const side = Object.keys(state.slots).find(side => state.slots[side] === account.id);
  return `<button class="rail-account ${account.service} ${side ? 'in-view' : account.keepActive ? '' : 'paused'}" data-account="${account.id}" aria-label="${escapeHTML(account.name)} · ${providerNames[account.service]}${side ? ' · panel ' + side : ''}" title="${escapeHTML(account.name)} · ${providerNames[account.service]}">${providerIcon(account.service)}<small>${escapeHTML(account.name.slice(0, 2).toUpperCase())}</small>${side ? '<span class="rail-dot">' + (side === 'left' ? 'L' : 'R') + '</span>' : ''}</button>`;
 }).join('');
}
function railEvents(getState) {
 document.addEventListener('click', event => {
  const overlay = event.target.closest('[data-overlay]'); if (overlay) { void window.duo.overlay(overlay.dataset.overlay === 'close' ? null : overlay.dataset.overlay); return; }
  const rail = event.target.closest('[data-account]'); if (rail) {
   const state = getState(); if (Object.values(state.slots).includes(rail.dataset.account)) { toast('Akun ini sudah tampil di salah satu panel.'); return; }
   void accountAction('select', { side: 'right', id: rail.dataset.account });
  }
 });
}
