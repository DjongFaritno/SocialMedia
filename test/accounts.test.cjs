const { test } = require('node:test');
const assert = require('node:assert/strict');
const { accountState, partition, switchAccount, liveAccounts, SERVICES } = require('../src/accounts.cjs');
const { cleanSettings, trusted } = require('../src/core.cjs');
const second = 'account-12345678-1234-1234-1234-123456789abc';
test('legacy upgrade preserves sessions and explicit permission choices', () => {
 const settings = cleanSettings({ permissions: { whatsapp: true, telegram: false }, ratio: .7, theme: 'dark' });
 assert.deepEqual(settings.slots, { left: 'whatsapp', right: 'telegram' });
 assert.equal(partition(settings.accounts[0]), 'persist:whatsapp'); assert.equal(partition(settings.accounts[1]), 'persist:telegram');
 assert.equal(settings.accounts[0].permissions, true); assert.equal(settings.accounts[1].permissions, false);
 assert.equal(settings.theme, 'dark'); assert.equal(settings.ratio, .7);
 assert.deepEqual(cleanSettings(JSON.parse(JSON.stringify(settings))), settings);
});
test('duplicate WhatsApp accounts have separate immutable profiles and per-account permissions', () => {
 const settings = cleanSettings(); settings.accounts.push({ id: second, service: 'whatsapp', name: 'Toko', keepActive: false, permissions: false });
 assert.notEqual(partition(settings.accounts[0]), partition(settings.accounts[2]));
 switchAccount(settings, 'right', second); assert.deepEqual(settings.slots, { left: 'whatsapp', right: second });
 assert.deepEqual(liveAccounts(settings).map(item => item.id), ['whatsapp', second]);
 switchAccount(settings, 'left', second); assert.deepEqual(settings.slots, { left: second, right: 'whatsapp' });
 settings.accounts[1].keepActive = true; assert.equal(liveAccounts(settings).length, 3);
 assert.equal(switchAccount(settings, 'bogus', second), false); assert.equal(switchAccount(settings, 'right', 'missing'), false);
});
test('malformed settings cannot change legacy partitions or introduce arbitrary origins', () => {
 const settings = cleanSettings({ schema: 2, accounts: [null, { id: '../escape', service: 'whatsapp' }, { id: 'whatsapp', service: 'x' }, { id: second, service: 'evil', permissions: true }], slots: { left: '../escape', right: '../escape' }, permissions: { whatsapp: true } });
 assert.equal(settings.accounts.length, 2); assert.equal(settings.accounts[0].permissions, false);
 assert.throws(() => partition({ id: '../escape', service: 'whatsapp' }));
 const one = accountState({ accounts: [{ id: second, service: 'x', name: ' ', keepActive: 'true', permissions: 'true' }, { id: second, service: 'x' }], slots: { left: second, right: second } });
 assert.equal(one.accounts.length, 2); assert.notEqual(one.slots.left, one.slots.right);
 assert.equal(one.accounts[0].keepActive, false); assert.equal(one.accounts[0].permissions, false);
});
test('every provider trusts only its declared HTTPS navigation origins', () => {
 for (const [service, config] of Object.entries(SERVICES)) {
  for (const origin of config.origins) {
   assert.equal(trusted(service, origin + '/login'), true);
   for (const url of [origin.replace('https:', 'http:'), origin + '.evil.test', origin + '@evil.test', 'javascript:alert(1)']) assert.equal(trusted(service, url), false);
  }
 }
 assert.equal(trusted('unknown', 'https://x.com'), false);
});

test('four additional services persist independent profiles without altering legacy sessions', () => {
 const profiles=['messenger','facebook','googlechat','wechat'].map((service,i)=>({id:'account-00000000-0000-4000-8000-00000000000'+i,service,name:service}));
 const state=accountState({schema:2,accounts:profiles,slots:{left:profiles[0].id,right:profiles[1].id}});
 assert.equal(state.accounts.length,4);
 assert.deepEqual(accountState(JSON.parse(JSON.stringify(state))),state);
 assert.equal(new Set(state.accounts.map(partition)).size,4);
 assert.equal(SERVICES.messenger.url,'https://www.facebook.com/messages/');
 assert.equal(SERVICES.googlechat.url,'https://chat.google.com/');
});
