const { app, session, BrowserWindow, webContents } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { SERVICES } = require('../src/core.cjs');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'duochat-instance-smoke-'));
app.setPath('userData', profile);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let secondLaunches = 0, child;
app.on('second-instance', () => secondLaunches++);
const deadline = setTimeout(() => { child?.kill(); console.error('Single-instance test timed out'); app.exit(1); }, 20000);
app.whenReady().then(async () => {
  for (const [id, service] of Object.entries(SERVICES)) {
    await session.fromPartition(`persist:${id}`).protocol.handle('https', request =>
      new URL(request.url).origin === new URL(service.url).origin
        ? new Response('<!doctype html><title>Offline instance fixture</title>', { headers: { 'Content-Type': 'text/html' } })
        : new Response('Blocked', { status: 403 }));
  }
  require('../src/main.cjs');
  const limit = Date.now() + 8000;
  while (webContents.getAllWebContents().length !== 3 || webContents.getAllWebContents().some(item => item.isLoading())) {
    if (Date.now() > limit) throw new Error('Primary application did not become ready');
    await sleep(50);
  }
  const before = webContents.getAllWebContents().map(item => item.id).sort();
  const main = BrowserWindow.getAllWindows()[0];
  main.hide();
  const launcher = path.join(profile, 'second-launch.cjs');
  fs.writeFileSync(launcher, `const {app}=require('electron');\napp.setPath('userData',${JSON.stringify(profile)});\napp.on('browser-window-created',()=>app.exit(3));\nrequire(${JSON.stringify(path.join(__dirname, '../src/main.cjs'))});\nsetTimeout(()=>app.exit(4),8000);\n`);
  const flags = process.argv.filter(value => ['--no-sandbox', '--disable-gpu'].includes(value));
  child = spawn(process.execPath, [launcher, ...flags], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  assert.equal(code, 0, `Secondary must quit before creating windows: ${stderr}`);
  await sleep(200);
  assert.equal(secondLaunches, 1);
  assert.deepEqual(webContents.getAllWebContents().map(item => item.id).sort(), before);
  assert.equal(BrowserWindow.getAllWindows().length, 1);
  assert.equal(main.isVisible(), true, 'Existing hidden window must be shown again');
  console.log('SINGLE INSTANCE PASS: second launch exits, existing window shown, same two service views and shell');
  clearTimeout(deadline);
  app.exit(0);
}).catch(error => { console.error(error); child?.kill(); app.exit(1); });
