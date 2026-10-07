const { test } = require('node:test');
const assert = require('node:assert/strict');
const { servicePermitted, nativeMediaGate } = require('../src/permissions.cjs');

test('media and notifications require an enabled service and exact trusted origins', () => {
  for (const id of ['whatsapp', 'telegram']) {
    const url = id === 'whatsapp' ? 'https://web.whatsapp.com/' : 'https://web.telegram.org/a/';
    for (const permission of ['media', 'notifications']) {
      assert.equal(servicePermitted(id, true, permission, url, url), true);
      assert.equal(servicePermitted(id, false, permission, url, url), false);
      assert.equal(servicePermitted(id, true, permission, 'https://example.com/', url), false);
      assert.equal(servicePermitted(id, true, permission, url, 'https://example.com/'), false);
      assert.equal(servicePermitted(id, true, permission, url, 'https://web.whatsapp.com.evil.test/'), false);
    }
    assert.equal(servicePermitted(id, true, 'geolocation', url, url), false);
  }
});

test('concurrent microphone requests share one OS dialog and do not prompt again after an answer', async () => {
  let calls = 0, release;
  const gate = nativeMediaGate('darwin', {
    getMediaAccessStatus: () => 'not-determined',
    askForMediaAccess: () => { calls++; return new Promise(resolve => { release = resolve; }); }
  });
  const a = gate.requestTypes(['audio']), b = gate.requestTypes(['audio']);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release(true);
  assert.deepEqual(await Promise.all([a, b]), [true, true]);
  assert.equal(await gate.requestTypes(['audio']), true);
  assert.equal(calls, 1);
});

test('camera and microphone are independent; denied camera does not block audio-only calls', async () => {
  const requests = [];
  const gate = nativeMediaGate('darwin', {
    getMediaAccessStatus: kind => kind === 'camera' ? 'denied' : 'not-determined',
    askForMediaAccess: async kind => { requests.push(kind); return true; }
  });
  assert.equal(await gate.requestTypes(['audio']), true);
  assert.equal(await gate.requestTypes(['audio', 'video']), false);
  assert.equal(gate.check('camera'), false);
  assert.deepEqual(requests, ['microphone']);
});

test('revocation is honored even after an earlier grant and OS settings can restore access', async () => {
  let state = 'not-determined', calls = 0;
  const gate = nativeMediaGate('darwin', {
    getMediaAccessStatus: () => state,
    askForMediaAccess: async () => { calls++; return true; }
  });
  assert.equal(await gate.request('microphone'), true);
  state = 'denied';
  assert.equal(gate.check('microphone'), false);
  assert.equal(await gate.request('microphone'), false);
  state = 'granted';
  assert.equal(await gate.request('microphone'), true);
  assert.equal(calls, 1);
});

test('denial, restrictions and failures do not cause repeat OS prompts', async () => {
  for (const status of ['denied', 'restricted', 'unknown', 'not-determined']) {
    let calls = 0;
    const gate = nativeMediaGate('darwin', {
      getMediaAccessStatus: () => status,
      askForMediaAccess: async () => { calls++; return false; }
    });
    assert.equal(await gate.request('camera'), false);
    assert.equal(await gate.request('camera'), false);
    assert.equal(calls, status === 'not-determined' ? 1 : 0);
  }
  const gate = nativeMediaGate('darwin', {
    getMediaAccessStatus: () => 'not-determined',
    askForMediaAccess: async () => { throw Error('TCC unavailable'); }
  });
  assert.equal(await gate.request('microphone'), false);
  assert.equal(gate.check('microphone'), false);
});

test('both media devices are handled and non-macOS never invokes macOS APIs', async () => {
  const requests = [];
  const gate = nativeMediaGate('darwin', {
    getMediaAccessStatus: () => 'not-determined',
    askForMediaAccess: async kind => { requests.push(kind); return true; }
  });
  assert.equal(await gate.requestTypes(['audio', 'video']), true);
  assert.deepEqual(requests, ['microphone', 'camera']);
  assert.equal(await gate.requestTypes([]), false);
  assert.equal(await gate.requestTypes(['screen']), false);
  for (const platform of ['linux', 'win32']) {
    const local = nativeMediaGate(platform, {});
    assert.equal(await local.requestTypes(['audio', 'video']), true);
  }
});
