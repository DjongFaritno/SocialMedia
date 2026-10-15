let privacyMode, privacyConfigured;
const privacyForm = document.querySelector('#privacy-form'), unlockForm = document.querySelector('#unlock-form');
function clearPrivacyPasswords() { document.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); }
function renderPrivacy(state) {
 const p = state.privacy; if (!p) return;
 const entering = privacyMode !== state.overlayMode, changed = privacyConfigured !== p.configured;
 if (entering) { clearPrivacyPasswords(); document.querySelector('#privacy-error').textContent = ''; document.querySelector('#unlock-error').textContent = ''; }
 privacyMode = state.overlayMode; privacyConfigured = p.configured;
 document.body.classList.toggle('app-locked', p.locked);
 document.querySelector('#lock-screen').hidden = !p.locked;
 document.querySelector('#unlock-biometric').hidden = !(p.biometric && p.biometricAvailable);
 if (state.overlayMode !== 'privacy' || (!entering && !changed)) return;
 document.querySelector('#current-password-row').hidden = !p.configured;
 document.querySelector('#current-password').required = p.configured;
 document.querySelector('#new-password').required = !p.configured;
 document.querySelector('#confirm-password').required = !p.configured;
 document.querySelector('#disable-lock').hidden = !p.configured;
 document.querySelector('#password-help').textContent = p.configured ? 'Biarkan password baru kosong kalau hanya ingin mengubah pilihan di bawah.' : 'Password ini khusus DuoChat, terpisah dari password komputer dan akun chat.';
 document.querySelector('#lock-on-start').checked = p.lockOnStart;
 document.querySelector('#lock-on-os').checked = p.lockOnOS;
 document.querySelector('#idle-minutes').value = p.idleMinutes;
 document.querySelector('#biometric-row').hidden = !p.biometricAvailable;
 document.querySelector('#enable-biometric').checked = p.biometric;
 document.querySelector('#biometric-help').textContent = p.biometricAvailable ? 'Touch ID memakai autentikasi macOS. Password tetap bisa dipakai.' : 'Gunakan password di perangkat ini. Integrasi Windows Hello dan fingerprint Linux belum tersedia.';
}
async function privacyRequest(form, action, input, output) {
 const buttons = [...form.querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
 try {
  const result = await window.duo.privacyAction(action, input);
  document.querySelector(output).textContent = result?.ok ? '' : result?.error || 'Belum berhasil. Coba lagi.';
  if (result?.ok) clearPrivacyPasswords();
  return result;
 } catch { document.querySelector(output).textContent = 'Belum berhasil. Coba lagi.'; return { ok: false }; }
 finally { buttons.forEach(button => { button.disabled = false; }); }
}
privacyForm.addEventListener('submit', async event => {
 event.preventDefault();
 const result = await privacyRequest(privacyForm, 'save', {
  currentPassword: document.querySelector('#current-password').value, newPassword: document.querySelector('#new-password').value, confirmPassword: document.querySelector('#confirm-password').value,
  lockOnStart: document.querySelector('#lock-on-start').checked, lockOnOS: document.querySelector('#lock-on-os').checked, idleMinutes: Number(document.querySelector('#idle-minutes').value), biometric: document.querySelector('#enable-biometric').checked
 }, '#privacy-error');
 if (result?.ok) { toast('Privasi tersimpan. Santai, lanjut ngobrol.'); await window.duo.overlay(null); }
});
document.querySelector('#disable-lock').addEventListener('click', async () => {
 const result = await privacyRequest(privacyForm, 'disable', { currentPassword: document.querySelector('#current-password').value }, '#privacy-error');
 if (result?.ok) { toast('Kunci aplikasi dimatikan.'); await window.duo.overlay(null); }
});
unlockForm.addEventListener('submit', async event => { event.preventDefault(); await privacyRequest(unlockForm, 'unlock', { password: document.querySelector('#unlock-password').value }, '#unlock-error'); document.querySelector('#unlock-password').value = ''; });
document.querySelector('#unlock-biometric').addEventListener('click', () => privacyRequest(unlockForm, 'biometric', {}, '#unlock-error'));
