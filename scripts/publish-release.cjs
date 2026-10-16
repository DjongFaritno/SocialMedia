const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const semver = require('semver');
const { requiredAssetNames } = require('../src/update-core.cjs');
function assertAssets(release, assets) {
 for(const expected of assets){
  const actual=(release.assets||[]).find(a=>a.name===expected.name);
  if(!actual || actual.state!=='uploaded' || actual.size!==expected.size || actual.digest!=='sha256:'+expected.sha256)
   throw Error('Uploaded asset verification failed: '+expected.name);
 }
 if(release.assets.length!==assets.length)throw Error('Unexpected release assets');
}
function publishRelease({repo,sha,version,folder,assets,run,resumeDraftFrom}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!/^[a-f0-9]{40}$/.test(sha)||!semver.valid(version))throw Error('Invalid release target');
 if(!assets.length||assets.some(a=>!/^[\w.-]+$/.test(a.name)||a.size<=0||!/^[a-f0-9]{64}$/.test(a.sha256)))throw Error('Invalid asset manifest');
 const names=new Set(assets.map(a=>a.name));
 if(names.size!==assets.length||!requiredAssetNames(version).every(name=>names.has(name)))throw Error('Incomplete release asset set');
 const tag='v'+version, prerelease=semver.prerelease(version)!==null;
 // GitHub's tag endpoint excludes unpublished drafts. List authenticated
 // releases instead; --slurp preserves pagination boundaries as valid JSON.
 const api=()=>{
  const pages=JSON.parse(run(['api','repos/'+repo+'/releases?per_page=100','--paginate','--slurp']));
  const release=pages.flat().find(item=>item.tag_name===tag);
  if(!release){const error=Error('Release not found');error.status=404;throw error;}
  return release;
 };
 let existing;
 try{existing=api();}catch(error){if(error.status!==404&&!/HTTP 404/.test(error.stderr?.toString()||''))throw error;}
 if(existing){
  if(!existing.draft)throw Error('Release already public; refusing to replace installer bytes');
  if(existing.target_commitish!==sha){
   if(!resumeDraftFrom||existing.target_commitish!==resumeDraftFrom)throw Error('Version belongs to another commit');
   // Explicit recovery lease: only this known unpublished draft may retarget.
   run(['release','edit',tag,'--repo',repo,'--target',sha]);
  }
 }else run(['release','create',tag,'--repo',repo,'--target',sha,'--draft','--title','DuoChat '+version,'--notes-file','docs/release-notes.md']);
 run(['release','upload',tag,...assets.map(a=>path.join(folder,a.name)),'--repo',repo,'--clobber']);
 const staged=api();
 if(!staged.draft||staged.target_commitish!==sha)throw Error('Draft release target changed');
 assertAssets(staged,assets);
 // A draft may refer to an already existing tag; target_commitish alone is
 // insufficient because GitHub ignores --target when the tag already exists.
 try{
  const ref=JSON.parse(run(['api','repos/'+repo+'/git/ref/tags/'+tag]));
  const tagged=ref.object.type==='commit'?ref.object:JSON.parse(run(['api','repos/'+repo+'/commits/'+tag]));
  if(tagged.sha!==sha)throw Error('Existing tag points to another commit');
 }catch(error){if(error.status!==404&&!/HTTP 404/.test(error.stderr?.toString()||''))throw error;}
 run(['release','edit',tag,'--repo',repo,'--draft=false','--prerelease='+prerelease,prerelease?'--latest=false':'--latest']);
 const published=api();
 if(published.draft||published.prerelease!==prerelease||published.target_commitish!==sha)throw Error('Release publication verification failed');
 assertAssets(published,assets);
 const commit=JSON.parse(run(['api','repos/'+repo+'/commits/'+tag]));
 if(commit.sha!==sha)throw Error('Published tag points to another commit');
 return published;
}
async function assetManifest(folder){
 const manifest=fs.readFileSync(path.join(folder,'SHA256SUMS.txt'),'utf8').trim().split('\n').map(line=>{
  const match=/^([a-f0-9]{64})  ([\w.-]+)$/.exec(line);if(!match)throw Error('Invalid checksum manifest');
  return {name:match[2],sha256:match[1]};
 });
 const names=manifest.map(a=>a.name);
 if(new Set(names).size!==names.length||names.includes('SHA256SUMS.txt'))throw Error('Duplicate checksum entries');
 for(const asset of [...manifest,{name:'SHA256SUMS.txt'}]){
  const filename=path.join(folder,asset.name),hash=crypto.createHash('sha256');
  for await(const chunk of fs.createReadStream(filename))hash.update(chunk);
  const digest=hash.digest('hex');if(asset.sha256&&asset.sha256!==digest)throw Error('Local asset changed: '+asset.name);
  asset.sha256=digest;asset.size=fs.statSync(filename).size;
  if(!asset.size)throw Error('Empty asset');
  if(asset.name==='SHA256SUMS.txt')manifest.push(asset);
 }
 return manifest;
}
if(require.main===module)(async()=>{
 const result=publishRelease({repo:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,version:require('../package.json').version,resumeDraftFrom:process.env.DUO_RESUME_DRAFT_FROM,
  folder:process.argv[2],assets:await assetManifest(process.argv[2]),
  run:args=>execFileSync('gh',args,{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']})});
 console.log('RELEASE PUBLISH PASS: '+result.html_url+'; all asset sizes/SHA-256 digests and tag target verified');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={publishRelease,assetManifest};
