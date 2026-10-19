let currentState, lastMode, settingsSignature;
function render(state) {
 if (!state) return; currentState = state; DuoI18n.setLanguage(state.language); DuoI18n.apply(document); document.documentElement.dataset.theme = state.effectiveTheme;
 renderPrivacy(state); renderBlur(state);
 renderAccountPicker(state); renderRail(state); document.body.classList.toggle('rail-only', state.overlayMode === 'rail');
 const signature = JSON.stringify([state.accounts, state.slots, state.language]);
 if (signature !== settingsSignature) {
  const focused = document.activeElement?.dataset.rename, caret = document.activeElement?.selectionStart; settingsSignature = signature;
  document.querySelector('#account-settings').innerHTML = state.accounts.map(account => {
   const visible = Object.values(state.slots).includes(account.id);
   return `<div class="settings-account"><span class="provider-icon ${account.service}">${providerIcon(account.service)}</span><div class="settings-caption"><input value="${escapeHTML(account.name)}" maxlength="40" data-rename="${account.id}" aria-label="${escapeHTML(t('Nama akun {name}',{name:account.name}))}"><small>${providerNames[account.service]} · ${visible ? t('Tampil di panel') : account.keepActive ? t('Aktif di latar belakang') : t('Dijeda')}</small></div><label class="keep-label"><input type="checkbox" data-keep="${account.id}" ${account.keepActive ? 'checked' : ''}> ${t('Tetap aktif')}</label><button data-remove="${account.id}" ${visible || state.accounts.length <= 2 ? 'disabled' : ''} aria-label="${escapeHTML(t('Hapus {name}',{name:account.name}))}">${t('Hapus')}</button></div>`;
  }).join('');
  if (focused) { const input = document.querySelector(`[data-rename="${focused}"]`); input?.focus(); input?.setSelectionRange(caret, caret); }
 }
 const note = document.querySelector('#provider-note'); note.textContent = t(providerNotes[document.querySelector('#provider').value] || ''); note.hidden = !note.textContent;
 if (lastMode === state.overlayMode) return; lastMode = state.overlayMode;
 document.querySelectorAll('dialog').forEach(dialog => { if (dialog.open) dialog.close(); });
 if (state.overlayMode === 'add') { document.querySelector('#add-dialog').showModal(); document.querySelector('#account-name').focus(); }
 if (state.overlayMode === 'blur') document.querySelector('#blur-dialog').showModal();
 if (state.overlayMode === 'privacy') document.querySelector('#privacy-dialog').showModal();
 if (state.overlayMode === 'lock') document.querySelector('#unlock-password').focus();
 if (state.overlayMode === 'manage') document.querySelector('#manage-dialog').showModal();
 if (state.overlayMode === 'pick-left' || state.overlayMode === 'pick-right') document.querySelector('#account-picker-list [aria-selected=true]')?.focus();
 if (state.overlayMode === 'rail') document.querySelector('#rail-accounts button')?.focus();
}
document.querySelector('#provider-options').innerHTML = Object.entries(providerNames).map(([id, name]) => `<button type="button" data-provider="${id}" class="${id === 'whatsapp' ? 'selected' : ''}">${providerIcon(id)}<span>${name}</span></button>`).join('');
document.addEventListener('click', event => {
 const provider = event.target.closest('[data-provider]'); if (provider) { document.querySelector('#provider').value = provider.dataset.provider; const note = document.querySelector('#provider-note'); note.textContent = t(providerNotes[provider.dataset.provider] || ''); note.hidden = !note.textContent; document.querySelectorAll('[data-provider]').forEach(button => button.classList.toggle('selected', button === provider)); }
 const remove = event.target.closest('[data-remove]'); if (remove) void accountAction('remove', { id: remove.dataset.remove });
});
document.addEventListener('change', async event => {
 if (event.target.matches('[data-rename]')) { const result = await accountAction('rename', { id: event.target.dataset.rename, name: event.target.value }); if (!result?.ok) { settingsSignature = null; render(await window.duo.getState()); } }
 if (event.target.matches('[data-keep]')) { await accountAction('keep', { id: event.target.dataset.keep, value: event.target.checked }); settingsSignature = null; render(await window.duo.getState()); }
});
document.querySelector('#add-form').addEventListener('submit', async event => {
 event.preventDefault(); const button = event.target.querySelector('[type="submit"]'); if (button.disabled) return; button.disabled = true;
 try { const result = await accountAction('add', { service: document.querySelector('#provider').value, name: document.querySelector('#account-name').value }); if (result?.ok) { document.querySelector('#account-name').value = ''; toast(t('Akun ditambahkan. Pilih dari menu panel untuk login.')); await window.duo.overlay('manage'); } } finally { button.disabled = false; }
});
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('cancel', event => { event.preventDefault(); void window.duo.overlay(null); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); void window.duo.overlay(null); } });
window.addEventListener('mouseout', event => { if (!event.relatedTarget && currentState?.overlayMode === 'rail') void window.duo.overlay(null); });
railEvents(() => currentState); window.duo.onState(render); window.duo.getState().then(render);

let pickerSignature;
function renderAccountPicker(state) {
 const side=state.overlayMode==='pick-left'?'left':state.overlayMode==='pick-right'?'right':null;
 const list=document.querySelector('#account-picker-list');list.hidden=!side;document.body.classList.toggle('account-picker-mode',Boolean(side));
 if (!side) return;
 list.setAttribute('aria-label',t(side==='left'?'Akun panel kiri':'Akun panel kanan'));
 const signature=JSON.stringify([side,state.accounts,state.slots,state.language]);
 if(signature===pickerSignature)return;pickerSignature=signature;
 const focused=document.activeElement?.dataset.pickAccount;
 list.replaceChildren(...state.accounts.map(account=>{
  const button=document.createElement('button');button.type='button';button.className='account-option';button.dataset.pickAccount=account.id;
  button.setAttribute('role','option');button.setAttribute('aria-selected',String(account.id===state.slots[side]));
  button.textContent=account.name+' · '+providerNames[account.service];button.title=button.textContent;button.tabIndex=account.id===state.slots[side]?0:-1;
  button.addEventListener('click',async()=>{
   if(button.disabled)return;button.disabled=true;
   try {const result=await accountAction('select',{side,id:account.id});if(result?.ok)await window.duo.overlay(null);}
   finally {button.disabled=false;}
  });return button;
 }));
 if(focused)Array.from(list.children).find(button=>button.dataset.pickAccount===focused)?.focus();
}
document.querySelector('#account-picker-list').addEventListener('keydown',event=>{
 const buttons=Array.from(event.currentTarget.querySelectorAll('button'));
 const index=buttons.indexOf(document.activeElement);let next;
 if(event.key==='ArrowDown'||event.key==='Tab'&&!event.shiftKey)next=(index+1)%buttons.length;
 if(event.key==='ArrowUp'||event.key==='Tab'&&event.shiftKey)next=(index-1+buttons.length)%buttons.length;
 if(event.key==='Home')next=0;if(event.key==='End')next=buttons.length-1;
 if(next!==undefined){event.preventDefault();buttons.forEach((b,i)=>b.tabIndex=i===next?0:-1);buttons[next].focus();buttons[next].scrollIntoView({block:'nearest'});}
});
