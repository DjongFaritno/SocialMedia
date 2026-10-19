const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
module.exports=async({app,win,views,settings,overlay,state,showOverlay,about})=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const ui=code=>win.webContents.executeJavaScript(code),modal=code=>overlay.webContents.executeJavaScript(code);
 async function until(check,label){const end=Date.now()+6000;while(!await check()){if(Date.now()>end)throw Error('Dialog QC: '+label);await sleep(30);}}
 console.log('DIALOG RUNTIME: '+JSON.stringify({platform:process.platform,ozone:app.commandLine.getSwitchValue('ozone-platform'),disabledGPU:app.commandLine.hasSwitch('disable-gpu'),hardwareAcceleration:app.isHardwareAccelerationEnabled()}));

 // Verify resolved option colors in each actual Electron renderer. A transparent
 // option background can leave light text on a white OS popup (Windows/Linux).
 const originalTheme=settings.theme;
 const checkOptions=async(wc,label)=>{
  const options=await wc.executeJavaScript('Array.from(document.querySelectorAll("select option")).map(o=>{const c=getComputedStyle(o);return {text:o.textContent,fg:c.color,bg:c.backgroundColor,scheme:getComputedStyle(o.closest("select")).colorScheme}})');
  assert.ok(options.length>0,label+' has options');
  const rgb=color=>{const m=/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(color);assert.ok(m,'resolved color '+color);assert.ok(m[4]===undefined||Number(m[4])===1,'opaque option background');return m.slice(1,4).map(Number);};
  const luminance=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(const option of options){const a=luminance(option.fg),b=luminance(option.bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,label+' readable option: '+option.text);assert.equal(option.scheme,state().effectiveTheme,'native control follows effective theme');}
  return options.length;
 };
 for(const theme of ['dark','light','auto']){
  await ui('window.duo.setTheme('+JSON.stringify(theme)+')');
  await until(()=>modal('document.documentElement.dataset.theme').then(value=>value===state().effectiveTheme),'overlay theme applied');
  const count=await checkOptions(win.webContents,'shell')+await checkOptions(overlay.webContents,'settings');
  console.log('SELECT CONTRAST PASS: '+JSON.stringify({platform:process.platform,theme,effective:state().effectiveTheme,options:count}));
 }
 await ui('window.duo.setTheme('+JSON.stringify(originalTheme)+')');


 // Exercise the actual app-rendered popup; style inspection alone did not
 // catch native select menus ignoring the theme on Windows and Linux.
 const originalSlots={...settings.slots}, initialCompact=state().headerHidden;
 const key=keyCode=>{overlay.webContents.sendInputEvent({type:'keyDown',keyCode});overlay.webContents.sendInputEvent({type:'keyUp',keyCode});};
 const openPicker=async side=>{
  await ui('document.querySelector("#'+side+'-account-picker").click()');
  await until(()=>overlay.getVisible()&&modal('!document.querySelector("#account-picker-list").hidden'),'account popup opens');
  await until(()=>modal('document.activeElement.matches("[data-pick-account]")'),'account option focused');
  assert.equal(win.contentView.children.at(-1),overlay,'popup is above native chat surfaces');
  for(const [slot,id]of Object.entries(settings.slots))assert.equal(views[id].getVisible(),!state().privacy.covered[slot],'chat visibility preserved behind picker');
  const b=overlay.getBounds(),[w,h]=win.getContentSize();assert.ok(b.width>=240&&b.height>0&&b.x>=0&&b.y>=0&&b.x+b.width<=w&&b.y+b.height<=h,'popup stays within window');
 };
 fs.mkdirSync('artifacts',{recursive:true});
 for(const compact of [false,true]){
  if(state().headerHidden!==compact)await ui('window.duo.windowAction("header")');
  for(const theme of ['dark','light','auto']){
   await ui('window.duo.setTheme('+JSON.stringify(theme)+')');
   for(const side of ['left','right']){
    await openPicker(side);
    let timer;try{await Promise.race([modal('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Account popup did not paint')),6000);})]);}finally{clearTimeout(timer);}
    const image=await overlay.webContents.capturePage();assert.equal(image.isEmpty(),false);
    const bytes=image.toBitmap();let black=0,white=0;
    for(let i=0;i<bytes.length;i+=4){if(bytes[i]<75&&bytes[i+1]<75&&bytes[i+2]<75)black++;if(bytes[i]>220&&bytes[i+1]>220&&bytes[i+2]>220)white++;}
    const total=bytes.length/4,dark=state().effectiveTheme==='dark';
    assert.ok((dark?black:white)/total>.45,'popup has the actual '+(dark?'black':'white')+' rendered background');
    assert.ok((dark?white:black)>20,'contrasting text pixels rendered');
    assert.equal(await modal('getComputedStyle(document.querySelector(".account-option")).color'),dark?'rgb(255, 255, 255)':'rgb(23, 23, 23)');
    if(!compact)fs.writeFileSync(path.join('artifacts','dialog-picker-'+side+'-'+theme+'.png'),image.toPNG());
    const selected=settings.slots[side];
    // Real mouse input selects the current row and closes the popup.
    const point=await modal('(()=>{const r=document.querySelector("[aria-selected=true]").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()');
    overlay.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});overlay.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
    await until(()=>!overlay.getVisible(),'account mouse selection closes popup');assert.equal(settings.slots[side],selected);
    await openPicker(side);key('Escape');await until(()=>!overlay.getVisible(),'account Escape closes popup');
   }
   console.log('ACCOUNT PICKER PIXELS PASS: '+JSON.stringify({platform:process.platform,compact,theme,effective:state().effectiveTheme}));
  }
 }
 if(state().headerHidden!==initialCompact)await ui('window.duo.windowAction("header")');
 await ui('window.duo.setTheme('+JSON.stringify(originalTheme)+')');
 for(const side of ['left','right']){
  await openPicker(side);
  const next=await modal('(()=>{const b=Array.from(document.querySelectorAll("[data-pick-account]"));const i=b.indexOf(document.activeElement);return b[(i+1)%b.length].dataset.pickAccount})()');
  key('Down');
  await until(()=>modal('document.activeElement.dataset.pickAccount').then(id=>id===next),'ArrowDown moves option focus');
  key('Return');
  await until(()=>!overlay.getVisible()&&settings.slots[side]===next,'keyboard account switch '+side);
 }
 for(const side of ['left','right'])await ui('window.duo.accountAction("select",'+JSON.stringify({side,id:originalSlots[side]})+')');
 await until(()=>Object.values(views).every(v=>!v.webContents.isLoading()),'service fixtures settle after switching');
 await openPicker('left');
 const outside=views[settings.slots.right].webContents;
 outside.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,x:100,y:100});outside.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,x:100,y:100});
 await until(()=>!overlay.getVisible(),'outside chat click dismisses picker');
 assert.equal(await ui('window.duo.accountPicker("left",{x:-1,y:0,width:100,height:20})').then(r=>r.ok),false,'invalid popup anchor rejected');
 console.log('ACCOUNT PICKER INPUT PASS: both panels, pointer/Escape/ArrowDown/Enter, outside click, compact mode, actual popup pixels and visible service surfaces.');

 const ids=Object.values(views).map(v=>v.webContents.id);
 await until(()=>Object.values(views).every(v=>!v.webContents.isLoading()),'initial fixtures');
 fs.mkdirSync('artifacts',{recursive:true});
 for(const compact of [false,true]){
  if(state().headerHidden!==compact)await ui('window.duo.windowAction("header")');
  for(const mode of ['add','blur','manage','privacy']){
   await ui('window.duo.overlay('+JSON.stringify(mode)+')');
   await until(()=>modal('document.querySelector("#'+mode+'-dialog").open'),'open '+mode);
   for(const view of Object.values(views))assert.equal(view.getVisible(),false,'native chat surfaces hidden while '+mode+' is open');
   assert.equal(overlay.getVisible(),true);
   assert.equal(overlay.webContents.getBackgroundThrottling(),false);
   await until(()=>{const b=overlay.getBounds(),[width,height]=win.getContentSize();return b.x===0&&b.y===0&&b.width===width&&b.height===height;},'overlay matches resized content');
   console.log('DIALOG OPEN: '+JSON.stringify({mode,compact,bounds:overlay.getBounds(),windowVisible:win.isVisible(),focused:overlay.webContents.isFocused(),visibility:await modal('document.visibilityState')}));
   let paintTimer;
   let frame;
   try { frame=await Promise.race([modal('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))'),new Promise((_,reject)=>{paintTimer=setTimeout(()=>reject(Error('Dialog did not paint: '+mode)),6000);})]); }
   finally { clearTimeout(paintTimer); }
   assert.equal(frame,true,'overlay paints frames');
   const rect=await modal('(()=>{const r=document.querySelector("#'+mode+'-dialog").getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y}})()');
   assert.ok(rect.width>0&&rect.height>0&&rect.x>=0&&rect.y>=0,'dialog has visible bounds');
   if(process.platform==='linux'){
    const image=await overlay.webContents.capturePage();assert.equal(image.isEmpty(),false,'painted dialog image');
    const bytes=image.toBitmap(),colors=new Set();for(let i=0;i<bytes.length;i+=256)colors.add(bytes.subarray(i,i+4).toString('hex'));
    assert.ok(colors.size>5,'dialog screenshot contains content, not a blank surface');
    if(!compact)fs.writeFileSync(path.join('artifacts','dialog-'+mode+'.png'),image.toPNG());
   }
   if(mode==='add'){
    await modal('document.querySelector("[data-provider=telegram]").scrollIntoView({block:"center"})');
    await modal('new Promise(r=>requestAnimationFrame(r))');
    const point=await modal('(()=>{const r=document.querySelector("[data-provider=telegram]").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()');
    assert.ok(point.x>0&&point.y>0&&point.y<win.getContentSize()[1],'provider mouse target is scrolled into view');
    overlay.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});
    overlay.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});
    await until(()=>modal('document.querySelector("#provider").value==="telegram"'),'provider mouse input');
    await modal('document.querySelector("#account-name").value="";document.querySelector("#account-name").focus()');await overlay.webContents.insertText('Dialog test');
    assert.equal(await modal('document.querySelector("#account-name").value'),'Dialog test');
   }
   if(mode==='blur'){
    await modal('document.querySelector("#blur-dialog").scrollTop=100;document.querySelector("#blur-strength").value=14;document.querySelector("#blur-strength").dispatchEvent(new Event("input",{bubbles:true}))');
    assert.equal(await modal('document.querySelector("#blur-strength-value").textContent'),'14 px');
    assert.ok(await modal('document.querySelector("#blur-dialog").scrollTop')>0);
   }
   // Exercise keyboard close through Chromium input, not direct dialog.close().
   overlay.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
   overlay.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
   await until(()=>!overlay.getVisible(),'Escape closes '+mode);
   for(const [side,id]of Object.entries(settings.slots))assert.equal(views[id].getVisible(),!state().privacy.covered[side]);
   assert.deepEqual(Object.values(views).map(v=>v.webContents.id),ids,'dialogs preserve live service processes');
  }
 }
 if(state().headerHidden)await ui('window.duo.windowAction("header")');
 for(let count=0;count<2;count++){
  await ui('window.duo.windowAction("about")');
  await until(()=>about()&&!about().webContents.isLoading(),'About opens');
  assert.equal(about().isVisible(),true,'About native window is visible');
  await until(()=>about().webContents.executeJavaScript('document.querySelector("#version").textContent').then(value=>value===app.getVersion()),'About version renders');
  // The renderer may be destroyed before executeJavaScript returns. Observe
  // the native close event instead of awaiting a reply from a closed window.
  const aboutToClose=about();
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Dialog QC: About close timed out')),5000);
   aboutToClose.once('closed',()=>{clearTimeout(timer);resolve();});
   void aboutToClose.webContents.executeJavaScript('document.querySelector("#close-about").click()').catch(()=>{});
  });
  console.log('ABOUT CLOSE PASS: '+(count+1));
  await until(()=>!about(),'About closes');
 }
 showOverlay(null);
 console.log('DIALOG PRESENTATION PASS: repeated add/blur/manage/privacy/About, normal/compact, painted frames and Linux screenshots, pointer/typing/Escape, restored native views and unchanged service processes.');
};
