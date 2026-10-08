const { trusted } = require('./core.cjs');

function servicePermitted(id, enabled, permission, requestingOrigin, contentsURL) {
  if (enabled !== true || !['media', 'notifications'].includes(permission) || !trusted(id, requestingOrigin)) return false;
  // Notifications from a service worker have no document WebContents. The
  // isolated service session and exact requesting origin identify the caller.
  if (permission === 'notifications' && contentsURL === null) return true;
  return trusted(id, contentsURL);
}

// TCC is shared by both services. Deduplicate requests, including a brief
// not-determined status after macOS has already returned the user's answer.
function nativeMediaGate(platform, preferences) {
  const pending = new Map(), answers = new Map();
  function status(kind) {
    if (platform !== 'darwin') return 'granted';
    try { return preferences.getMediaAccessStatus(kind); } catch { return 'unknown'; }
  }
  function check(kind) {
    const value = status(kind);
    if (value === 'granted') return true;
    if (value === 'not-determined') return answers.get(kind) !== false;
    return false;
  }
  async function request(kind) {
    if (platform !== 'darwin') return true;
    const value = status(kind);
    if (value === 'granted') return true;
    if (value !== 'not-determined') return false;
    if (answers.has(kind)) return answers.get(kind);
    if (!pending.has(kind)) {
      const operation = Promise.resolve().then(() => preferences.askForMediaAccess(kind))
        .then(granted => { answers.set(kind, granted === true); return granted === true; })
        .catch(() => { answers.set(kind, false); return false; })
        .finally(() => pending.delete(kind));
      pending.set(kind, operation);
    }
    return pending.get(kind);
  }
  async function requestTypes(types) {
    const kinds = new Set(types.map(type => type === 'audio' ? 'microphone' : type === 'video' ? 'camera' : null));
    if (kinds.has(null) || kinds.size === 0) return false;
    for (const kind of kinds) if (!await request(kind)) return false;
    return true;
  }
  return { status, check, request, requestTypes };
}
module.exports = { servicePermitted, nativeMediaGate };
