const {test}=require('node:test');
const assert=require('node:assert/strict');
const {overlayPresentation}=require('../src/presentation.cjs');
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
