let currentState, lastMode, settingsSignature;
function render(state) {
 if (!state) return; currentState = state; document.documentElement.dataset.theme = state.effectiveTheme;
 renderPrivacy(state);
 renderRail(state); document.body.classList.toggle('rail-only', state.overlayMode === 'rail');
 const signature = JSON.stringify([state.accounts, state.slots]);
 if (signature !== settingsSignature) {
  const focused = document.activeElement?.dataset.rename, caret = document.activeElement?.selectionStart; settingsSignature = signature;
  document.querySelector('#account-settings').innerHTML = state.accounts.map(account => {
   const visible = Object.values(state.slots).includes(account.id);
   return `<div class="settings-account"><span class="provider-icon ${account.service}">${providerIcon(account.service)}</span><div class="settings-caption"><input value="${escapeHTML(account.name)}" maxlength="40" data-rename="${account.id}" aria-label="Nama akun ${escapeHTML(account.name)}"><small>${providerNames[account.service]} · ${visible ? 'Tampil di panel' : account.keepActive ? 'Aktif di latar belakang' : 'Dijeda'}</small></div><label class="keep-label"><input type="checkbox" data-keep="${account.id}" ${account.keepActive ? 'checked' : ''}> Tetap aktif</label><button data-remove="${account.id}" ${visible || state.accounts.length <= 2 ? 'disabled' : ''} aria-label="Hapus ${escapeHTML(account.name)}">Hapus</button></div>`;
  }).join('');
  if (focused) { const input = document.querySelector(`[data-rename="${focused}"]`); input?.focus(); input?.setSelectionRange(caret, caret); }
 }
 if (lastMode === state.overlayMode) return; lastMode = state.overlayMode;
 document.querySelectorAll('dialog').forEach(dialog => { if (dialog.open) dialog.close(); });
 if (state.overlayMode === 'add') { document.querySelector('#add-dialog').showModal(); document.querySelector('#account-name').focus(); }
 if (state.overlayMode === 'privacy') document.querySelector('#privacy-dialog').showModal();
 if (state.overlayMode === 'lock') document.querySelector('#unlock-password').focus();
 if (state.overlayMode === 'manage') document.querySelector('#manage-dialog').showModal();
 if (state.overlayMode === 'rail') document.querySelector('#rail-accounts button')?.focus();
}
document.querySelector('#provider-options').innerHTML = Object.entries(providerNames).map(([id, name]) => `<button type="button" data-provider="${id}" class="${id === 'whatsapp' ? 'selected' : ''}">${providerIcon(id)}<span>${name}</span></button>`).join('');
document.addEventListener('click', event => {
 const provider = event.target.closest('[data-provider]'); if (provider) { document.querySelector('#provider').value = provider.dataset.provider; document.querySelectorAll('[data-provider]').forEach(button => button.classList.toggle('selected', button === provider)); }
 const remove = event.target.closest('[data-remove]'); if (remove) void accountAction('remove', { id: remove.dataset.remove });
});
document.addEventListener('change', async event => {
 if (event.target.matches('[data-rename]')) { const result = await accountAction('rename', { id: event.target.dataset.rename, name: event.target.value }); if (!result?.ok) { settingsSignature = null; render(await window.duo.getState()); } }
 if (event.target.matches('[data-keep]')) { await accountAction('keep', { id: event.target.dataset.keep, value: event.target.checked }); settingsSignature = null; render(await window.duo.getState()); }
});
document.querySelector('#add-form').addEventListener('submit', async event => {
 event.preventDefault(); const button = event.target.querySelector('[type="submit"]'); if (button.disabled) return; button.disabled = true;
 try { const result = await accountAction('add', { service: document.querySelector('#provider').value, name: document.querySelector('#account-name').value }); if (result?.ok) { document.querySelector('#account-name').value = ''; toast('Akun ditambahkan. Pilih dari menu panel untuk login.'); await window.duo.overlay('manage'); } } finally { button.disabled = false; }
});
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { event.preventDefault(); void window.duo.overlay(null); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); void window.duo.overlay(null); } });
window.addEventListener('mouseout', event => { if (!event.relatedTarget && currentState?.overlayMode === 'rail') void window.duo.overlay(null); });
railEvents(() => currentState); window.duo.onState(render); window.duo.getState().then(render);
