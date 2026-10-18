const blurForm = document.querySelector('#blur-form');
let blurSignature, blurMode;
const blurLabels = { messages: 'pesan/postingan', previews: 'preview', names: 'nama', avatars: 'foto profil', media: 'media', composer: 'kolom ketik' };
function updateBlurStrength() { document.querySelector('#blur-strength-value').textContent = document.querySelector('#blur-strength').value + ' px'; }
function renderBlur(state) {
 const entering = blurMode !== state.overlayMode; blurMode = state.overlayMode;
 if (state.overlayMode !== 'blur') return;
 const signature = JSON.stringify(state.blur);
 if (!entering && signature === blurSignature) return;
 blurSignature = signature;
 document.querySelector('#blur-hover').checked = state.blur.revealOnHover;
 document.querySelector('#blur-strength').value = state.blur.strength;
 document.querySelectorAll('[data-blur-element]').forEach(input => { input.checked = state.blur.elements[input.dataset.blurElement]; });
 document.querySelector('#blur-error').textContent = ''; updateBlurStrength();
 document.querySelector('#blur-support-list').replaceChildren(...Object.values(state.blurSupport || {}).map(support => {
  const row = document.createElement('p'), title = document.createElement('strong'), detail = document.createElement('span');
  title.textContent = support.name + (support.experimental ? ' · awal' : '');
  detail.textContent = support.elements.length ? support.elements.map(key => blurLabels[key]).join(' · ') : 'Blur elemen belum tersedia. Gunakan Tutup sementara atau Kunci DuoChat.';
  row.append(title, detail); return row;
 }));
}
document.querySelector('#blur-strength').addEventListener('input', updateBlurStrength);
document.querySelector('#blur-select-all').addEventListener('click', () => { document.querySelectorAll('[data-blur-element]').forEach(input => { input.checked = true; }); });
document.querySelector('#blur-reset').addEventListener('click', () => {
 document.querySelectorAll('[data-blur-element]').forEach(input => { input.checked = input.dataset.blurElement !== 'composer'; });
 document.querySelector('#blur-hover').checked = true; document.querySelector('#blur-strength').value = 10; updateBlurStrength();
});
blurForm.addEventListener('submit', async event => {
 event.preventDefault(); const button = blurForm.querySelector('[type="submit"]'); if (button.disabled) return; button.disabled = true;
 const input = { revealOnHover: document.querySelector('#blur-hover').checked, strength: Number(document.querySelector('#blur-strength').value),
  elements: Object.fromEntries([...document.querySelectorAll('[data-blur-element]')].map(element => [element.dataset.blurElement, element.checked])) };
 try {
  const result = await window.duo.blurAction('save', input);
  if (!result?.ok) document.querySelector('#blur-error').textContent = result?.error || 'Pengaturan blur belum tersimpan.';
  else { toast('Pilihan blur tersimpan untuk semua panel.'); await window.duo.overlay(null); }
 } catch { document.querySelector('#blur-error').textContent = 'Pengaturan blur belum tersimpan. Coba lagi.'; }
 finally { button.disabled = false; }
});
