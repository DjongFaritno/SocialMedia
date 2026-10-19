const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
module.exports=async({app,win,views,settings,overlay,state,showOverlay,about})=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const ui=code=>win.webContents.executeJavaScript(code),modal=code=>overlay.webContents.executeJavaScript(code);
 async function until(check,label){const end=Date.now()+6000;while(!await check()){if(Date.now()>end)throw Error('Dialog QC: '+label);await sleep(30);}}
 console.log('DIALOG RUNTIME: '+JSON.stringify({platform:process.platform,ozone:app.commandLine.getSwitchValue('ozone-platform'),disabledGPU:app.commandLine.hasSwitch('disable-gpu'),hardwareAcceleration:app.isHardwareAccelerationEnabled()}));
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
    const point=await modal('(()=>{const r=document.querySelector("[data-provider=telegram]").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()');
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
  await about().webContents.executeJavaScript('document.querySelector("#close-about").click()').catch(()=>{});
  await until(()=>!about(),'About closes');
 }
 showOverlay(null);
 console.log('DIALOG PRESENTATION PASS: repeated add/blur/manage/privacy/About, normal/compact, painted frames and Linux screenshots, pointer/typing/Escape, restored native views and unchanged service processes.');
};
