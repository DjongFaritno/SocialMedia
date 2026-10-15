const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPrivacy, readPrivacy, defaults, makeCredential, matches } = require('../src/privacy.cjs');
const password = 'kopi-sore-123';
const setup = (extra = {}) => ({ newPassword: password, confirmPassword: password, lockOnStart: true, lockOnOS: true, ...extra });
test('privacy defaults leave existing installs unlocked, with independent panel covers', async () => {
 const p = createPrivacy();
 assert.equal(p.snapshot().configured, false); assert.equal(p.lock(), false);
 assert.equal((await p.action('cover', { side: 'left' })).ok, true);
 assert.equal(p.concealed('left'), true); assert.equal(p.concealed('right'), false);
 assert.equal((await p.action('cover', { side: '__proto__' })).ok, false);
});
test('salted scrypt verifies exact passwords without exposing verifier to UI', async () => {
 const a = await makeCredential(password), b = await makeCredential(password);
 assert.notEqual(a.hash, b.hash); assert.notEqual(a.salt, b.salt);
 assert.equal(await matches(password, a), true); assert.equal(await matches(password + ' ', a), false);
 assert.equal(await matches('x'.repeat(1025), a), false);
 let disk;
 const p = createPrivacy({ persist: next => { disk = structuredClone(next); } });
 assert.equal((await p.action('save', setup())).ok, true);
 const text = JSON.stringify(p.snapshot()); assert.ok(!text.includes(a.hash) && !text.includes('credential'));
 assert.ok(!JSON.stringify(disk).includes(password));
 const restarted = createPrivacy({ record: disk }); assert.equal(restarted.snapshot().locked, true);
 assert.equal((await restarted.action('unlock', { password })).ok, true);
});
test('failed passwords are throttled and settings changes require current password', async () => {
 let clock = 100, disk; const p = createPrivacy({ now: () => clock, persist: next => { disk = next; } });
 await p.action('save', setup()); p.lock();
 assert.equal((await p.action('unlock', { password: 'wrong' })).ok, false);
 assert.equal((await p.action('unlock', { password })).ok, false);
 clock += 1001; assert.equal((await p.action('unlock', { password })).ok, true);
 assert.equal((await p.action('disable', {})).ok, false); assert.ok(disk.credential);
 clock += 1001;
 assert.equal((await p.action('save', setup({ currentPassword: password, newPassword: 'replaced-123', confirmPassword: 'replaced-123' }))).ok, true);
 assert.equal(await matches(password, disk.credential), false);
 assert.equal((await p.action('disable', { currentPassword: 'replaced-123' })).ok, true);
 assert.equal(disk.credential, null); assert.equal(p.lock(), false);
});
test('invalid credentials fail closed and persistence errors cannot turn off a lock', async () => {
 for (const raw of [null, [], {}, { credential: {} }, { credential: { algorithm: 'scrypt-v1', salt: 'no', hash: 'bad' } }]) assert.throws(() => readPrivacy(raw));
 let fail = false; const p = createPrivacy({ persist: () => { if (fail) throw Error('disk full'); } });
 await p.action('save', setup()); fail = true;
 assert.equal((await p.action('disable', { currentPassword: password })).ok, false);
 assert.equal(p.snapshot().configured, true); p.lock(); assert.equal(p.snapshot().locked, true);
});
test('minimum password and confirmation are enforced before enabling', async () => {
 const p = createPrivacy();
 assert.equal((await p.action('save', setup({ newPassword: 'short', confirmPassword: 'short' }))).ok, false);
 assert.equal((await p.action('save', setup({ confirmPassword: 'different' }))).ok, false);
 assert.equal(p.snapshot().configured, false);
});
test('idle/system locks respect policy and panel covers survive unlock', async () => {
 const p = createPrivacy(); await p.action('save', setup({ idleMinutes: 1 }));
 await p.action('cover', { side: 'right' }); p.idle(59); assert.equal(p.snapshot().locked, false);
 p.idle(60); assert.equal(p.snapshot().locked, true);
 assert.equal((await p.action('cover', { side: 'left' })).ok, false);
 await p.action('unlock', { password }); assert.equal(p.concealed('right'), true);
 p.systemLock(); assert.equal(p.snapshot().locked, true); await p.action('unlock', { password });
 await p.action('save', setup({ currentPassword: password, newPassword: '', confirmPassword: '', lockOnStart: false, lockOnOS: false }));
 p.systemLock(); p.idle(3600); assert.equal(p.snapshot().locked, false);
});
test('Touch ID cancellation fails closed and a fresh system lock invalidates pending success', async () => {
 let resolve, reject;
 const p = createPrivacy({ canBiometric: () => true, promptBiometric: () => new Promise((yes, no) => { resolve = yes; reject = no; }) });
 await p.action('save', setup({ biometric: true })); p.lock();
 const canceled = p.action('biometric'); reject(Error('canceled')); assert.equal((await canceled).ok, false); assert.equal(p.snapshot().locked, true);
 const pending = p.action('biometric'); assert.equal((await p.action('unlock', { password })).ok, false, 'Concurrent attempts rejected');
 p.systemLock(); resolve(); assert.equal((await pending).ok, false); assert.equal(p.snapshot().locked, true);
 const accepted = p.action('biometric'); resolve(); assert.equal((await accepted).ok, true); assert.equal(p.snapshot().locked, false);
});
test('unsupported biometric providers never authenticate or enable the option', async () => {
 const p = createPrivacy(); await p.action('save', setup({ biometric: true })); p.lock();
 assert.equal(p.snapshot().biometric, false); assert.equal((await p.action('biometric')).ok, false);
 assert.equal((await p.action('save', setup({ currentPassword: password }))).ok, false);
 assert.equal((await p.action('unlock', { password })).ok, true);
});
