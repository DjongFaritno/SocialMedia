const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');
async function validateMetadata(folder) {
  const version = require('../package.json').version;
  const expected = {
    'latest.yml': `DuoChat-${version}-Windows-x64-Setup.exe`,
    'latest-mac.yml': `DuoChat-${version}-macOS-universal.zip`,
    'latest-linux.yml': `DuoChat-${version}.AppImage`
  };
  for (const [name, installer] of Object.entries(expected)) {
    const metadata = yaml.load(fs.readFileSync(path.join(folder, name), 'utf8'));
    assert.equal(metadata.version, version, name + ': version mismatch');
    assert.ok(metadata.files.some(file => file.url === installer), name + ': missing installer');
    for (const file of metadata.files) {
      assert.equal(path.basename(file.url), file.url, name + ': asset must be a filename');
      assert.ok(!file.url.includes('\\') && !file.url.includes(':'), name + ': unsafe asset');
      const target = path.join(folder, file.url);
      assert.equal(fs.statSync(target).size, file.size, name + ': incorrect size');
      const digest = crypto.createHash('sha512');
      for await (const chunk of fs.createReadStream(target)) digest.update(chunk);
      assert.equal(digest.digest('base64'), file.sha512, name + ': SHA-512 mismatch');
    }
  }
  console.log('UPDATE METADATA PASS: all platform versions, installers, sizes and SHA-512 hashes match');
}
if (require.main === module) validateMetadata(process.argv[2]).catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { validateMetadata };
