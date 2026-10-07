const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const version = require('../package.json').version;
const documents = ['README.md', 'downloads/README.md', ...fs.readdirSync(path.join(root, 'docs')).filter(name => name.endsWith('.md')).map(name => 'docs/' + name)];
for (const name of documents) {
  const text = fs.readFileSync(path.join(root, name), 'utf8');
  for (const link of text.matchAll(/SocialMedia\/releases\/(?:tag|download)\/v([\w.-]+)/g)) {
    assert.equal(link[1], version, name + ': stale release link ' + link[0]);
  }
  for (const installer of text.matchAll(/DuoChat-(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?:-Windows-x64-Setup\.exe|-macOS-universal\.(?:dmg|zip)|\.AppImage)/g)) {
    assert.equal(installer[1], version, name + ': stale installer filename');
  }
}
assert.deepEqual(fs.readdirSync(path.join(root, 'downloads')).sort(), ['README.md'], 'Store all installer and checksum assets on GitHub Releases, not downloads/');
const template = fs.readFileSync(path.join(root, 'scripts/install-fedora.template.sh'), 'utf8');
assert.ok(template.includes('@VERSION@') && template.includes('@APPIMAGE_SHA256@'), 'Fedora template must use version and checksum placeholders');
console.log('RELEASE DOCS PASS: current version ' + version + ', no outdated installer or checksum in downloads/');
