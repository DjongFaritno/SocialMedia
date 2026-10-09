// Audit the real DuoChat shell with two offline, minimal service fixtures.
// No account, personal profile, remote requests or production settings are used.
// Run: electron scripts/memory-audit.cjs --output=/absolute/path/report.json
const { app, BrowserWindow, session, webContents } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { SERVICES } = require('../src/core.cjs');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'duochat-memory-audit-'));
app.setPath('userData', profile);
const outputArg = process.argv.find(value => value.startsWith('--output='));
const output = path.resolve(outputArg ? outputArg.slice('--output='.length) : 'artifacts/memory-audit.json');
const started = Date.now();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const snapshots = [];
let deadline;

function label(contents) {
  const url = contents.getURL();
  if (url.startsWith('https://web.whatsapp.com/')) return 'whatsapp-fixture';
  if (url.startsWith('https://web.telegram.org/')) return 'telegram-fixture';
  if (url.endsWith('/about.html')) return 'about';
  if (url.endsWith('/index.html')) return 'shell';
  return 'other';
}

// Linux PSS apportions shared pages rather than counting them once per process.
// Include Chromium's zygotes, which app.getAppMetrics() does not enumerate.
function linuxTreeMemory() {
  if (process.platform !== 'linux') return null;
  const parents = new Map();
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const stat = fs.readFileSync(`/proc/${entry}/stat`, 'utf8');
      parents.set(Number(entry), Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]));
    } catch { /* Processes can exit during a snapshot. */ }
  }
  const members = new Set([process.pid]);
  let previous;
  do {
    previous = members.size;
    for (const [pid, parent] of parents) if (members.has(parent)) members.add(pid);
  } while (members.size !== previous);
  const processes = [];
  for (const pid of members) {
    try {
      const rollup = fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8');
      processes.push({ pid, rssKiB: Number(rollup.match(/^Rss:\s+(\d+)/m)[1]), pssKiB: Number(rollup.match(/^Pss:\s+(\d+)/m)[1]) });
    } catch { /* Missing/unreadable entries are reported, not treated as zero. */ }
  }
  return {
    expectedProcessCount: members.size,
    measuredProcessCount: processes.length,
    complete: processes.length === members.size,
    rssKiB: processes.reduce((total, item) => total + item.rssKiB, 0),
    pssKiB: processes.reduce((total, item) => total + item.pssKiB, 0),
    processes
  };
}

function snapshot(phase) {
  const contents = webContents.getAllWebContents().filter(item => !item.isDestroyed());
  const labels = new Map();
  for (const item of contents) {
    const pid = item.getOSProcessId();
    labels.set(pid, [...(labels.get(pid) || []), label(item)]);
  }
  const metrics = app.getAppMetrics().map(item => ({
    pid: item.pid, type: item.type, name: item.name || '',
    labels: labels.get(item.pid) || [], cpu: item.cpu, memory: item.memory
  }));
  const result = {
    phase, elapsedSeconds: Number(((Date.now() - started) / 1000).toFixed(1)),
    mainNodeMemoryBytes: process.memoryUsage(),
    webContents: contents.map(item => ({ id: item.id, pid: item.getOSProcessId(), label: label(item), navigationEntries: item.navigationHistory.length() })),
    trackedProcessCount: metrics.length,
    workingSetSumKiB: metrics.reduce((total, item) => total + item.memory.workingSetSize, 0),
    cpuPercentSum: metrics.reduce((total, item) => total + item.cpu.percentCPUUsage, 0),
    linuxTree: linuxTreeMemory(), metrics
  };
  snapshots.push(result);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ appVersion: require('../package.json').version,
    mode: 'offline-minimal-fixtures', status: 'in-progress', snapshots }, null, 2));
  console.log(JSON.stringify({ phase, contents: contents.length, trackedProcesses: metrics.length,
    rssSumMiB: +(result.workingSetSumKiB / 1024).toFixed(1),
    linuxPssMiB: result.linuxTree ? +(result.linuxTree.pssKiB / 1024).toFixed(1) : null,
    cpuPercent: +result.cpuPercentSum.toFixed(2) }));
}

async function waitFor(predicate) {
  const limit = Date.now() + 10000;
  while (!predicate()) {
    if (Date.now() > limit) throw new Error('Timed out waiting for audit window/load');
    await sleep(50);
  }
}

app.whenReady().then(async () => {
  for (const [id, service] of Object.entries(SERVICES)) {
    const ses = session.fromPartition(`persist:${id}`);
    await ses.protocol.handle('https', request => {
      if (new URL(request.url).origin !== new URL(service.url).origin) return new Response('Blocked', { status: 403 });
      return new Response(`<!doctype html><html><head><title>${id} audit fixture</title></head><body><h1>${service.name}</h1><p>Offline memory baseline; no chat history or media.</p></body></html>`, { headers: { 'Content-Type': 'text/html' } });
    });
  }
  require('../src/main.cjs');
  await waitFor(() => webContents.getAllWebContents().filter(item => ['shell', 'whatsapp-fixture', 'telegram-fixture'].includes(label(item))).length === 3);
  await waitFor(() => webContents.getAllWebContents().every(item => !item.isLoading()));
  const main = BrowserWindow.getAllWindows().find(item => label(item.webContents) === 'shell');
  const services = webContents.getAllWebContents().filter(item => label(item).endsWith('-fixture'));
  app.getAppMetrics(); // Prime CPU interval before the first snapshot.
  await sleep(5000);
  snapshot('idle-5s');
  await sleep(10000);
  snapshot('idle-15s');
  await sleep(10000);
  snapshot('idle-25s');

  for (let batch = 1; batch <= 3; batch++) {
    for (let cycle = 0; cycle < 10; cycle++) {
      await main.webContents.executeJavaScript("window.duo.windowAction('about')");
      await waitFor(() => BrowserWindow.getAllWindows().some(item => label(item.webContents) === 'about' && !item.webContents.isLoading()));
      const about = BrowserWindow.getAllWindows().find(item => label(item.webContents) === 'about');
      const closed = new Promise(resolve => about.once('closed', resolve));
      about.close();
      await closed;
    }
    await sleep(3000);
    assert.equal(webContents.getAllWebContents().length, 3, 'About renderers must be destroyed');
    snapshot(`after-${batch * 10}-about-cycles`);

    for (let cycle = 0; cycle < 10; cycle++) {
      await Promise.all(services.map(item => item.loadURL(SERVICES[label(item).split('-')[0]].url)));
    }
    await sleep(3000);
    assert.equal(webContents.getAllWebContents().length, 3, 'Reload must reuse the service views');
    snapshot(`after-${batch * 10}-reload-cycles`);
  }

  main.minimize();
  await sleep(10000);
  snapshot('minimized-10s');
  await sleep(10000);
  snapshot('minimized-20s');
  main.restore();
  await sleep(5000);
  snapshot('restored');
  for (let interval = 1; interval <= 3; interval++) {
    await sleep(20000);
    snapshot(`post-activity-idle-${interval * 20}s`);
  }
  // Diagnostic only: distinguish main-process wrappers/native-image allocations
  // awaiting V8 GC from retained windows. Never enable this in production.
  require('node:v8').setFlagsFromString('--expose-gc');
  require('node:vm').runInNewContext('gc')();
  await sleep(5000);
  snapshot('after-diagnostic-main-gc');
  for (const contents of [main.webContents, ...services]) {
    contents.debugger.attach('1.3');
    try { await contents.debugger.sendCommand('HeapProfiler.collectGarbage'); }
    finally { contents.debugger.detach(); }
  }
  await sleep(5000);
  snapshot('after-diagnostic-renderer-gc');

  // Terminal measurement: release both service renderers and leave the shell.
  // This is an audit-only teardown, never a feature of the shipped application.
  for (const contents of services) contents.close();
  await sleep(5000);
  snapshot('shell-only-after-service-teardown');
  const report = {
    appVersion: require('../package.json').version, platform: process.platform,
    arch: process.arch, electron: process.versions.electron, chromium: process.versions.chrome,
    mode: 'offline-minimal-fixtures', status: 'completed', createdAt: new Date().toISOString(),
    limitations: [
      'No signed-in WhatsApp/Telegram history, workers, media, calls or real notification delivery.',
      'Short-run baseline/lifecycle audit; not proof of absence of long-running memory leaks.',
      'Working-set/RSS sums include shared pages and are not comparable to Windows Task Manager totals.',
      'Linux PSS is proportional shared memory for the measured process tree; inspect completeness.',
      'Shell-only measurement follows service teardown and retains browser/GPU caches.',
      'Virtual display and --disable-gpu test runs do not represent native hardware GPU usage.',
      'Diagnostic GC stages are explicit test interventions, not normal idle behavior or production optimizations.',
      'Trusted service popup/call lifecycle could not be simulated reliably; it remains unverified.'
    ], snapshots
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${output}`);
  clearTimeout(deadline);
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
deadline = setTimeout(() => { console.error('Memory audit timed out'); app.exit(1); }, 240000);
