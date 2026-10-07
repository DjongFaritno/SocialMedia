const { test } = require('node:test');
const assert = require('node:assert/strict');
const { trusted, ratio, layout, cleanSettings } = require('../src/core.cjs');
test('only exact HTTPS service origins are trusted', () => {
  assert.equal(trusted('whatsapp', 'https://web.whatsapp.com/'), true);
  assert.equal(trusted('telegram', 'https://web.telegram.org/a/'), true);
  for (const url of ['http://web.whatsapp.com', 'https://web.whatsapp.com.evil.test', 'https://web.whatsapp.com@evil.test', 'file:///tmp/a', 'javascript:alert(1)', 'garbage']) assert.equal(trusted('whatsapp', url), false);
});
test('layout stays within content bounds at different widths and ratios', () => {
  for (const width of [1000, 1440, 2560]) for (const r of [.3, .65, .75]) {
    const p = layout(width, 900, r);
    assert.equal(p.whatsapp.x + p.whatsapp.width + 12, p.telegram.x);
    assert.equal(p.telegram.x + p.telegram.width, width - 16);
    assert.equal(p.whatsapp.y + p.whatsapp.height, 860);
    assert.ok(p.whatsapp.width > 0 && p.telegram.width > 0);
  }
});
test('corrupted settings fail closed for permissions and clamp dimensions', () => {
  const s = cleanSettings({ ratio: NaN, width: -40, height: 1e8, permissions: { whatsapp: 'true', telegram: true } });
  assert.equal(s.ratio, .65); assert.equal(s.width, 1000); assert.equal(s.height, 2000);
  assert.deepEqual(s.permissions, { whatsapp: false, telegram: true });
  assert.equal(ratio(-10), .3); assert.equal(ratio(99), .75);
});
