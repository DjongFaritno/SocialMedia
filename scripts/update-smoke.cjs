// Real electron-updater download/hash pipeline against an offline local server.
// Fixture bytes are never executed or installed; no personal profile is used.
const { app } = require('electron');
const { AppImageUpdater } = require('electron-updater');
const { ElectronHttpExecutor } = require('electron-updater/out/electronHttpExecutor');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { createUpdates } = require('../src/updates.cjs');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'duochat-update-smoke-'));
app.setPath('userData', profile);
const version = '0.1.11';
const payload = Buffer.alloc(64 * 1024, 'local updater fixture, never execute');
const filename = `DuoChat-${version}.AppImage`;
const metadata = { version, files: [{ url: filename, size: payload.length, sha512: crypto.createHash('sha512').update(payload).digest('base64') }], releaseDate: new Date().toISOString() };
const names = [`DuoChat-${version}-Windows-x64-Setup.exe`, `DuoChat-${version}-macOS-universal.dmg`, `DuoChat-${version}-macOS-universal.zip`, filename,
  `duochat-desktop_${version}_amd64.deb`, 'install-fedora.sh', 'SHA256SUMS.txt', 'latest.yml', 'latest-mac.yml', 'latest-linux.yml'];
const release = { tag_name: 'v' + version, published_at: '2026-10-09', assets: names.map(name => ({ name, state: 'uploaded', size: 100,
  browser_download_url: `https://github.com/DjongFaritno/SocialMedia/releases/download/v${version}/${name}` })) };
let server, corrupt = false, installed = 0;
const timeout = setTimeout(() => { console.error('Updater smoke timed out'); server?.close(); app.exit(1); }, 20000);
app.whenReady().then(async () => {
  server = http.createServer((request, response) => {
    if (request.url.split('?')[0] === '/latest-linux.yml') { response.end(JSON.stringify(metadata)); return; }
    if (request.url.split('?')[0] === '/' + filename) {
      response.setHeader('Content-Length', payload.length);
      response.end(corrupt ? Buffer.alloc(payload.length, 'wrong bytes') : payload); return;
    }
    response.writeHead(404); response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.APPIMAGE = path.join(profile, 'old-fixture.AppImage');
  fs.writeFileSync(process.env.APPIMAGE, 'never execute');
  for (const damaged of [false, true]) {
    corrupt = damaged;
    const directory = path.join(profile, damaged ? 'bad' : 'good'); fs.mkdirSync(directory);
    const config = path.join(directory, 'app-update.yml');
    fs.writeFileSync(config, 'updaterCacheDirName: local-update-fixture\n');
    const adapter = { version: '0.1.10', name: 'duochat-update-fixture', isPackaged: true, userDataPath: directory,
      baseCachePath: directory, appUpdateConfigPath: config, whenReady: async () => {}, onQuit: () => {},
      quit: () => { installed++; }, relaunch: () => { installed++; } };
    const native = new AppImageUpdater(null, adapter);
    native.httpExecutor = new ElectronHttpExecutor(() => {});
    native.logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };
    const setFeed = native.setFeedURL.bind(native);
    native.setFeedURL = feed => {
      assert.equal(feed.url, `https://github.com/DjongFaritno/SocialMedia/releases/download/v${version}/`);
      setFeed({ ...feed, url: `http://127.0.0.1:${server.address().port}/` });
    };
    const updates = createUpdates({ app: { isPackaged: true, getVersion: () => '0.1.10' }, platform: 'linux', arch: 'x64', appImage: process.env.APPIMAGE,
      net: { fetch: async () => new Response(JSON.stringify([release])) }, getSettings: () => ({ autoDownloadUpdates: true }),
      dialog: { showMessageBox: async () => { throw new Error('Background updates must not open a dialog'); } }, shell: {},
      getWindow: () => null, save: () => {}, notify: () => {}, engineFactory: () => native });
    await updates.check(false);
    assert.equal(updates.snapshot().phase, damaged ? 'error' : 'ready');
    assert.equal(installed, 0, 'Downloaded update must never install without user action');
    updates.stop();
  }
  console.log('UPDATE DOWNLOAD PASS: real provider metadata, SHA-512 checked download, corrupted bytes rejected, no automatic install');
  server.close(); clearTimeout(timeout); app.exit(0);
}).catch(error => { console.error(error); server?.close(); app.exit(1); });
