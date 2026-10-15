const assert = require('node:assert/strict');
module.exports = async ({wc,save,move,hover,isBlurred,service}) => {
 const evaluate=code=>wc.executeJavaScript(code);
 await save({enabled:true});
 await evaluate(`(()=>{
 const root=document.querySelector('article,[data-pressable-container="true"]');
 const wrapper=document.createElement('div');wrapper.setAttribute('dir','auto');wrapper.id='media-wrapper';
 wrapper.innerHTML='<div style="position:relative;width:160px;height:100px"><img id="overlay-image" style="width:160px;height:100px;pointer-events:none" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><button id="image-control" style="position:absolute;inset:0;margin:0">Photo controls</button></div><div style="position:relative;width:160px;height:100px"><video id="overlay-video" style="width:160px;height:100px;pointer-events:none"></video><button id="video-control" style="position:absolute;inset:0;margin:0">Play</button></div>';
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
 await save({enabled:true});
};
