const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const defaults = () => ({ credential: null, lockOnStart: true, lockOnOS: true, idleMinutes: 0, biometric: false, biometricOnStart: false });
function readPrivacy(raw) {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Invalid privacy settings');
 const credential = raw.credential;
 if (credential !== null && (!credential || credential.algorithm !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(credential.salt) || !/^[a-f0-9]{128}$/.test(credential.hash))) throw Error('Invalid privacy credential');
 return { credential: credential ? { algorithm: 'scrypt-v1', salt: credential.salt, hash: credential.hash } : null,
  lockOnStart: raw.lockOnStart !== false, lockOnOS: raw.lockOnOS !== false,
  idleMinutes: [0, 1, 5, 15, 30].includes(raw.idleMinutes) ? raw.idleMinutes : 0, biometric: raw.biometric === true, biometricOnStart: raw.biometric === true && raw.lockOnStart !== false && raw.biometricOnStart === true };
}
function validPassword(value) { return typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 1024; }
async function makeCredential(password) {
 const salt = randomBytes(16).toString('hex');
 const hash = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
 return { algorithm: 'scrypt-v1', salt, hash: hash.toString('hex') };
}
async function matches(password, credential) {
 if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 1024 || !credential) return false;
 const hash = await derive(password, credential.salt, 64, { N: 16384, r: 8, p: 1 });
 return timingSafeEqual(hash, Buffer.from(credential.hash, 'hex'));
}
function createPrivacy({ record = defaults(), persist = () => {}, changed = () => {}, canBiometric = () => false, promptBiometric, now = Date.now } = {}) {
 record = readPrivacy(record);
 let locked = Boolean(record.credential && record.lockOnStart), epoch = 0, busy = false, failures = 0, retryAt = 0;
 const covered = { left: false, right: false };
 const available = () => { try { return canBiometric() === true; } catch { return false; } };
 const snapshot = () => ({ configured: Boolean(record.credential), locked, covered: { ...covered }, lockOnStart: record.lockOnStart, lockOnOS: record.lockOnOS, idleMinutes: record.idleMinutes, biometric: record.biometric, biometricOnStart: record.biometricOnStart, biometricAvailable: available() });
 const lock = () => { epoch++; if (!record.credential) return false; locked = true; changed(); return true; };
 const concealed = side => locked || covered[side] === true;
 const commit = next => { persist(next); record = next; changed(); };
 async function action(type, input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Permintaan tidak valid.' };
  if (type === 'lock') return { ok: lock() };
  if (type === 'cover') {
   if (locked || !['left', 'right'].includes(input.side)) return { ok: false, error: 'Buka kunci dulu.' };
   covered[input.side] = !covered[input.side]; changed(); return { ok: true };
  }
  if (!['save', 'disable', 'unlock', 'biometric'].includes(type)) return { ok: false, error: 'Aksi tidak dikenal.' };
  if (busy) return { ok: false, error: 'Sebentar, sedang diperiksa.' };
  if (type === 'biometric' && (!locked || !record.credential || !record.biometric || !available() || !promptBiometric)) return { ok: false, error: 'Autentikasi perangkat tidak tersedia. Gunakan password DuoChat.' };
  if (locked && !['unlock', 'biometric'].includes(type)) return { ok: false, error: 'Buka kunci dulu.' };
  if (type === 'unlock' && !locked) return { ok: true };
  if (type !== 'biometric' && now() < retryAt) return { ok: false, error: 'Tunggu ' + Math.ceil((retryAt - now()) / 1000) + ' detik sebelum mencoba lagi.' };
  busy = true; const started = epoch;
  try {
   let authenticated = !record.credential;
   if (type === 'biometric') {
    try { if (await promptBiometric() !== true) throw Error("Not verified"); authenticated = true; } catch { return { ok: false, error: 'Autentikasi perangkat dibatalkan atau belum cocok. Coba lagi atau gunakan password DuoChat.' }; }
   } else if (record.credential) authenticated = await matches(type === 'unlock' ? input.password : input.currentPassword, record.credential);
   if (epoch !== started) return { ok: false, error: 'Status kunci berubah. Silakan coba lagi.' };
   if (!authenticated) {
    failures++; retryAt = now() + Math.min(30000, 1000 * 2 ** Math.min(failures - 1, 5));
    return { ok: false, error: 'Password belum cocok. Tunggu sebentar lalu coba lagi.' };
   }
   failures = 0; retryAt = 0;
   if (type === 'unlock' || type === 'biometric') { locked = false; epoch++; changed(); return { ok: true }; }
   if (type === 'disable') { commit(defaults()); return { ok: true }; }
   if ((!record.credential || input.newPassword) && !validPassword(input.newPassword)) return { ok: false, error: 'Password minimal 8 karakter, maksimal 1024 byte.' };
   if (input.newPassword !== input.confirmPassword) return { ok: false, error: 'Ulangi password yang sama.' };
   const credential = input.newPassword ? await makeCredential(input.newPassword) : record.credential;
   if (epoch !== started || locked) return { ok: false, error: 'Status kunci berubah. Silakan coba lagi.' };
   const enablingBiometric = input.biometric === true && !record.biometric;
   if (enablingBiometric) {
    if (!available() || !promptBiometric) return { ok: false, error: 'Autentikasi perangkat belum tersedia. Aktifkan di pengaturan komputer atau gunakan password DuoChat.' };
    try { if (await promptBiometric() !== true) throw Error('Not verified'); }
    catch { return { ok: false, error: 'Aktivasi biometrik dibatalkan atau belum cocok. Pengaturan belum berubah.' }; }
   }
   if (epoch !== started || locked) return { ok: false, error: 'Status kunci berubah. Silakan coba lagi.' };
   commit(readPrivacy({ credential, lockOnStart: input.lockOnStart !== false, lockOnOS: input.lockOnOS !== false, idleMinutes: input.idleMinutes, biometric: input.biometric === true, biometricOnStart: input.biometricOnStart === true }));
   return { ok: true };
  } catch { return { ok: false, error: 'Pengaturan privasi belum berhasil disimpan. Coba lagi.' }; }
  finally { busy = false; }
 }
 return { snapshot, action, lock, concealed, systemLock: () => { if (record.lockOnOS) lock(); }, idle: seconds => { if (!locked && record.idleMinutes && seconds >= record.idleMinutes * 60) lock(); } };
}
module.exports = { createPrivacy, readPrivacy, defaults, makeCredential, matches };
