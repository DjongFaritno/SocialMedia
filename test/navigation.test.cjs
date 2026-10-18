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

test('workplace auth exceptions do not grant content permissions or cross-provider access', () => {
 const cases={slack:['https://slack.com/signin','https://my-team.slack.com/ssb/signin'],teams:['https://login.microsoftonline.com/common/oauth2/v2.0/authorize','https://login.live.com/','https://login.microsoft.com/','https://account.live.com/']};
 for(const [service,urls] of Object.entries(cases)) for(const url of urls){
  assert.equal(navigationAllowed(service,url),true,url);
  for(const permission of ['media','notifications']) assert.equal(servicePermitted(service,true,permission,url,url),false);
  for(const other of ['whatsapp','telegram','linkedin','googlechat']) assert.equal(navigationAllowed(other,url),false);
  assert.equal(popupAllowed(service,'about:blank',url),true);
 }
 for(const url of ['http://workspace.slack.com/','https://workspace.slack.com.evil.test/','https://slack.com@evil.test/','https://evil.test@workspace.slack.com/','https://workspace.slack.com:8443/','https://enterprise-idp.test/']) assert.equal(navigationAllowed('slack',url),false,url);
 for(const url of ['https://login.microsoftonline.com.evil.test/','https://evil.test@login.live.com/','https://enterprise-idp.test/']) assert.equal(navigationAllowed('teams',url),false,url);
 assert.equal(popupAllowed('slack','about:blank','https://evil.test/'),false);
});

test('Google Chat supports both official Chat hosts without allowing Gmail inbox navigation', () => {
 const {trusted}=require('../src/core.cjs'),{allowed}=require('../src/blur.cjs');
 for(const url of ['https://chat.google.com/','https://mail.google.com/chat','https://mail.google.com/chat/u/0/#chat/home','https://mail.google.com/mail/u/2/chat/']) {
  assert.equal(navigationAllowed('googlechat',url),true,url);
  assert.equal(trusted('googlechat',url),true,url);
  assert.equal(allowed('googlechat',url),true,url);
  assert.equal(popupAllowed('googlechat',url,'https://chat.google.com/'),true);
  for(const other of ['whatsapp','telegram','teams','slack'])assert.equal(navigationAllowed(other,url),false);
 }
 for(const url of ['https://mail.google.com/','https://mail.google.com/mail/u/0/','https://mail.google.com/mail/u/0/#chat/home','https://mail.google.com/chatty','https://mail.google.com/chat/../mail/','https://mail.google.com/chat/%2e%2e%2fmail/','https://mail.google.com.evil.test/chat/','https://user@mail.google.com/chat/','https://mail.google.com:8443/chat/','http://mail.google.com/chat/']) {
  assert.equal(navigationAllowed('googlechat',url),false,url);
  assert.equal(allowed('googlechat',url),false,url);
 }
});
test('blocked redirects notify the panel once without opening an external browser', () => {
 const {EventEmitter}=require('node:events'),{protectNavigation}=require('../src/navigation.cjs');
 const contents=new EventEmitter();contents.setWindowOpenHandler=()=>{};
 const blocked=[],external=[];protectNavigation(contents,{service:'googlechat',external:url=>external.push(url),onBlocked:(url,kind)=>blocked.push(kind),popupPreferences:()=>({}),onChild:()=>{}});
 let prevented=false;
 contents.emit('will-redirect',{preventDefault(){prevented=true;}},'https://mail.google.com/chat/u/0/',false,true);
 assert.equal(prevented,false);assert.deepEqual(blocked,[]);
 contents.emit('will-redirect',{preventDefault(){prevented=true;}},'https://mail.google.com/mail/u/0/',false,true);
 assert.equal(prevented,true);assert.deepEqual(blocked,['redirect']);assert.deepEqual(external,[]);
});
