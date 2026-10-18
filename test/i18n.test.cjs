const {test}=require('node:test');
const assert=require('node:assert/strict');
const {translate,normalize,english}=require('../src/i18n.js');
const {cleanSettings}=require('../src/core.cjs');
test('language migration and persisted round trip preserve other preferences',()=>{
 const id=cleanSettings({theme:'dark',ratio:.7});assert.equal(id.language,'id');
 const en=cleanSettings({...id,language:'en'});assert.equal(cleanSettings(JSON.parse(JSON.stringify(en))).language,'en');assert.equal(en.theme,'dark');assert.equal(en.ratio,.7);
 for(const value of ['fr',null,{},true,'EN'])assert.equal(cleanSettings({language:value}).language,'id');
});
test('translation interpolates literal user data without interpreting placeholders or markup',()=>{
 assert.equal(translate('en','Hapus {name}',{name:'Kunci <img> {version}'}),'Remove Kunci <img> {version}');
 assert.equal(translate('id','Hapus {name}',{name:'Lock'}),'Hapus Lock');
 assert.equal(translate('en','unknown value'),'unknown value');
 assert.equal(normalize('__proto__'),'id');
 for(const key of ['__proto__','constructor','toString'])assert.equal(translate('en',key),key);
});
test('catalog contains nonempty UI translations and untranslated values stay predictable',()=>{
 for(const [id,en]of Object.entries(english)){assert.ok(id.trim());assert.ok(en.trim());assert.equal(typeof en,'string');}
 assert.equal(translate('en','Cek update'),'Check updates');assert.equal(translate('id','Check updates'),'Cek update');
 assert.equal(translate('en','Tunggu {seconds} detik sebelum mencoba lagi.',{seconds:5}),'Wait 5 seconds before trying again.');
});
test('privacy errors can be localized without altering credentials or settings',async()=>{
 const {createPrivacy}=require('../src/privacy.cjs');
 const privacy=createPrivacy({t:(text,values)=>translate('en',text,values)});
 const before=privacy.snapshot();const result=await privacy.action('save',{newPassword:'x',confirmPassword:'x'});
 assert.equal(result.ok,false);assert.match(result.error,/at least 8/);assert.deepEqual(privacy.snapshot(),before);
});
