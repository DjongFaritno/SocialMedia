const slider = document.querySelector('#ratio'), divider = document.querySelector('#divider'), main = document.querySelector('main');
let currentState;
function applyRatio(value) {
 const percent = Math.max(30, Math.min(75, value)); slider.value = percent;
 document.querySelector('#ratio-value').textContent = `${Math.round(percent)}%`;
 main.style.gridTemplateColumns = `calc((100% - 12px) * ${percent / 100}) 12px 1fr`;
 divider.setAttribute('aria-valuenow', Math.round(percent));
}
function setRatio(percent) { applyRatio(percent); void window.duo.setRatio(percent / 100); }
function render(state) {
 if (!state) return; currentState = state; DuoI18n.setLanguage(state.language); DuoI18n.apply(document);
 const update = state.updates || {}, updateButton = document.querySelector('#update-button');
 updateButton.disabled = ['checking', 'downloading'].includes(update.phase);
 updateButton.dataset.action = update.phase === 'ready' ? 'install' : update.phase === 'available' ? 'download' : 'check';
 updateButton.textContent = update.phase === 'ready' ? t('Pasang & mulai ulang') : update.phase === 'available' ? `Update ${update.version}` : update.phase === 'checking' ? t('Memeriksa…') : update.phase === 'downloading' ? t('Unduh {progress}%', {progress:update.progress}) : update.phase === 'error' ? t('Coba cek update') : t('Cek update');
 applyRatio(state.ratio * 100); document.documentElement.dataset.theme = state.effectiveTheme;
 document.querySelector('#theme').value = state.theme; document.body.classList.toggle('header-hidden', state.headerHidden);
 document.querySelector('#restore-header').hidden = !state.headerHidden; document.querySelector('#rail-trigger').hidden = !state.headerHidden;
 document.querySelectorAll('[data-window-action="fullscreen"]').forEach(button => { button.textContent = state.fullscreen ? t('Keluar fullscreen · F11') : t('Layar penuh · F11'); });
 document.querySelectorAll('[data-blur-toggle]').forEach(button => { const account = state.accounts.find(item => item.id === state.slots[button.dataset.blurToggle]);
  const supported = Boolean(state.blurSupport?.[account?.service]?.elements.length);
  button.disabled = !supported; button.title = supported ? '' : t('Blur elemen belum tersedia. Gunakan Tutup sementara atau Kunci DuoChat.');
  button.textContent = supported ? (state.blurPanels[button.dataset.blurToggle] ? 'Blur ON' : 'Blur OFF') : t('Blur belum tersedia'); button.setAttribute('aria-pressed', String(supported && state.blurPanels[button.dataset.blurToggle])); });
 renderRail(state);
 const active = state.accounts.filter(item => Object.values(state.slots).includes(item.id) || item.keepActive).length;
 document.querySelector('#active-status').textContent = t('{active} akun aktif · {paused} akun dijeda', {active, paused:state.accounts.length-active});
 for (const side of ['left', 'right']) {
  const covered = state.privacy?.covered?.[side] === true;
  document.querySelector(`#${side}-cover`).hidden = !covered;
  document.querySelectorAll(`[data-cover="${side}"]`).forEach(button => { button.setAttribute('aria-pressed', String(covered)); });
  document.querySelector(`nav [data-cover="${side}"]`).textContent = covered ? '◉' : '◌';
  const account = state.accounts.find(item => item.id === state.slots[side]), select = document.querySelector(`#${side}-account`);
  const choices = state.accounts.map(item => `<option value="${item.id}">${escapeHTML(item.name)} · ${providerNames[item.service]}</option>`).join('');
  if (select.innerHTML !== choices) select.innerHTML = choices; select.value = account.id;
  const status = state.statuses?.[account.id]; document.querySelector(`#${side}-status`).textContent = state.blurPanels[side] && state.blurStatuses?.[account.id] === 'error' ? t('Blur gagal · muat ulang') : status?.state === 'ready' ? t('Web dimuat') : status?.state === 'error' ? t(status.message || 'Gagal memuat', status.values) : t('Memuat…');
  const icon = document.querySelector(`#${side}-icon`); icon.className = 'provider-icon ' + account.service; icon.innerHTML = providerIcon(account.service);
  document.querySelector(`#${side}-name`).textContent = account.name;
  document.querySelector(`[data-side="${side}"][data-action="permissions"]`).textContent = account.permissions ? t('Izin aktif') : t('Izin');
 }
}
slider.addEventListener('input', () => setRatio(Number(slider.value)));
document.querySelector('#reset').addEventListener('click', () => setRatio(65));
for (const side of ['left', 'right']) document.querySelector(`#${side}-account`).addEventListener('change', async event => { await accountAction('select', { side, id: event.target.value }); render(await window.duo.getState()); });
document.querySelectorAll('[data-action][data-side]').forEach(button => button.addEventListener('click', () => window.duo.action(currentState.slots[button.dataset.side], button.dataset.action)));
divider.addEventListener('pointerdown', event => divider.setPointerCapture(event.pointerId));
divider.addEventListener('pointermove', event => { if (divider.hasPointerCapture(event.pointerId)) { const rect = main.getBoundingClientRect(); setRatio((event.clientX - rect.left - 6) / (rect.width - 12) * 100); } });
divider.addEventListener('pointerup', event => { if (divider.hasPointerCapture(event.pointerId)) divider.releasePointerCapture(event.pointerId); });
divider.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) { event.preventDefault(); setRatio(event.key === 'Home' ? 65 : Number(slider.value) + (event.key === 'ArrowRight' ? 1 : -1)); } });
document.querySelectorAll('[data-window-action]').forEach(button => button.addEventListener('click', () => window.duo.windowAction(button.dataset.windowAction)));
document.querySelector('#theme').addEventListener('change', event => window.duo.setTheme(event.target.value));
document.querySelector('#update-button').addEventListener('click', event => window.duo.updateAction(event.currentTarget.dataset.action || 'check'));
const trigger = document.querySelector('#rail-trigger'); trigger.addEventListener('pointerenter', () => window.duo.overlay('rail')); trigger.addEventListener('click', () => window.duo.overlay('rail', true));
trigger.addEventListener('keydown', event => { if (['Enter', 'ArrowRight', ' '].includes(event.key)) { event.preventDefault(); void window.duo.overlay('rail', true); } });
railEvents(() => currentState); window.duo.onState(render); window.duo.getState().then(render);

document.querySelectorAll('[data-cover]').forEach(button => button.addEventListener('click', () => window.duo.privacyAction('cover', { side: button.dataset.cover })));
document.querySelector('#lock-app').addEventListener('click', () => currentState?.privacy?.configured ? window.duo.privacyAction('lock') : window.duo.overlay('privacy'));

document.querySelectorAll('[data-blur-toggle]').forEach(button => button.addEventListener('click', async () => {
 try { const result = await window.duo.blurAction('toggle', { side: button.dataset.blurToggle }); if (!result?.ok) toast(result?.error || t('Blur belum berhasil diubah.')); } catch { toast(t('Blur belum berhasil diubah.')); }
}));

document.querySelector('[data-language]').addEventListener('change', event => window.duo.setLanguage(event.target.value));
