const assert = require('node:assert/strict');
module.exports = async ({wc,save,move,hover,isBlurred,service}) => {
 const evaluate=code=>wc.executeJavaScript(code);
 await save({enabled:true});
 await evaluate(`(()=>{
 let root=document.querySelector('#media-host,article,[data-pressable-container="true"]');
 if(!root){root=document.createElement('div');
  if('${service}'==='whatsapp')root.setAttribute('data-testid','msg-container');
  if('${service}'==='telegram'){root.className='Message';root.innerHTML='<div class="media-inner"></div>'; }
  if('${service}'==='discord')root.className='attachment_fixture imageWrapper_fixture';
  if('${service}'==='x')root.setAttribute('data-testid','tweetPhoto');
  (document.getElementById('main')||document.body).append(root);
  if('${service}'==='telegram')root=root.firstElementChild;
 }
 const wrapper=document.createElement('div');wrapper.setAttribute('dir','auto');wrapper.id='media-wrapper';
 wrapper.innerHTML='<div style="position:relative;width:160px;height:100px"><img id="overlay-image" style="width:160px;height:100px;pointer-events:none" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><button id="image-control" style="position:absolute;inset:0;margin:0">Photo controls</button></div><div data-testid="videoPlayer" style="position:relative;width:160px;height:100px"><video id="overlay-video" style="width:160px;height:100px;pointer-events:none"></video><img id="video-poster" style="position:absolute;inset:0;width:160px;height:100px;pointer-events:none" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><button id="video-control" style="position:absolute;inset:0;margin:0">Play</button></div>';
 root.append(wrapper);document.getElementById('image-control').onclick=()=>document.body.dataset.mediaClicked='yes';
 })()`);
 await move(wc,2,2);
 for(const id of ['overlay-image','overlay-video']) assert.equal(await isBlurred(wc,id),true,service+' media blurred before hover');
 for(const [control,media,other] of [['image-control','overlay-image','overlay-video'],['video-control','overlay-video','overlay-image']]) {
  await evaluate('document.getElementById('+JSON.stringify(control)+').scrollIntoView({block:"center"})');
  await hover(wc,control);
  assert.equal(await evaluate('document.getElementById('+JSON.stringify(media)+').matches(":hover")'),false,'overlay intercepts hover');
  assert.equal(await isBlurred(wc,media),false,service+' reveals media through sibling overlay');
  assert.equal(await isBlurred(wc,other),true,service+' keeps other media blurred');
  assert.equal(await isBlurred(wc,'video-poster'),control!=='video-control',service+' handles stacked video/poster layers');
  assert.equal(await isBlurred(wc,'message'),true,service+' keeps unrelated caption blurred');
  await move(wc,2,2);assert.equal(await isBlurred(wc,media),true,'reblur');
 }
 await hover(wc,'image-control');
 const point=await evaluate('(()=>{const r=document.getElementById("image-control").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
 await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
 await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
 assert.equal(await evaluate('document.body.dataset.mediaClicked'),'yes','controls remain clickable');
 await save({enabled:true,revealOnHover:false});await hover(wc,'image-control');
 assert.equal(await isBlurred(wc,'overlay-image'),true,'disabled reveal stays blurred');
 await save({enabled:true});await hover(wc,'image-control');
 await evaluate('(()=>{const e=document.createElement("div");e.id="unrelated-modal";e.style="position:fixed;inset:0;z-index:9999";document.body.append(e)})()');
 await move(wc,point.x+1,point.y+1);
 assert.equal(await isBlurred(wc,'overlay-image'),true,'unrelated overlay does not reveal media');
 await evaluate('document.getElementById("unrelated-modal").remove()');
 await save({enabled:false});
 assert.equal(await evaluate('document.querySelectorAll("[data-duochat-media-reveal]").length'),0,'disable cleans local markers');
 assert.equal(await evaluate('typeof window.__duochatMediaHoverCleanup'),'undefined','helper isolated from service page');
 await evaluate('document.getElementById("media-wrapper").remove();window.scrollTo(0,0)');
 if(service==='threads'){
  await evaluate('document.body.insertAdjacentHTML("beforeend",'+JSON.stringify('<article id="threads-linked-fixture"><a href="/@author" id="threads-profile-link"><img id="threads-linked-avatar" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></a><a href="/@author/post/example"><img id="threads-linked-photo" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></a></article>')+')');
  await save({enabled:true,revealOnHover:false,elements:{media:true,avatars:false,names:false}});
  assert.equal(await isBlurred(wc,'threads-linked-photo'),true,'linked post photo remains media outside pressable container');
  assert.equal(await isBlurred(wc,'threads-linked-avatar'),false,'unchecked profile stays clear');
  await save({enabled:true,revealOnHover:false,elements:{media:false,avatars:true,names:false}});
  assert.equal(await isBlurred(wc,'threads-linked-photo'),false,'avatar checkbox never blurs linked post media');
  assert.equal(await isBlurred(wc,'threads-linked-avatar'),true,'avatar checkbox covers profile link');
  await evaluate('document.getElementById("threads-linked-fixture").remove()');
 }
 await save({enabled:true});
 console.log('MEDIA OVERLAY PASS: '+service+' overlay image, video/poster, unrelated modal, click, hover-off and cleanup');
};
