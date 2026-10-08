// Secure-origin fixture served in-process; no Telegram account or network access.
const {app,BrowserWindow,session}=require('electron');
const {servicePermitted}=require('../src/permissions.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'duochat-worker-notification-')));
let win;let workerChecks=0;let enabled=true;
app.whenReady().then(async()=>{
 const ses=session.fromPartition('telegram-worker-fixture');
 ses.setPermissionCheckHandler((wc,permission,origin)=>{
  if(permission==='notifications'&&!wc)workerChecks++;
  return servicePermitted('telegram',enabled,permission,origin,wc?wc.getURL():null);
 });
 ses.setPermissionRequestHandler((wc,p,cb,d)=>cb(servicePermitted('telegram',enabled,p,d.requestingUrl,wc?wc.getURL():null)));
 ses.protocol.handle('https',request=>{
  const url=new URL(request.url);
  if(url.hostname!=='web.telegram.org')return new Response('blocked',{status:403});
  if(url.pathname==='/sw.js')return new Response("self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>{e.waitUntil(navigator.permissions.query({name:'notifications'}).then(p=>e.ports[0].postMessage(p.state)));});",{headers:{'Content-Type':'application/javascript'}});
  return new Response('<!doctype html><title>Local notification fixture</title>',{headers:{'Content-Type':'text/html'}});
 });
 win=new BrowserWindow({show:false,webPreferences:{session:ses,sandbox:true,nodeIntegration:false,contextIsolation:true}});
 await win.loadURL('https://web.telegram.org/');
 const query=()=>win.webContents.executeJavaScript("(async()=>{await navigator.serviceWorker.register('/sw.js');const r=await navigator.serviceWorker.ready;return new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data);r.active.postMessage('query',[c.port2]);});})()");
 assert.equal(await query(),'granted');assert(workerChecks>0);
 enabled=false;assert.equal(await query(),'denied');
 console.log('WORKER NOTIFICATION PASS: actual Electron service-worker permission is granted for enabled Telegram and denied after revocation');
 app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
setTimeout(()=>{console.error('Worker fixture timed out');app.exit(1)},15000);
