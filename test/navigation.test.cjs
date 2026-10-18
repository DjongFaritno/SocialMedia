const { test } = require('node:test');
const assert = require('node:assert/strict');
const { navigationAllowed, popupAllowed } = require('../src/navigation.cjs');
const { servicePermitted } = require('../src/permissions.cjs');
test('Instagram and Threads Facebook login stays inside its account, including callbacks and checkpoints', () => {
 for (const service of ['instagram','threads']) {
  for (const url of ['https://www.facebook.com/login/', 'https://www.facebook.com/dialog/oauth?redirect_uri=https%3A%2F%2Fwww.instagram.com%2F', 'https://www.facebook.com/checkpoint/123', 'https://m.facebook.com/login.php']) assert.equal(navigationAllowed(service,url), true);
  for (const url of ['http://www.facebook.com/login/', 'https://www.facebook.com.evil.test/login', 'https://www.facebook.com@evil.test', 'https://evil.test@www.facebook.com', 'javascript:alert(1)', 'file:///tmp/a']) assert.equal(navigationAllowed(service,url), false);
 }
 assert.equal(navigationAllowed('instagram','https://www.instagram.com/accounts/facebook/login/callback/'),true);
 for (const service of ['whatsapp','telegram','discord','x']) assert.equal(navigationAllowed(service,'https://www.facebook.com/login/'),false);
});
test('blank OAuth popup needs a trusted opener; login origins receive no media, notifications, or extra provider access', () => {
 assert.equal(popupAllowed('instagram','about:blank','https://www.instagram.com/'),true);
 assert.equal(popupAllowed('instagram','about:blank','https://www.facebook.com/login/'),true);
 assert.equal(popupAllowed('instagram','about:blank','https://evil.test/'),false);
 assert.equal(navigationAllowed('instagram','about:blank'),false);
 assert.equal(popupAllowed('whatsapp','about:blank','https://web.whatsapp.com/'),false);
 assert.equal(navigationAllowed('instagram','https://accounts.google.com/'),false);
 for(const permission of ['media','notifications']) assert.equal(servicePermitted('instagram',true,permission,'https://www.facebook.com','https://www.facebook.com/login/'),false);
});

test('Google sign-in stays in its account but never inherits Chat media or notifications', () => {
 assert.equal(navigationAllowed('googlechat','https://accounts.google.com/v3/signin/identifier'),true);
 assert.equal(popupAllowed('googlechat','about:blank','https://accounts.google.com/'),true);
 for(const service of ['whatsapp','telegram','instagram','threads','wechat','facebook','messenger']) assert.equal(navigationAllowed(service,'https://accounts.google.com/'),false);
 for(const url of ['http://accounts.google.com/','https://accounts.google.com.evil.test/','https://evil.test@accounts.google.com/','https://mail.google.com/']) assert.equal(navigationAllowed('googlechat',url),false);
 for(const permission of ['media','notifications']) assert.equal(servicePermitted('googlechat',true,permission,'https://accounts.google.com','https://accounts.google.com/'),false);
});
test('new services keep exact origins and account-specific popup boundaries', () => {
 for(const service of ['messenger','facebook']) {
  assert.equal(navigationAllowed(service,'https://www.facebook.com/messages/'),true);
  assert.equal(popupAllowed(service,'about:blank','https://www.facebook.com/'),true);
  assert.equal(popupAllowed(service,'about:blank','https://evil.test/'),false);
 }
 assert.equal(navigationAllowed('wechat','https://web.wechat.com/'),true);
 assert.equal(navigationAllowed('wechat','https://wx.qq.com/'),true);
 for(const url of ['https://qq.com/','https://web.wechat.com.evil.test/','http://web.wechat.com/','https://accounts.google.com/']) assert.equal(navigationAllowed('wechat',url),false);
});
