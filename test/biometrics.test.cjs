const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createBiometrics,createStartupUnlock}=require('../src/biometrics.cjs');
const windowMock=()=>({isDestroyed:()=>false,isVisible:()=>true,focus(){},getNativeWindowHandle:()=>Buffer.alloc(8,1)});
test('Windows uses the packaged binding and only Verified grants consent',async()=>{
 let selected, result='Verified', checks=0;
 const native={checkAvailability:async()=>{checks++;return 'Available';},verify:async handle=>{assert.equal(handle.length,8);return result;}};
 const p=createBiometrics({platform:'win32',release:'10.0.26100',packaged:true,resourcesPath:'/resources',loadNative:file=>{selected=file;return native;},getWindow:windowMock});
 await p.refresh();assert.match(selected,/native[\\/]duochat_hello.node$/);assert.equal(p.available(),true);assert.equal(p.snapshot().biometricLabel,'Windows Hello');
 await p.prompt();
 for(const invalid of ['Canceled','DeviceBusy','RetriesExhausted','UnknownError',false,true,null,'Available']) {result=invalid;await assert.rejects(p.prompt());}
 assert.ok(checks>=9);
});
test('unsupported OS, missing binding, policy and unknown results fail closed',async()=>{
 let loaded=false;
 const old=createBiometrics({platform:'win32',release:'10.0.19045',loadNative:()=>{loaded=true;}});
 await old.refresh();assert.equal(old.available(),false);assert.equal(loaded,false);assert.equal(old.snapshot().biometricStatus,'UnsupportedOS');await assert.rejects(old.prompt());
 const missing=createBiometrics({platform:'win32',release:'10.0.26100',loadNative:()=>{throw Error('missing');}});
 await missing.refresh();assert.equal(missing.snapshot().biometricStatus,'NativeUnavailable');
 for(const value of ['DisabledByPolicy','NotConfiguredForUser','DeviceNotPresent','DeviceBusy','unexpected',true]){
  const p=createBiometrics({platform:'win32',release:'10.0.26100',loadNative:()=>({checkAvailability:async()=>value,verify:()=>{throw Error('must not request');}})});
  await p.refresh();assert.equal(p.available(),false);await assert.rejects(p.prompt());
 }
});
test('native verification requires a visible app window and concurrent requests are rejected',async()=>{
 let finish; const p=createBiometrics({platform:'win32',release:'10.0.26100',loadNative:()=>({checkAvailability:async()=>'Available',verify:()=>new Promise(resolve=>{finish=resolve;})}),getWindow:windowMock});
 const pending=p.prompt();while(!finish)await new Promise(resolve=>setImmediate(resolve));
 await assert.rejects(p.prompt());finish('Verified');await pending;
 const hidden=createBiometrics({platform:'win32',release:'10.0.26100',loadNative:()=>({checkAvailability:async()=>'Available'}),getWindow:()=>({...windowMock(),isVisible:()=>false})});
 await assert.rejects(hidden.prompt());
});
test('Touch ID uses the system prompt and cancellation cannot authenticate; Linux stays unavailable',async()=>{
 let cancel=false; const p=createBiometrics({platform:'darwin',systemPreferences:{canPromptTouchID:()=>true,promptTouchID:async()=>{if(cancel)throw Error('cancel');}},getWindow:windowMock});
 await p.refresh();assert.equal(p.snapshot().biometricLabel,'Touch ID');await p.prompt();cancel=true;await assert.rejects(p.prompt());
 const linux=createBiometrics({platform:'linux'});await linux.refresh();assert.equal(linux.available(),false);await assert.rejects(linux.prompt());
});
test('startup prompt requires explicit preference, configured lock and availability, and runs once after cancellation',async()=>{
 let calls=0;const state={locked:true,lockOnStart:true,biometricOnStart:true,biometric:true,biometricAvailable:true};
 const privacy={snapshot:()=>state,action:async action=>{assert.equal(action,'biometric');calls++;return {ok:false,error:'canceled'};}};
 const run=createStartupUnlock({privacy});assert.equal((await run()).ok,false);assert.equal((await run()).skipped,true);assert.equal(calls,1);
 for(const field of Object.keys(state)) {const disabled=createStartupUnlock({privacy:{...privacy,snapshot:()=>({...state,[field]:false})}});assert.equal((await disabled()).skipped,true);}
 assert.equal((await createStartupUnlock({privacy,canPrompt:()=>false})()).skipped,true);
 assert.equal(calls,1);
});
