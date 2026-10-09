const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { latestRelease, compare, updateMode, RELEASES_API } = require('../src/update-core.cjs');
const { createUpdates } = require('../src/updates.cjs');
const { cleanSettings } = require('../src/core.cjs');
function release(version) {
  const names = [`DuoChat-${version}-Windows-x64-Setup.exe`, `DuoChat-${version}-macOS-universal.dmg`, `DuoChat-${version}-macOS-universal.zip`,
    `DuoChat-${version}.AppImage`, `duochat-desktop_${version}_amd64.deb`, 'install-fedora.sh', 'SHA256SUMS.txt', 'latest.yml', 'latest-mac.yml', 'latest-linux.yml'];
  return { tag_name: 'v' + version, published_at: '2026-10-09', prerelease: true, assets: names.map(name => ({ name, size: 100, state: 'uploaded', browser_download_url: `https://github.com/DjongFaritno/SocialMedia/releases/download/v${version}/${name}` })) };
}
test('selects numeric newest complete published release, including GitHub prereleases', () => {
  const newer = release('0.1.12'); newer.assets.pop();
  const draft = release('0.1.20'); draft.draft = true;
  const unsafe = release('0.1.30'); unsafe.assets[0].browser_download_url = 'https://evil.test/setup.exe';
  assert.equal(latestRelease([release('0.1.9'), release('0.1.11'), newer, draft, unsafe]).version, '0.1.11');
  assert.equal(compare('0.1.10', '0.1.9'), 1);
  assert.equal(latestRelease([newer, draft, unsafe]), null);
});
test('auto install only supported packages; old settings enable checks but not large automatic downloads', () => {
  for (const platform of ['darwin', 'linux']) assert.equal(updateMode({ packaged: true, platform, arch: 'x64' }), 'manual');
  assert.equal(updateMode({ packaged: true, platform: 'linux', arch: 'x64', appImage: '/tmp/app.AppImage' }), 'native');
  assert.equal(updateMode({ packaged: true, platform: 'win32', arch: 'x64' }), 'native');
  assert.equal(updateMode({ packaged: false, platform: 'win32', arch: 'x64' }), 'development');
  assert.equal(cleanSettings().autoCheckUpdates, true);
  assert.equal(cleanSettings().autoDownloadUpdates, false);
  assert.equal(cleanSettings({ autoCheckUpdates: false, autoDownloadUpdates: true }).autoDownloadUpdates, true);
});
function fixture({ platform = 'win32', autoDownload = false, response = [release('0.1.11')], current = '0.1.10' } = {}) {
  const engine = new EventEmitter();
  const calls = { checks: 0, downloads: 0, installs: 0, saves: 0, links: [], dialogs: [] };
  let choice = 0;
  engine.setFeedURL = feed => { calls.feed = feed; };
  engine.checkForUpdates = async () => ({ updateInfo: { version: '0.1.11' } });
  engine.downloadUpdate = async () => { calls.downloads++; engine.emit('download-progress', { percent: 46 }); engine.emit('update-downloaded', { version: '0.1.11' }); };
  engine.quitAndInstall = () => { calls.installs++; };
  const settings = { autoCheckUpdates: true, autoDownloadUpdates: autoDownload };
  const updates = createUpdates({ app: { isPackaged: true, getVersion: () => current }, platform, arch: 'x64', appImage: undefined,
    net: { fetch: async url => { assert.equal(url, RELEASES_API); calls.checks++; return new Response(JSON.stringify(response)); } },
    dialog: { showMessageBox: async (_window, options) => { calls.dialogs.push(options); return { response: choice }; } },
    shell: { openExternal: async link => calls.links.push(link) }, getWindow: () => null, getSettings: () => settings,
    save: () => calls.saves++, notify: () => {}, engineFactory: () => engine });
  return { updates, engine, calls, settings, choose: value => { choice = value; } };
}
test('automatic check stays quiet and does not download without preference; reentrant checks deduplicated', async () => {
  const f = fixture(); await Promise.all([f.updates.check(), f.updates.check()]);
  assert.equal(f.calls.checks, 1); assert.equal(f.calls.downloads, 0); assert.equal(f.calls.dialogs.length, 0);
  assert.equal(f.updates.snapshot().phase, 'available');
});
test('automatic download waits for explicit install; no installation on quit; cancellation retains downloaded state', async () => {
  const f = fixture({ autoDownload: true }); await f.updates.check();
  assert.equal(f.calls.downloads, 1); assert.equal(f.updates.snapshot().phase, 'ready');
  assert.equal(f.engine.autoInstallOnAppQuit, false); assert.equal(f.engine.allowDowngrade, false);
  assert.equal(f.calls.installs, 0);
  await f.updates.action('install'); assert.equal(f.calls.installs, 0);
  f.choose(1); await f.updates.action('install'); assert.equal(f.calls.installs, 1); assert.equal(f.calls.saves, 1);
  assert.ok(f.calls.feed.url.endsWith('/v0.1.11/'));
});
test('macOS offers verified release link without invoking native installer', async () => {
  const f = fixture({ platform: 'darwin', autoDownload: true }); await f.updates.check();
  assert.equal(f.calls.downloads, 0); await f.updates.action('download');
  assert.deepEqual(f.calls.links, ['https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.11']);
  assert.equal(f.calls.installs, 0);
});
test('rejects mismatched feed version before downloading and recovers on next check', async () => {
  const f = fixture(); await f.updates.check();
  f.engine.checkForUpdates = async () => ({ updateInfo: { version: '0.1.9' } });
  await f.updates.action('download'); assert.equal(f.calls.downloads, 0); assert.equal(f.updates.snapshot().phase, 'error');
  await f.updates.check(); assert.equal(f.updates.snapshot().phase, 'available');
});
test('never downgrades; unknown IPC action has no side effects', async () => {
  const f = fixture({ current: '0.1.12' }); await f.updates.check();
  assert.equal(f.updates.snapshot().phase, 'current'); await f.updates.action('anything');
  assert.equal(f.calls.downloads, 0); assert.equal(f.calls.installs, 0);
});
