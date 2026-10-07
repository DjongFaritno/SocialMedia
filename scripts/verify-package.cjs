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
} else throw new Error('Specify windows or macos');
console.log(`PACKAGE PASS: ${platform}`);
