const { trusted } = require('./core.cjs');
// Navigation-only exceptions for Meta sign-in. These origins never inherit
// Instagram's camera/microphone/notification permissions or the shell bridge.
const META_LOGIN_ORIGINS = new Set(['https://www.facebook.com', 'https://facebook.com', 'https://m.facebook.com', 'https://web.facebook.com']);
const MICROSOFT_LOGIN_ORIGINS = new Set(['https://login.microsoftonline.com', 'https://login.live.com', 'https://login.microsoft.com', 'https://account.live.com']);
function authenticationOrigin(service, url) {
 if (service === 'googlechat') return url.origin === 'https://accounts.google.com';
 if (service === 'teams') return MICROSOFT_LOGIN_ORIGINS.has(url.origin);
 // Workspace subdomains are navigation-only; media/notification grants remain
 // limited to app.slack.com. Custom enterprise IdP domains are not trusted.
 if (service === 'slack') return url.origin === 'https://slack.com' || (!url.port && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.slack\.com$/.test(url.hostname));
 return false;
}
function navigationAllowed(service, value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    return trusted(service, value) || (['instagram', 'threads'].includes(service) && META_LOGIN_ORIGINS.has(url.origin)) || authenticationOrigin(service, url);
  } catch { return false; }
}
function popupAllowed(service, value, openerURL) {
  return navigationAllowed(service, value) || (['instagram', 'threads', 'messenger', 'facebook', 'googlechat', 'slack', 'teams'].includes(service) && value === 'about:blank' && navigationAllowed(service, openerURL));
}
function protectNavigation(contents, { service, external, popupPreferences, onChild, canOpen = () => true }) {
  contents.on('will-navigate', (event, url) => {
    if (!navigationAllowed(service, url)) { event.preventDefault(); void external(url); }
  });
  contents.on('will-redirect', (event, url) => {
    if (!navigationAllowed(service, url)) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (!canOpen()) return { action: 'deny' };
    if (!popupAllowed(service, url, contents.getURL())) { void external(url); return { action: 'deny' }; }
    return { action: 'allow', overrideBrowserWindowOptions: popupPreferences() };
  });
  contents.on('did-create-window', onChild);
}
module.exports = { navigationAllowed, popupAllowed, protectNavigation };
