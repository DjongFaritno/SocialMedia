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
 if (!state) return; currentState = state;
 const update = state.updates || {}, updateButton = document.querySelector('#update-button');
 updateButton.disabled = ['checking', 'downloading'].includes(update.phase);
 updateButton.dataset.action = update.phase === 'ready' ? 'install' : update.phase === 'available' ? 'download' : 'check';
 updateButton.textContent = update.phase === 'ready' ? 'Pasang & mulai ulang' : update.phase === 'available' ? `Update ${update.version}` : update.phase === 'checking' ? 'Memeriksa…' : update.phase === 'downloading' ? `Unduh ${update.progress}%` : update.phase === 'error' ? 'Coba cek update' : 'Cek update';
 applyRatio(state.ratio * 100); document.documentElement.dataset.theme = state.effectiveTheme;
 document.querySelector('#theme').value = state.theme; document.body.classList.toggle('header-hidden', state.headerHidden);
 document.querySelector('#restore-header').hidden = !state.headerHidden; document.querySelector('#rail-trigger').hidden = !state.headerHidden;
 document.querySelectorAll('[data-window-action="fullscreen"]').forEach(button => { button.textContent = state.fullscreen ? 'Keluar fullscreen · F11' : 'Layar penuh · F11'; });
 renderRail(state);
 const active = state.accounts.filter(item => Object.values(state.slots).includes(item.id) || item.keepActive).length;
 document.querySelector('#active-status').textContent = `${active} akun aktif · ${state.accounts.length - active} akun dijeda`;
 for (const side of ['left', 'right']) {
  const covered = state.privacy?.covered?.[side] === true;
  document.querySelector(`#${side}-cover`).hidden = !covered;
  const preview = document.querySelector(`#${side}-preview`), image = state.panelPreviews?.[side];
  preview.hidden = !(covered && image);
  if (image && preview.getAttribute('src') !== image) preview.src = image;
  if (!image) preview.removeAttribute('src');
  document.querySelectorAll(`[data-cover="${side}"]`).forEach(button => { button.setAttribute('aria-pressed', String(covered)); });
  document.querySelector(`[data-cover="${side}"]:not([data-mode])`).textContent = covered ? '◉' : '◌';
  document.querySelector(`[data-cover="${side}"][data-mode]`).textContent = covered ? 'Buka' : 'Blur';
  const account = state.accounts.find(item => item.id === state.slots[side]), select = document.querySelector(`#${side}-account`);
  const choices = state.accounts.map(item => `<option value="${item.id}">${escapeHTML(item.name)} · ${providerNames[item.service]}</option>`).join('');
  if (select.innerHTML !== choices) select.innerHTML = choices; select.value = account.id;
  const status = state.statuses?.[account.id]; document.querySelector(`#${side}-status`).textContent = status?.state === 'ready' ? 'Web dimuat' : status?.state === 'error' ? status.message || 'Gagal memuat' : 'Memuat…';
  const icon = document.querySelector(`#${side}-icon`); icon.className = 'provider-icon ' + account.service; icon.innerHTML = providerIcon(account.service);
  document.querySelector(`#${side}-name`).textContent = account.name;
  document.querySelector(`[data-side="${side}"][data-action="permissions"]`).textContent = account.permissions ? 'Izin aktif' : 'Izin';
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

document.querySelectorAll('[data-cover]').forEach(button => button.addEventListener('click', () => window.duo.privacyAction('cover', { side: button.dataset.cover, mode: button.dataset.mode })));
document.querySelector('#lock-app').addEventListener('click', () => currentState?.privacy?.configured ? window.duo.privacyAction('lock') : window.duo.overlay('privacy'));
