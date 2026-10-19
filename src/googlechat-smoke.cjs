const assert=require('node:assert/strict');
const {session}=require('electron');
module.exports=async({win,views,settings,state,handleAccountAction,blurControllers})=>{
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function until(condition,label){const end=Date.now()+7000;while(!await condition()){if(Date.now()>end)throw Error('Google Chat '+label);await sleep(35);}}
 const account=settings.accounts.find(a=>a.service==='googlechat');
 await handleAccountAction('select',{side:'left',id:account.id});
 const wc=views[account.id].webContents,ses=wc.session;
 const ui=code=>win.webContents.executeJavaScript(code);
 const html='<!doctype html><title>Google Chat fixture</title><div data-topic-id="fixture"><div jsname="bgckF" id="message">Private sample message</div></div><div contenteditable="true" id="editor">Write here</div>';
 await ses.protocol.handle('https',request=>{
  const url=new URL(request.url),reply=(body,status=200,headers={})=>new Response(body,{status,headers:{'Content-Type':'text/html',...headers}});
  if(url.origin==='https://chat.google.com'){
   if(url.pathname==='/legacy')return reply('',302,{Location:'https://mail.google.com/chat/u/0/'});
   if(url.pathname==='/landing')return reply('',302,{Location:'https://accounts.google.com/passive'});
   if(url.pathname==='/signin')return reply('',302,{Location:'https://accounts.google.com/ServiceLogin'});
   if(url.pathname==='/blocked')return reply('',302,{Location:'https://mail.google.com/mail/u/0/'});
   if(url.pathname==='/offline')return Response.error();
   return reply(html);
  }
  if(url.origin==='https://accounts.google.com'&&url.pathname==='/passive')return reply('',302,{Location:'https://workspace.google.com/products/chat/'});
  if(url.origin==='https://workspace.google.com')return reply('<!doctype html><title>Chat landing fixture</title><a id="signin" href="https://accounts.google.com/ServiceLogin">Sign in</a><div id="message">Public landing content</div>');
  if(url.origin==='https://accounts.google.com')return reply('<!doctype html><title>Login fixture</title><script>document.cookie="duochat-gc-auth=fixture; Secure; Path=/";location.href="https://mail.google.com/chat/u/0/";</script>');
  if(url.origin==='https://mail.google.com'&&url.pathname.startsWith('/chat/'))return reply(html);
  return Response.error(); // Never use real Google accounts or network.
 });
 try{
  await wc.loadURL('https://chat.google.com/landing');
  await until(()=>!wc.isLoading()&&wc.getURL()==='https://workspace.google.com/products/chat/'&&state().statuses[account.id]?.state==='ready','official landing reaches ready');
  assert.equal(views[account.id].getVisible(),true,'landing stays visible in the panel');
  assert.equal(await wc.executeJavaScript('typeof window.duo'),'undefined','landing has no shell bridge');
  await ui('window.duo.blurAction("set",{side:"left",enabled:true})');await blurControllers.get(wc.id).refresh();
  assert.equal(await wc.executeJavaScript('getComputedStyle(document.querySelector("#message")).filter'),'none','landing is navigation-only, not Chat content');
  await ui('window.duo.blurAction("set",{side:"left",enabled:false})');
  await wc.executeJavaScript('document.querySelector("#signin").click();undefined');
  await until(()=>!wc.isLoading()&&wc.getURL()==='https://mail.google.com/chat/u/0/'&&state().statuses[account.id]?.state==='ready','landing Sign in returns to Chat in same session');
  for(const endpoint of ['legacy','signin','modern']){
   await wc.loadURL('https://chat.google.com/'+endpoint);
   const expected=endpoint==='modern'?'https://chat.google.com/modern':'https://mail.google.com/chat/u/0/';
   await until(()=>!wc.isLoading()&&wc.getURL()===expected&&state().statuses[account.id]?.state==='ready',endpoint+' reaches ready');
   assert.equal(views[account.id].getVisible(),true);
   assert.ok(views[account.id].getBounds().width>0);
   assert.equal(await wc.executeJavaScript('typeof require'),'undefined');
   assert.equal(await wc.executeJavaScript('typeof window.duo'),'undefined');
   await ui('window.duo.blurAction("set",{side:"left",enabled:true})');
   await blurControllers.get(wc.id).refresh();
   assert.match(await wc.executeJavaScript('getComputedStyle(document.querySelector("#message")).filter'),/blur/);
   assert.equal(await wc.executeJavaScript('getComputedStyle(document.querySelector("#editor")).filter'),'none');
   await ui('window.duo.blurAction("set",{side:"left",enabled:false})');
  }
  await wc.executeJavaScript('location.hash="chat-fixture";undefined');
  await sleep(80);
  assert.equal(state().statuses[account.id].state,'ready','same-document Chat navigation stays ready');
  assert.ok((await ses.cookies.get({url:'https://accounts.google.com/'})).some(c=>c.name==='duochat-gc-auth'));
  assert.equal((await session.fromPartition('persist:other-googlechat-fixture').cookies.get({url:'https://accounts.google.com/'})).length,0);
  await wc.loadURL('https://chat.google.com/blocked').catch(()=>{});
  await until(()=>!wc.isLoading()&&state().statuses[account.id]?.state==='error','blocked redirect reports an error');
  assert.notEqual(wc.getURL(),'https://mail.google.com/mail/u/0/');
  await until(()=>ui('document.querySelector("#left-status").textContent.includes("Pengalihan")'),'blocked status reaches UI');
  await wc.loadURL('https://chat.google.com/offline').catch(()=>{});
  await until(()=>!wc.isLoading()&&wc.getURL().includes('offline.html'),'failure shows local fallback');
  assert.equal(state().statuses[account.id].state,'error','fallback must not reset to loading/ready');
  await wc.loadURL('https://chat.google.com/retry');
  await until(()=>!wc.isLoading()&&state().statuses[account.id]?.state==='ready','retry recovers');
  console.log('GOOGLE CHAT LOAD PASS: public Workspace landing and Sign in return, legacy/modern redirects, same-session sign-in, native view visibility/bounds, isolated cookies, blur/editor guard on both hosts, blocked Gmail status, failed-load fallback and retry. Local fixtures, no real Google login.');
 }finally{ses.protocol.unhandle('https');}
};
