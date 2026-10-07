const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = process.argv[2];
const files = fs.readdirSync(folder).filter(file => /\.(exe|dmg|zip|AppImage|deb|sh)$/.test(file)).sort();
assert.equal(files.length, 6, 'Expected Windows EXE, macOS DMG/ZIP, Linux AppImage/deb and Fedora installer');
for (const extension of ['exe', 'dmg', 'zip', 'AppImage', 'deb', 'sh']) {
  assert.equal(files.filter(file => file.endsWith('.' + extension)).length, 1, 'Missing or duplicate ' + extension);
}
(async () => {
  const lines = [];
  for (const file of files) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(path.join(folder, file))) hash.update(chunk);
    lines.push(`${hash.digest('hex')}  ${file}`);
  }
  fs.writeFileSync(path.join(folder, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
})();
