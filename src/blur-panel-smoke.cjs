const assert = require('node:assert/strict');
const { SERVICES } = require('./accounts.cjs');
const { ELEMENTS } = require('./blur.cjs');
module.exports = async ({settings,views,handleAccountAction,waitForDocument,html,settled,ui,save,isBlurred,move}) => {
 const providers=Object.keys(SERVICES);
 const accounts=providers.map(service=>settings.accounts.find(a=>a.service===service));
 const secondWA=settings.accounts.find(a=>a.service==='whatsapp'&&a.id!==accounts[0].id);
 assert.ok(secondWA,'two WhatsApp accounts participate in blur QC');
 const pairs=accounts.map((a,i)=>[a,accounts[(i+1)%accounts.length]]).concat([[accounts[0],secondWA]]);
 const empty=Object.fromEntries(ELEMENTS.map(key=>[key,false]));
 const ids={messages:'message',previews:'preview',names:'person',avatars:'avatar',media:'media',composer:'editor'};
 const set=async(side,enabled)=>assert.equal((await ui('window.duo.blurAction("set",'+JSON.stringify({side,enabled})+')')).ok,true);
 for(const pair of pairs){
  console.log('BLUR PANEL MATRIX mount',pair.map(a=>a.service).join('/'));
  for(const [i,side] of ['left','right'].entries())assert.equal((await handleAccountAction('select',{side,id:pair[i].id})).ok,true);
  const panels=pair.map((account,i)=>({account,side:i?'right':'left',wc:views[account.id].webContents}));
  for(const {account,wc} of panels){
   await waitForDocument(wc);wc.session.protocol.unhandle('https');
   await wc.session.protocol.handle('https',()=>new Response(html(account.service),{headers:{'Content-Type':'text/html'}}));
   await wc.loadURL(SERVICES[account.service].url);await settled(wc);await move(wc,2,2);
  }
  for(const category of [...ELEMENTS,'none']){
   await save({enabled:true,revealOnHover:false,elements:{...empty,...(category==='none'?{}:{[category]:true})}});
   for(const {account,wc,side} of panels)for(const [key,id] of Object.entries(ids)){
    if(account.service==='threads'&&key==='previews')continue;
    assert.equal(await isBlurred(wc,id),key===category,account.service+' '+side+' independent '+category+' / '+key);
   }
  }
  await save({enabled:true,revealOnHover:false,strength:17});
  for(const {account,wc} of panels){
   await wc.executeJavaScript('(()=>{const e=document.getElementById("media"),n=e.cloneNode(true);n.id="matrix-late-media";e.after(n);})()');
   assert.equal(await isBlurred(wc,'matrix-late-media'),true,account.service+' new media styled');
   assert.equal(await wc.executeJavaScript('(()=>{for(let e=document.getElementById("media");e;e=e.parentElement){const f=getComputedStyle(e).filter;if(f.includes("blur("))return f;}return ""})()'),'blur(17px)','shared strength applies');
   assert.equal(await isBlurred(wc,'plain-button'),false,'controls remain usable');
  }
  for(const flags of [{left:true,right:false},{left:false,right:true},{left:false,right:false},{left:true,right:true}]){
   for(const side of ['left','right'])await set(side,flags[side]);
   for(const {wc,side} of panels)assert.equal(await isBlurred(wc,'media'),flags[side],'activation follows physical '+side);
   await ui('window.duo.blurAction("save",'+JSON.stringify({strength:14,revealOnHover:false,elements:{avatars:false}})+')');
   assert.deepEqual(settings.blurPanels,flags,'shared settings never flip activation');
   for(const {wc,side} of panels){
    assert.equal(await isBlurred(wc,'media'),flags[side],'shared save respects '+side+' activation');
    assert.equal(await isBlurred(wc,'avatar'),false,'shared unchecked avatar applies to both panels');
   }
  }
  await set('left',false);await set('right',true);
  await handleAccountAction('select',{side:'left',id:pair[1].id});
  assert.deepEqual(settings.blurPanels,{left:false,right:true},'account swap preserves physical activation');
  assert.equal(settings.slots.left,pair[1].id);assert.equal(settings.slots.right,pair[0].id);
  assert.equal(await isBlurred(views[pair[1].id].webContents,'media'),false,'swapped left off');
  assert.equal(await isBlurred(views[pair[0].id].webContents,'media'),true,'swapped right on');
  // Reload an enabled account through the fixture protocol: CSS must reattach.
  const wc=views[pair[0].id].webContents;
  await wc.loadURL(SERVICES[pair[0].service].url);await settled(wc);
  assert.equal(await isBlurred(wc,'media'),true,'reload retains active blur');
  for(const panel of panels){if(panel.wc.debugger.isAttached())panel.wc.debugger.detach();panel.wc.session.protocol.unhandle('https');}
 }
 assert.equal((await ui('window.duo.blurAction("toggle")')).ok,false,'panel side is required');
 console.log('BLUR PANEL MATRIX PASS: all six services on both sides plus two isolated WhatsApp accounts; every category alone/none, shared strength and settings, all four activation combinations, new media, account swap and reload.');
};
