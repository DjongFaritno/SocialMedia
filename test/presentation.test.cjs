const {test}=require('node:test');
const assert=require('node:assert/strict');
const {linuxDisplayBackend,overlayPresentation}=require('../src/presentation.cjs');
test('Linux Wayland with an X display uses compatibility mode unless the caller chose a backend',()=>{
 assert.equal(linuxDisplayBackend('linux',{XDG_SESSION_TYPE:'wayland',DISPLAY:':0'},''),'x11');
 for(const explicit of ['wayland','x11','auto'])assert.equal(linuxDisplayBackend('linux',{XDG_SESSION_TYPE:'wayland',DISPLAY:':0'},explicit),undefined);
 assert.equal(linuxDisplayBackend('linux',{XDG_SESSION_TYPE:'wayland'},''),undefined,'no X display: do not force a missing server');
 assert.equal(linuxDisplayBackend('linux',{XDG_SESSION_TYPE:'x11',DISPLAY:':0'},''),undefined);
 for(const platform of ['win32','darwin'])assert.equal(linuxDisplayBackend(platform,{XDG_SESSION_TYPE:'wayland',DISPLAY:':0'},''),undefined);
});
test('modal settings hide service surfaces; sidebar remains transparent with both chats visible',()=>{
 for(const platform of ['linux','win32','darwin'])for(const dark of [false,true]){
  for(const mode of [null,'rail'])assert.deepEqual(overlayPresentation(mode,platform,dark),{hideServices:false,background:'#00000000'});
  for(const mode of ['add','manage','privacy','blur','lock']){
   const result=overlayPresentation(mode,platform,dark);
   assert.equal(result.hideServices,true);
   assert.equal(result.background,platform==='linux'?(dark?'#161e1b':'#edf2f1'):'#00000000');
  }
 }
});
