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
 let resolve, reject, first = true;
 const p = createPrivacy({ canBiometric: () => true, promptBiometric: () => first ? (first = false, Promise.resolve(true)) : new Promise((yes, no) => { resolve = yes; reject = no; }) });
 await p.action('save', setup({ biometric: true })); p.lock();
 const canceled = p.action('biometric'); reject(Error('canceled')); assert.equal((await canceled).ok, false); assert.equal(p.snapshot().locked, true);
 const pending = p.action('biometric'); assert.equal((await p.action('unlock', { password })).ok, false, 'Concurrent attempts rejected');
 p.systemLock(); resolve(true); assert.equal((await pending).ok, false); assert.equal(p.snapshot().locked, true);
 const accepted = p.action('biometric'); resolve(true); assert.equal((await accepted).ok, true); assert.equal(p.snapshot().locked, false);
});
test('unsupported biometric providers never authenticate or enable the option', async () => {
 const p = createPrivacy(); assert.equal((await p.action('save', setup({ biometric: true }))).ok, false); assert.equal(p.snapshot().configured, false);
 await p.action('save', setup()); p.lock();
 assert.equal(p.snapshot().biometric, false); assert.equal((await p.action('biometric')).ok, false);
 assert.equal((await p.action('save', setup({ currentPassword: password }))).ok, false);
 assert.equal((await p.action('unlock', { password })).ok, true);
});

test('enrollment requires password and device verification; cancellation and persistence failure leave preference unchanged', async () => {
 let verified = false, failDisk = false, disk;
 const p = createPrivacy({ canBiometric: () => true, promptBiometric: async () => { if (!verified) throw Error('canceled'); return true; }, persist: next => { if(failDisk) throw Error('disk'); disk=next; } });
 assert.equal((await p.action('save',setup({biometric:true,biometricOnStart:true}))).ok,false);
 assert.equal(p.snapshot().configured,false);
 await p.action('save',setup());
 assert.equal((await p.action('save',setup({currentPassword:password,newPassword:'',confirmPassword:'',biometric:true}))).ok,false);
 assert.equal(p.snapshot().biometric,false);
 verified=true; failDisk=true;
 assert.equal((await p.action('save',setup({currentPassword:password,newPassword:'',confirmPassword:'',biometric:true}))).ok,false);
 assert.equal(p.snapshot().biometric,false);
 failDisk=false;
 assert.equal((await p.action('save',setup({currentPassword:password,newPassword:'',confirmPassword:'',biometric:true,biometricOnStart:true}))).ok,true);
 assert.equal(disk.biometricOnStart,true);
 const restarted=createPrivacy({record:disk,canBiometric:()=>true,promptBiometric:async()=>true});
 assert.equal(restarted.snapshot().locked,true);
 assert.equal((await restarted.action('biometric')).ok,true);
});
test('a resolved false cannot enroll or unlock, and old settings never opt into automatic startup prompts', async () => {
 const p=createPrivacy({canBiometric:()=>true,promptBiometric:async()=>false});
 assert.equal((await p.action('save',setup({biometric:true}))).ok,false);
 const record={...defaults(),credential:await makeCredential(password),biometric:true};
 assert.equal(readPrivacy(record).biometricOnStart,false);
 const old=createPrivacy({record,canBiometric:()=>true,promptBiometric:async()=>false});
 assert.equal((await old.action('biometric')).ok,false);assert.equal(old.snapshot().locked,true);
 assert.equal(readPrivacy({...record,lockOnStart:false,biometricOnStart:true}).biometricOnStart,false);
 assert.equal(readPrivacy({...record,biometric:false,biometricOnStart:true}).biometricOnStart,false);
});
test('system lock during enrollment rejects stale verification', async () => {
 let finish;
 const p=createPrivacy({canBiometric:()=>true,promptBiometric:()=>new Promise(resolve=>{finish=resolve;})});
 await p.action('save',setup());
 const pending=p.action('save',setup({currentPassword:password,newPassword:'',confirmPassword:'',biometric:true}));
 while(!finish) await new Promise(resolve=>setImmediate(resolve));
 p.systemLock();finish(true);assert.equal((await pending).ok,false);assert.equal(p.snapshot().biometric,false);assert.equal(p.snapshot().locked,true);
});

test('OS lock invalidates device enrollment during the first password setup too',async()=>{
 let finish;
 const p=createPrivacy({canBiometric:()=>true,promptBiometric:()=>new Promise(resolve=>{finish=resolve;})});
 const pending=p.action('save',setup({biometric:true}));
 while(!finish) await new Promise(resolve=>setImmediate(resolve));
 p.systemLock();finish(true);
 assert.equal((await pending).ok,false);assert.equal(p.snapshot().configured,false);assert.equal(p.snapshot().biometric,false);
});
