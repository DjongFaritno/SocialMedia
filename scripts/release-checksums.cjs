const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = process.argv[2];
const files = fs.readdirSync(folder).filter(file => /\.(exe|dmg|zip)$/.test(file)).sort();
assert.equal(files.length, 3, 'Expected Windows EXE and macOS universal DMG/ZIP');
(async () => {
  const lines = [];
  for (const file of files) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(path.join(folder, file))) hash.update(chunk);
    lines.push(`${hash.digest('hex')}  ${file}`);
  }
  fs.writeFileSync(path.join(folder, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
})();
