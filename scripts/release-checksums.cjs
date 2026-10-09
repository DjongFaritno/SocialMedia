const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const folder = process.argv[2];
const files = fs.readdirSync(folder).filter(file => /\.(exe|dmg|zip|AppImage|deb|sh|yml|blockmap)$/.test(file)).sort();
for (const name of ['latest.yml', 'latest-mac.yml', 'latest-linux.yml']) assert.ok(files.includes(name), 'Missing updater metadata: ' + name);
const { validateMetadata } = require('./verify-update-metadata.cjs');

for (const extension of ['exe', 'dmg', 'zip', 'AppImage', 'deb', 'sh']) {
  assert.equal(files.filter(file => file.endsWith('.' + extension)).length, 1, 'Missing or duplicate ' + extension);
}
(async () => {
  await validateMetadata(folder);
  const lines = [];
  for (const file of files) {
    const hash = crypto.createHash('sha256');
    for await (const chunk of fs.createReadStream(path.join(folder, file))) hash.update(chunk);
    lines.push(`${hash.digest('hex')}  ${file}`);
  }
  fs.writeFileSync(path.join(folder, 'SHA256SUMS.txt'), lines.join('\n') + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
