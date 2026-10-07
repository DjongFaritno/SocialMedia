const slider = document.querySelector('#ratio');
const divider = document.querySelector('#divider');
const main = document.querySelector('main');
function applyRatio(value) {
  const percent = Math.max(30, Math.min(75, value));
  slider.value = percent;
  document.querySelector('#ratio-value').textContent = `${Math.round(percent)}%`;
  main.style.gridTemplateColumns = `calc((100% - 12px) * ${percent / 100}) 12px 1fr`;
  divider.setAttribute('aria-valuenow', Math.round(percent));
}
function setRatio(percent) { applyRatio(percent); window.duo?.setRatio(percent / 100); }
function render(state) {
  if (!state) return;
  applyRatio(state.ratio * 100);
  document.documentElement.dataset.theme = state.effectiveTheme;
  document.querySelector('#theme').value = state.theme;
  document.body.classList.toggle('header-hidden', state.headerHidden);
  document.querySelector('#restore-header').hidden = !state.headerHidden;
  document.querySelectorAll('[data-window-action="fullscreen"]').forEach(button => {
    button.textContent = state.fullscreen ? 'Keluar fullscreen · F11' : 'Layar penuh · F11';
  });
  for (const id of ['whatsapp', 'telegram']) {
    const status = state.statuses?.[id];
    document.querySelector(`#${id}-status`).textContent = status?.state === 'ready' ? 'Web dimuat' : status?.state === 'error' ? 'Gagal memuat' : 'Memuat…';
    if (status?.message) document.querySelector(`#${id}-message`).textContent = status.message;
    const button = document.querySelector(`[data-service="${id}"][data-action="permissions"]`);
    button.textContent = state.permissions?.[id] ? 'Izin aktif' : 'Izin';
  }
}
slider.addEventListener('input', () => setRatio(Number(slider.value)));
document.querySelector('#reset').addEventListener('click', () => setRatio(65));
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => window.duo?.action(button.dataset.service, button.dataset.action)));
divider.addEventListener('pointerdown', event => { divider.setPointerCapture(event.pointerId); });
divider.addEventListener('pointermove', event => {
  if (divider.hasPointerCapture(event.pointerId)) { const rect = main.getBoundingClientRect(); setRatio((event.clientX - rect.left - 6) / (rect.width - 12) * 100); }
});
divider.addEventListener('pointerup', event => { if (divider.hasPointerCapture(event.pointerId)) divider.releasePointerCapture(event.pointerId); });
divider.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) { event.preventDefault(); setRatio(event.key === 'Home' ? 65 : Number(slider.value) + (event.key === 'ArrowRight' ? 1 : -1)); } });
if (window.duo) { window.duo.onState(render); window.duo.getState().then(render); }

document.querySelectorAll('[data-window-action]').forEach(button => button.addEventListener('click', () => window.duo?.windowAction(button.dataset.windowAction)));
document.querySelector('#theme').addEventListener('change', event => window.duo?.setTheme(event.target.value));
