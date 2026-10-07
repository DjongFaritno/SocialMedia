const { test } = require('node:test');
const assert = require('node:assert/strict');
const { trusted, ratio, layout, cleanSettings, browserUserAgent } = require('../src/core.cjs');
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

test('browser identity keeps real Chromium version and platform without Electron tokens', () => {
  for (const platform of ['X11; Linux x86_64', 'Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7']) {
    const chrome = `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.1.2 Safari/537.36`;
    const electron = chrome.replace(' Chrome/', ' duochat-desktop/0.1.1 Chrome/') + ' Electron/44.6.0';
    assert.equal(browserUserAgent(electron), chrome);
    assert.equal(browserUserAgent(chrome), chrome);
  }
});

test('hiding the header gives both services 80 extra pixels without shifting the split', () => {
  const normal = layout(1440, 900, .65);
  const hidden = layout(1440, 900, .65, true);
  for (const id of ['whatsapp', 'telegram']) {
    assert.equal(hidden[id].y, 56);
    assert.equal(hidden[id].height, normal[id].height + 80);
    assert.equal(hidden[id].x, normal[id].x);
    assert.equal(hidden[id].width, normal[id].width);
    assert.equal(hidden[id].y + hidden[id].height, 860);
  }
  assert.equal(cleanSettings({ hideHeader: true }).hideHeader, true);
  assert.equal(cleanSettings({ hideHeader: 'true' }).hideHeader, false);
});

test('theme preference survives settings loading and invalid values return to auto', () => {
  for (const theme of ['auto', 'light', 'dark']) assert.equal(cleanSettings({ theme }).theme, theme);
  for (const theme of ['white', 'invalid', true, null]) assert.equal(cleanSettings({ theme }).theme, 'auto');
});
