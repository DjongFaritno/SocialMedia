const { RELEASES_API, RELEASES_PAGE, compare, latestRelease, updateMode } = require('./update-core.cjs');

// Main-process controller; remote chat pages receive no updater IPC.
function createUpdates({ app, net, dialog, shell, getWindow, getSettings, save, notify, platform = process.platform,
  arch = process.arch, appImage = process.env.APPIMAGE, engineFactory = () => require('electron-updater').autoUpdater }) {
  const mode = updateMode({ packaged: app.isPackaged, platform, arch, appImage });
  let engine, checking, downloading, selected, version = '', phase = 'idle', progress = 0;
  let startupTimer, interval, stopped = false;
  const snapshot = () => ({ phase, version, progress, mode });
  function change(next) { phase = next; notify(); }
  async function message(message, detail) {
    await dialog.showMessageBox(getWindow(), { type: 'info', message, detail, buttons: ['Oke'] });
  }
  function updater() {
    if (engine) return engine;
    engine = engineFactory();
    engine.autoDownload = false; // Controller applies the user's saved preference.
    engine.autoInstallOnAppQuit = false;
    engine.allowDowngrade = false;
    engine.disableWebInstaller = true;
    engine.disableDifferentialDownload = true; // Complete installer + SHA-512 verification.
    engine.on('download-progress', value => {
      progress = Math.max(0, Math.min(100, Math.round(value.percent || 0))); notify();
    });
    engine.on('update-downloaded', info => {
      if (selected && info.version === selected.version) { progress = 100; change('ready'); }
    });
    // electron-updater emits error as well as rejecting the relevant operation.
    engine.on('error', () => { if (!stopped) change('error'); });
    return engine;
  }
  async function downloadImpl(manual) {
    if (!selected || phase === 'ready' || mode !== 'native') return;
    const target = selected;
    change('downloading'); progress = 0;
    try {
      const native = updater();
      native.setFeedURL({ provider: 'generic', url: target.base, channel: 'latest', useMultipleRangeRequest: false });
      const result = await native.checkForUpdates();
      if (!result?.updateInfo || result.updateInfo.version !== target.version) throw new Error('Metadata rilis tidak sesuai');
      await native.downloadUpdate();
      if (phase !== 'ready') throw new Error('Unduhan pembaruan belum siap');
    } catch {
      if (stopped) return;
      change('error');
      if (manual) await message('Pembaruan belum berhasil diunduh', 'Coba lagi setelah koneksi pulih. Kamu juga bisa mengunduh installer terbaru dari GitHub Releases.');
    }
  }
  function download(manual = true) {
    if (downloading) return downloading;
    downloading = downloadImpl(manual).finally(() => { downloading = null; });
    return downloading;
  }
  async function checkImpl(manual) {
    if (mode === 'development') {
      if (manual) await message('Pembaruan tersedia pada aplikasi terpasang', 'Jalankan installer DuoChat untuk memakai cek pembaruan. Versi development tidak memasang pembaruan.');
      return;
    }
    if (phase === 'ready') { if (manual) await install(); return; }
    change('checking');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await net.fetch(RELEASES_API, { credentials: 'omit', headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
      if (!response.ok) throw new Error('GitHub tidak tersedia');
      // Bound release-list memory, including chunked responses without length.
      const reader = response.body.getReader();
      let size = 0, text = ''; const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.byteLength;
          if (size > 2 * 1024 * 1024) throw new Error('Respons GitHub terlalu besar');
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
      } finally { reader.releaseLock(); }
      if (stopped) return;
      const release = latestRelease(JSON.parse(text));
      if (!release || compare(release.version, app.getVersion()) <= 0) {
        selected = null; version = ''; change('current');
        if (manual) await message('DuoChat sudah versi terbaru', `Versi ${app.getVersion()}. Belum ada rilis lebih baru dengan paket pembaruan lengkap.`);
        return;
      }
      selected = release; version = release.version; change('available');
      if (mode === 'native' && getSettings().autoDownloadUpdates) await download(false);
      else if (manual) {
        const result = await dialog.showMessageBox(getWindow(), { type: 'info', message: `DuoChat ${version} tersedia`,
          detail: mode === 'native' ? 'Unduh pembaruan sekarang. Pemasangan menunggu tombol Pasang & mulai ulang.' :
            'Buka GitHub untuk mengunduh installer. Versi macOS saat ini belum mendukung pemasangan otomatis; paket .deb/Fedora hasil ekstraksi juga dipasang manual.',
          buttons: ['Nanti', mode === 'native' ? 'Unduh pembaruan' : 'Buka unduhan'], cancelId: 0, defaultId: 1 });
        if (result.response === 1) {
          if (mode === 'native') await download(true); else await shell.openExternal(release.page);
        }
      }
    } catch {
      if (!stopped) {
        change('error');
        if (manual) await message('Belum bisa memeriksa pembaruan', 'Periksa koneksi lalu coba lagi. GitHub dapat membatasi pemeriksaan sementara.');
      }
    } finally { controller.abort(); clearTimeout(timeout); }
  }
  function check(manual = false) {
    if (checking) return checking;
    if (downloading) return downloading;
    checking = checkImpl(manual).finally(() => { checking = null; });
    return checking;
  }
  async function install() {
    if (mode !== 'native' || phase !== 'ready') return;
    const result = await dialog.showMessageBox(getWindow(), { type: 'question', message: `Pasang DuoChat ${version}?`,
      detail: 'DuoChat akan ditutup lalu dibuka kembali. Selesaikan panggilan dan unduhan yang sedang berjalan sebelum melanjutkan. Sesi login tetap memakai profil yang sama.',
      buttons: ['Nanti', 'Pasang & mulai ulang'], cancelId: 0, defaultId: 0 });
    if (result.response === 1 && phase === 'ready') { save(); updater().quitAndInstall(false, true); }
  }
  async function action(name) {
    if (name === 'install') return install();
    if (name === 'download') {
      if (mode === 'manual' && selected) return shell.openExternal(selected.page);
      return download(true);
    }
    if (name === 'check') return check(true);
  }
  function start() {
    if (mode === 'development') return;
    startupTimer = setTimeout(() => { if (getSettings().autoCheckUpdates) void check(); }, 15000);
    interval = setInterval(() => { if (getSettings().autoCheckUpdates) void check(); }, 6 * 60 * 60 * 1000);
    startupTimer.unref?.(); interval.unref?.();
  }
  function preference(key, enabled) {
    if (!['autoCheckUpdates', 'autoDownloadUpdates'].includes(key) || typeof enabled !== 'boolean') return;
    getSettings()[key] = enabled; save(); notify();
    if (key === 'autoDownloadUpdates' && enabled && phase === 'available' && mode === 'native') void download(false);
  }
  function stop() { stopped = true; clearTimeout(startupTimer); clearInterval(interval); }
  return { snapshot, check, action, start, preference, stop };
}
module.exports = { createUpdates };
