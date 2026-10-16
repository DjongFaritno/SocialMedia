const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {publishRelease,assetManifest}=require('../scripts/publish-release.cjs');
const {requiredAssetNames}=require('../src/update-core.cjs');
function fixture(version='0.3.0',options={}){
 const sha='a'.repeat(40),repo='owner/repo',calls=[];
 const assets=requiredAssetNames(version).map(name=>({name,size:12,sha256:'b'.repeat(64)}));
 let release=options.existing?structuredClone(options.existing):null;
 const run=args=>{
  calls.push(args);
  if(args[0]==='api'){
   if(args[1].includes('/commits/'))return JSON.stringify({sha:options.badTag?'c'.repeat(40):sha});
   if(!release){const error=Error('Not Found');error.status=404;throw error;}
   return JSON.stringify(release);
  }
  if(args[1]==='create')release={draft:true,prerelease:true,target_commitish:sha,assets:[],html_url:'https://github.com/'+repo+'/releases/tag/v'+version};
  if(args[1]==='upload')release.assets=assets.map(a=>({name:a.name,size:a.size,state:'uploaded',digest:'sha256:'+a.sha256}));
  if(options.corrupt&&args[1]==='upload')release.assets[0].digest='sha256:'+'0'.repeat(64);
  if(args[1]==='edit'){release.draft=false;release.prerelease=args.includes('--prerelease=true');}
  return '';
 };
 return {sha,repo,version,folder:'/tmp/release',assets,run,calls};
}
test('stable release stays draft until all uploaded digests match, then becomes latest',()=>{
 const f=fixture(),r=publishRelease(f);
 assert.equal(r.draft,false);assert.equal(r.prerelease,false);
 assert.ok(f.calls.find(a=>a[1]==='create').includes('--draft'));
 assert.ok(f.calls.find(a=>a[1]==='edit').includes('--latest'));
 assert.ok(f.calls.findIndex(a=>a[1]==='upload')<f.calls.findIndex(a=>a[1]==='edit'));
});
test('prerelease versions never replace stable latest',()=>{
 const f=fixture('0.4.0-beta.1'),r=publishRelease(f);
 assert.equal(r.prerelease,true);assert.ok(f.calls.find(a=>a[1]==='edit').includes('--latest=false'));
});
test('incomplete or corrupt assets cannot publish a release',()=>{
 const f=fixture();f.assets.pop();assert.throws(()=>publishRelease(f),/Incomplete/);assert.equal(f.calls.length,0);
 const corrupt=fixture('0.3.0',{corrupt:true});assert.throws(()=>publishRelease(corrupt),/verification failed/);
 assert.equal(corrupt.calls.some(a=>a[1]==='edit'),false);
});
test('foreign drafts and already public releases are immutable',()=>{
 for(const existing of [{draft:true,target_commitish:'c'.repeat(40)},{draft:false,target_commitish:'a'.repeat(40)}]){
  const f=fixture('0.3.0',{existing});assert.throws(()=>publishRelease(f),/another commit|already public/);
  assert.equal(f.calls.some(a=>a[0]==='release'),false);
 }
});
test('matching incomplete draft can resume without creating a second release',()=>{
 const f=fixture('0.3.0',{existing:{draft:true,target_commitish:'a'.repeat(40),assets:[]}});
 assert.equal(publishRelease(f).draft,false);assert.equal(f.calls.some(a=>a[1]==='create'),false);
});
test('API failures and a mismatched published tag fail the release verification',()=>{
 const f=fixture();f.run=()=>{const error=Error('GitHub unavailable');error.status=503;throw error;};
 assert.throws(()=>publishRelease(f),/GitHub unavailable/);
 const bad=fixture('0.3.0',{badTag:true});
 assert.throws(()=>publishRelease(bad),/another commit/);
 assert.equal(bad.calls.some(a=>a[1]==='edit'),false,'foreign tag never becomes public');
});
test('local checksum manifest verifies file contents and includes its own digest',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'duochat-manifest-'));
 try{
  const bytes='installer fixture',sha=crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(folder,'app.exe'),bytes);fs.writeFileSync(path.join(folder,'SHA256SUMS.txt'),sha+'  app.exe\n');
  const manifest=await assetManifest(folder);
  assert.deepEqual(manifest.map(a=>a.name),['app.exe','SHA256SUMS.txt']);assert.equal(manifest[0].sha256,sha);
  fs.writeFileSync(path.join(folder,'app.exe'),'changed');await assert.rejects(assetManifest(folder),/changed/);
  fs.writeFileSync(path.join(folder,'SHA256SUMS.txt'),sha+'  ../app.exe\n');await assert.rejects(assetManifest(folder),/Invalid/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
