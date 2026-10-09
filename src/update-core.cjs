const REPO = 'DjongFaritno/SocialMedia';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=30`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
function numbers(version) {
  const match = /^(?:v)?(\d+)\.(\d+)\.(\d+)$/.exec(version || '');
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}
function compare(a, b) {
  const left = numbers(a), right = numbers(b);
  if (!left || !right) throw new Error('Versi rilis tidak valid');
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] > right[i] ? 1 : -1;
  return 0;
}
function latestRelease(releases) {
  if (!Array.isArray(releases)) throw new Error('Respons GitHub tidak valid');
  const complete = releases.flatMap(release => {
    if (release?.draft || !release?.published_at || !numbers(release.tag_name) || !release.tag_name.startsWith('v')) return [];
    const version = release.tag_name.slice(1);
    const base = `https://github.com/${REPO}/releases/download/v${version}/`;
    const required = [`DuoChat-${version}-Windows-x64-Setup.exe`, `DuoChat-${version}-macOS-universal.dmg`,
      `DuoChat-${version}-macOS-universal.zip`, `DuoChat-${version}.AppImage`, `duochat-desktop_${version}_amd64.deb`,
      'install-fedora.sh', 'SHA256SUMS.txt', 'latest.yml', 'latest-mac.yml', 'latest-linux.yml'];
    const assets = new Map((release.assets || []).filter(asset => asset?.state === 'uploaded' && asset.size > 0 &&
      asset.browser_download_url === base + encodeURIComponent(asset.name)).map(asset => [asset.name, asset]));
    if (!required.every(name => assets.has(name))) return [];
    return [{ version, base, page: `https://github.com/${REPO}/releases/tag/v${version}` }];
  });
  return complete.sort((a, b) => compare(b.version, a.version))[0] || null;
}
function updateMode({ packaged, platform, appImage, arch }) {
  if (!packaged) return 'development';
  if (platform === 'win32' && arch === 'x64') return 'native';
  if (platform === 'linux' && arch === 'x64' && appImage) return 'native';
  return 'manual'; // macOS ad-hoc signing and extracted/deb packages.
}
module.exports = { RELEASES_API, RELEASES_PAGE, compare, latestRelease, updateMode };
