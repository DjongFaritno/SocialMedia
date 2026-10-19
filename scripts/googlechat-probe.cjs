const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {browserUserAgent}=require('../src/core.cjs');
const {protectNavigation,navigationAllowed}=require('../src/navigation.cjs');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'duochat-googlechat-probe-')));
function safe(value){try{const u=new URL(value);return u.origin+u.pathname;}catch{return 'invalid URL';}}
app.whenReady().then(async()=>{
 app.userAgentFallback=browserUserAgent(app.userAgentFallback,app.name);
 console.log('RUNTIME',JSON.stringify({electron:process.versions.electron,chrome:process.versions.chrome,ua:app.userAgentFallback}));
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,backgroundThrottling:false}});
 win.webContents.session.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));
 win.webContents.session.setUserAgent(app.userAgentFallback);
 win.webContents.on('will-redirect',(_e,url,_inPlace,main)=>console.log('REDIRECT',JSON.stringify({url:safe(url),main,allowed:navigationAllowed('googlechat',url)})));
 win.webContents.on('will-navigate',(_e,url)=>console.log('NAVIGATE',JSON.stringify({url:safe(url),allowed:navigationAllowed('googlechat',url)})));
 protectNavigation(win.webContents,{service:'googlechat',external:url=>console.log('EXTERNAL',safe(url)),onBlocked:(url,kind)=>console.log('BLOCKED',kind,safe(url)),popupPreferences:()=>({webPreferences:{sandbox:true}}),onChild:child=>child.destroy(),canOpen:()=>false});
 const timer=setTimeout(()=>{console.log('PROBE TIMEOUT');app.exit(0);},40000);
 for(const url of ['https://chat.google.com/','https://accounts.google.com/ServiceLogin?service=dynamite&continue=https%3A%2F%2Fchat.google.com%2F']){
  console.log('ENTRY',safe(url));
  await win.webContents.loadURL(url).catch(error=>console.log('LOAD ERROR',error.code));
  await new Promise(r=>setTimeout(r,2000));
  console.log('RESULT',JSON.stringify({url:safe(win.webContents.getURL()),title:win.webContents.getTitle(),emailField:await win.webContents.executeJavaScript('Boolean(document.querySelector("input[type=email]"))',true).catch(()=>false)}));
  if(new URL(win.webContents.getURL()).origin==='https://workspace.google.com'){
   const href=await win.webContents.executeJavaScript('Array.from(document.querySelectorAll("a[href]")).map(a=>a.href).find(h=>{try{return new URL(h).origin==="https://accounts.google.com"}catch{return false}})');
   if(href){console.log('SIGN IN LINK',safe(href));await win.webContents.loadURL(href).catch(e=>console.log('LOGIN ERROR',e.code));await new Promise(r=>setTimeout(r,1500));console.log('LOGIN RESULT',JSON.stringify({url:safe(win.webContents.getURL()),emailField:await win.webContents.executeJavaScript('Boolean(document.querySelector("input[type=email]"))').catch(()=>false)}));}
  }
 }
 clearTimeout(timer);app.exit(0);
}).catch(error=>{console.log('PROBE ERROR',error.code||error.name);app.exit(1);});
