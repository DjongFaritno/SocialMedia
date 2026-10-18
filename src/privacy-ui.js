let privacyMode, privacyConfigured, privacyStartupError;
const privacyForm = document.querySelector('#privacy-form'), unlockForm = document.querySelector('#unlock-form');
function clearPrivacyPasswords() { document.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; }); }
function renderPrivacy(state) {
 const p = state.privacy; if (!p) return;
 const entering = privacyMode !== state.overlayMode, changed = privacyConfigured !== p.configured;
 if (entering) { clearPrivacyPasswords(); document.querySelector('#privacy-error').textContent = ''; document.querySelector('#unlock-error').textContent = ''; }
 privacyMode = state.overlayMode; privacyConfigured = p.configured;
 document.body.classList.toggle('app-locked', p.locked);
 document.querySelector('#lock-screen').hidden = !p.locked;
 document.querySelector('#unlock-biometric').hidden = !p.biometric;
 document.querySelector('#unlock-biometric').textContent = t('Buka dengan {method}', {method:p.biometricLabel});
 document.querySelector('#biometric-label').textContent = t('Buka kunci dengan {method}', {method:p.biometricLabel});
 document.querySelector('#biometric-start-label').textContent = t('Minta {method} saat DuoChat dibuka', {method:p.biometricLabel});
 document.querySelector('#enable-biometric').disabled = !p.biometricAvailable && !p.biometric;
 document.querySelector('#biometric-help').textContent = p.biometricAvailable
  ? (p.biometricLabel === 'Windows Hello' ? t('Windows memilih wajah, sidik jari, atau PIN Hello sesuai pengaturanmu. ') : t('Verifikasi memakai Touch ID macOS. ')) + t('Password DuoChat tetap tersedia. Mengaktifkan opsi ini perlu verifikasi perangkat sekali.')
  : p.biometricReason;
 if (p.biometricStartupError && p.biometricStartupError !== privacyStartupError) document.querySelector('#unlock-error').textContent = p.biometricStartupError;
 privacyStartupError = p.biometricStartupError;
 document.querySelector('#password-help').textContent = p.configured ? t('Biarkan password baru kosong kalau hanya ingin mengubah pilihan di bawah.') : t('Password ini khusus DuoChat, terpisah dari password komputer dan akun chat.');
 if (state.overlayMode !== 'privacy' || (!entering && !changed)) return;
 document.querySelector('#current-password-row').hidden = !p.configured;
 document.querySelector('#current-password').required = p.configured;
 document.querySelector('#new-password').required = !p.configured;
 document.querySelector('#confirm-password').required = !p.configured;
 document.querySelector('#disable-lock').hidden = !p.configured;
 document.querySelector('#password-help').textContent = p.configured ? t('Biarkan password baru kosong kalau hanya ingin mengubah pilihan di bawah.') : t('Password ini khusus DuoChat, terpisah dari password komputer dan akun chat.');
 document.querySelector('#lock-on-start').checked = p.lockOnStart;
 document.querySelector('#lock-on-os').checked = p.lockOnOS;
 document.querySelector('#idle-minutes').value = p.idleMinutes;
 document.querySelector('#enable-biometric').checked = p.biometric;
 document.querySelector('#biometric-on-start').checked = p.biometricOnStart;
 updateBiometricOptions();
}
async function privacyRequest(form, action, input, output) {
 const buttons = [...form.querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
 try {
  const result = await window.duo.privacyAction(action, input);
  document.querySelector(output).textContent = result?.ok ? '' : result?.error || t('Belum berhasil. Coba lagi.');
  if (result?.ok) clearPrivacyPasswords();
  return result;
 } catch { document.querySelector(output).textContent = t('Belum berhasil. Coba lagi.'); return { ok: false }; }
 finally { buttons.forEach(button => { button.disabled = false; }); }
}
privacyForm.addEventListener('submit', async event => {
 event.preventDefault();
 const result = await privacyRequest(privacyForm, 'save', {
  currentPassword: document.querySelector('#current-password').value, newPassword: document.querySelector('#new-password').value, confirmPassword: document.querySelector('#confirm-password').value,
  lockOnStart: document.querySelector('#lock-on-start').checked, lockOnOS: document.querySelector('#lock-on-os').checked, idleMinutes: Number(document.querySelector('#idle-minutes').value), biometric: document.querySelector('#enable-biometric').checked, biometricOnStart: document.querySelector('#biometric-on-start').checked
 }, '#privacy-error');
 if (result?.ok) { toast(t('Privasi tersimpan. Santai, lanjut ngobrol.')); await window.duo.overlay(null); }
});
document.querySelector('#disable-lock').addEventListener('click', async () => {
 const result = await privacyRequest(privacyForm, 'disable', { currentPassword: document.querySelector('#current-password').value }, '#privacy-error');
 if (result?.ok) { toast(t('Kunci aplikasi dimatikan.')); await window.duo.overlay(null); }
});
unlockForm.addEventListener('submit', async event => { event.preventDefault(); await privacyRequest(unlockForm, 'unlock', { password: document.querySelector('#unlock-password').value }, '#unlock-error'); document.querySelector('#unlock-password').value = ''; });
document.querySelector('#unlock-biometric').addEventListener('click', () => privacyRequest(unlockForm, 'biometric', {}, '#unlock-error'));

function updateBiometricOptions() {
 const enabled = document.querySelector('#enable-biometric').checked;
 const startup = document.querySelector('#biometric-on-start');
 startup.disabled = !enabled || !document.querySelector('#lock-on-start').checked;
 if (startup.disabled) startup.checked = false;
}
document.querySelector('#enable-biometric').addEventListener('change', updateBiometricOptions);
document.querySelector('#lock-on-start').addEventListener('change', updateBiometricOptions);
