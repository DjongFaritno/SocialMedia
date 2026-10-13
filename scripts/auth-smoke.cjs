// Real Electron navigation/popup fixture; no Meta requests or credentials.
const { app, BrowserWindow, session } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { protectNavigation } = require('../src/navigation.cjs');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'duochat-auth-smoke-')));
const partition = 'persist:instagram-fixture';
let parent; const children = new Set(), external = [];
const deadline = setTimeout(() => { console.error('Auth smoke timed out'); app.exit(1); }, 20000);
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
async function waitFor(condition) { const until=Date.now()+6000; while(!condition()) {if(Date.now()>until)throw Error('Auth flow did not return to Instagram');await sleep(30);} }
function protect(contents) {
 protectNavigation(contents,{service:'instagram',external:url=>external.push(url),popupPreferences:()=>({show:false,webPreferences:{partition,nodeIntegration:false,contextIsolation:true,sandbox:true}}),onChild:child=>{children.add(child);protect(child.webContents);child.on('closed',()=>children.delete(child));}});
}
app.whenReady().then(async()=>{
 const ses=session.fromPartition(partition);
 await ses.protocol.handle('https',async request=>{
  const url=new URL(request.url);
  if(url.origin==='https://www.facebook.com' && url.pathname==='/login/') return new Response('',{status:302,headers:{Location:'https://www.facebook.com/checkpoint/fixture'}});
  if(url.origin==='https://www.facebook.com' && url.pathname==='/checkpoint/fixture') return new Response('<!doctype html><title>Facebook login fixture</title><script>document.cookie="fb-fixture=linked; Secure; Path=/";location.href="https://www.instagram.com/accounts/facebook/login/callback/"</script>',{headers:{'Content-Type':'text/html'}});
  if(url.origin==='https://www.instagram.com' && url.pathname==='/accounts/facebook/login/callback/') {
   const cookies=await ses.cookies.get({url:'https://www.facebook.com/'});assert.ok(cookies.some(item=>item.name==='fb-fixture' && item.value==='linked'));
   return new Response('<!doctype html><title>Instagram callback fixture</title><script>document.cookie="ig-fixture=signed-in; Secure; Path=/"</script><p>Returned to Instagram</p>',{headers:{'Content-Type':'text/html'}});
  }
  if(url.origin==='https://www.instagram.com') return new Response('<!doctype html><title>Instagram fixture</title><p>Instagram login</p>',{headers:{'Content-Type':'text/html'}});
  throw Error('Unexpected network request: '+url.origin);
 });
 parent=new BrowserWindow({show:false,webPreferences:{partition,nodeIntegration:false,contextIsolation:true,sandbox:true}});protect(parent.webContents);
 for(const blank of [false,true]) {
  await ses.clearStorageData();await parent.loadURL('https://www.instagram.com/');
  const created=new Promise(resolve=>parent.webContents.once('did-create-window',resolve));
  await parent.webContents.executeJavaScript(blank?'const w=window.open("about:blank");w.location="https://www.facebook.com/login/"':'window.open("https://www.facebook.com/login/");undefined',true);
  const child=await created;await waitFor(()=>!child.webContents.isLoading() && child.webContents.getURL()==='https://www.instagram.com/accounts/facebook/login/callback/');
  assert.equal(child.webContents.session,ses); assert.equal(await child.webContents.executeJavaScript('typeof require'),'undefined');
  assert.equal(await child.webContents.executeJavaScript('typeof window.duo'),'undefined');
  assert.ok((await ses.cookies.get({url:'https://www.instagram.com/'})).some(item=>item.name==='ig-fixture'));
  assert.equal((await session.fromPartition('persist:other-instagram-fixture').cookies.get({url:'https://www.instagram.com/'})).length,0);
  child.destroy();
 }
 await parent.webContents.executeJavaScript('window.open("https://www.facebook.com.evil.test/login/");undefined',true);
 assert.equal(children.size,0);assert.equal(external.length,1);
 console.log('AUTH SMOKE PASS: Facebook login/checkpoint/Instagram callback and blank OAuth popup share the account session; other profiles stay separate; sandbox and external-host policy preserved.');
 clearTimeout(deadline);app.exit(0);
}).catch(error=>{console.error(error);clearTimeout(deadline);app.exit(1)});
