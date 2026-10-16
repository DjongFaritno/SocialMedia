const path = require('node:path');
const os = require('node:os');
const REASONS = {
 Available: '', NotConfiguredForUser: 'Aktifkan Windows Hello di Settings → Accounts → Sign-in options.',
 DeviceNotPresent: 'Windows Hello belum tersedia untuk akun atau perangkat ini.',
 DisabledByPolicy: 'Windows Hello dinonaktifkan oleh kebijakan perangkat.',
 DeviceBusy: 'Windows Hello sedang dipakai. Tutup dialog lain lalu coba lagi.',
 UnsupportedOS: 'Integrasi Windows Hello ini memerlukan Windows 11 atau lebih baru.',
 NativeUnavailable: 'Komponen Windows Hello belum tersedia. Pasang ulang installer DuoChat terbaru.',
 Unavailable: 'Autentikasi perangkat belum tersedia. Password DuoChat tetap bisa dipakai.',
 UnknownError: 'Windows Hello belum bisa diperiksa. Password DuoChat tetap bisa dipakai.'
};
function createBiometrics({ platform = process.platform, release = os.release(), systemPreferences = {}, packaged = false,
 resourcesPath = process.resourcesPath, loadNative = require, getWindow = () => null } = {}) {
 const label = platform === 'win32' ? 'Windows Hello' : platform === 'darwin' ? 'Touch ID' : 'biometrik';
 let status = 'Unavailable', native, pendingCheck, prompting = false;
 const snapshot = () => ({ biometricLabel: label, biometricStatus: status, biometricReason: platform === 'darwin' && status === 'Unavailable' ? 'Touch ID tidak tersedia atau belum diatur. Cek System Settings → Touch ID & Password; password DuoChat tetap tersedia.' : platform !== 'darwin' && platform !== 'win32' ? 'Biometrik Linux belum didukung. Gunakan password DuoChat.' : REASONS[status] || REASONS.Unavailable });
 async function refresh() {
  if (pendingCheck) { await pendingCheck; return snapshot(); }
  pendingCheck = (async () => {
   if (platform === 'darwin') { try { status = systemPreferences.canPromptTouchID() ? 'Available' : 'Unavailable'; } catch { status = 'Unavailable'; } return; }
   if (platform !== 'win32') { status = 'Unavailable'; return; }
   const build = Number(release.split('.')[2]);
   if (!Number.isFinite(build) || build < 22000) { status = 'UnsupportedOS'; return; }
   try {
    native ||= loadNative(packaged ? path.join(resourcesPath, 'native', 'duochat_hello.node') : path.join(__dirname, '..', 'native', 'windows-hello', 'build', 'Release', 'duochat_hello.node'));
   } catch { status = 'NativeUnavailable'; return; }
   try { const value = await native.checkAvailability(); status = Object.hasOwn(REASONS, value) ? value : 'UnknownError'; } catch { status = 'UnknownError'; }
  })();
  try { await pendingCheck; } finally { pendingCheck = null; }
  return snapshot();
 }
 async function prompt() {
  if (prompting) throw Error('Verification already in progress');
  prompting = true;
  try {
   await refresh();
   if (status !== 'Available') throw Error('Verification unavailable');
   const win = getWindow(); if (!win || win.isDestroyed() || !win.isVisible()) throw Error('Window unavailable');
   win.focus();
   if (platform === 'darwin') await systemPreferences.promptTouchID('membuka ruang ngobrolmu di DuoChat');
   else {
    const result = await native.verify(win.getNativeWindowHandle());
    if (result !== 'Verified') { if (Object.hasOwn(REASONS, result) && result !== 'Available') status = result; throw Error('Verification failed'); }
   }
   return true;
  } finally { prompting = false; }
 }
 return { refresh, snapshot, available: () => status === 'Available', prompt };
}
// Called once after the lock overlay and native window are visible.
// Cancellation never schedules another automatic prompt.
function createStartupUnlock({ privacy, canPrompt = () => true }) {
 let attempted = false;
 return async () => {
  if (attempted) return { ok: false, skipped: true }; attempted = true;
  const p = privacy.snapshot();
  if (!p.locked || !p.lockOnStart || !p.biometricOnStart || !p.biometric || !p.biometricAvailable || !canPrompt()) return { ok: false, skipped: true };
  return privacy.action('biometric');
 };
}
module.exports = { createBiometrics, createStartupUnlock };
