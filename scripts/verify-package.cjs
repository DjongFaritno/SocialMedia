const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const platform = process.argv[2];
const files = fs.readdirSync('dist');
if (platform === 'windows') {
  const installer = files.find(file => /^DuoChat-.*-Windows-x64-Setup\.exe$/.test(file));
  assert.ok(installer, 'Windows x64 installer missing');
  const data = fs.readFileSync(path.join('dist', installer));
  assert.equal(data.subarray(0, 2).toString(), 'MZ', 'Installer is not a Windows executable');
  assert.ok(data.length > 1024 * 1024);
  assert.ok(fs.existsSync('dist/win-unpacked/DuoChat.exe'));
} else if (platform === 'macos') {
  const dmg = files.find(file => /^DuoChat-.*-macOS-universal\.dmg$/.test(file));
  const zip = files.find(file => /^DuoChat-.*-macOS-universal\.zip$/.test(file));
  assert.ok(dmg && zip, 'Universal DMG or ZIP missing');
  const data = fs.readFileSync(path.join('dist', dmg));
  assert.equal(data.subarray(data.length - 512, data.length - 508).toString(), 'koly', 'Invalid DMG trailer');
  const executable = fs.readFileSync('dist/mac-universal/DuoChat.app/Contents/MacOS/DuoChat');
  assert.ok([0xcafebabe, 0xcafebabf].includes(executable.readUInt32BE()), 'macOS executable is not universal');
} else if (platform === 'linux') {
  const appImage = files.find(file => /^DuoChat-.*\.AppImage$/.test(file));
  const deb = files.find(file => /\.deb$/.test(file));
  assert.ok(appImage && deb, 'Linux AppImage or Debian package missing');
  const image = fs.readFileSync(path.join('dist', appImage));
  assert.equal(image.subarray(0, 4).toString(), '\x7fELF', 'Invalid AppImage executable');
  assert.equal(image.subarray(8, 11).toString('hex'), '414902', 'Expected type 2 AppImage');
  const archive = fs.readFileSync(path.join('dist', deb));
  assert.equal(archive.subarray(0, 8).toString(), '!<arch>\n', 'Invalid Debian archive');
  assert.ok(fs.existsSync('dist/linux-unpacked/duochat-desktop'));
} else throw new Error('Specify windows, macos or linux');
console.log(`PACKAGE PASS: ${platform}`);
