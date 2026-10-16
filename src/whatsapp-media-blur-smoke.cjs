const assert = require('node:assert/strict');
const { ELEMENTS } = require('./blur.cjs');
const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
module.exports = async ({wc,save,move,hover,isBlurred}) => {
 const evaluate = code => wc.executeJavaScript(code);
 const photo = id => '<img id="'+id+'" src="'+image+'">';
 const bg = id => '<div id="'+id+'" style="width:100px;height:60px;background-image:url('+image+')"></div>';
 const content = '<style>#wa-photo-regression>div{padding:8px;margin:8px 0}#wa-photo-regression canvas,#wa-photo-regression video,#wa-photo-regression img{display:block;width:100px;height:60px}#wa-photo-regression .selectable-text{display:block;min-height:24px}</style>'+
 '<div data-testid="msg-container">'+photo('wa-photo-metadata')+'<span class="selectable-text" id="wa-photo-caption">Private caption</span><button id="wa-photo-menu">Message menu</button></div>'+
 '<div data-id="incoming-photo"><div>'+photo('wa-photo-data-id')+'</div></div>'+
 '<div data-testid="msg-container">'+bg('wa-photo-background')+'</div>'+
 '<div data-testid="msg-container"><canvas id="wa-photo-canvas" width="100" height="60"></canvas></div>'+
 '<div data-testid="msg-container"><video id="wa-photo-video" poster="'+image+'"></video></div>'+
 '<div data-testid="msg-container"><div data-testid="quoted-message">'+bg('wa-photo-quoted')+'<span class="selectable-text" id="wa-photo-quote-text">Private quoted caption</span></div></div>'+
 '<div data-testid="msg-container"><span data-testid="sticker-container" id="wa-photo-sticker"><canvas width="100" height="60"></canvas></span></div>'+
 '<div data-testid="msg-container"><div data-testid="image-thumb" id="wa-photo-thumb">'+photo('wa-photo-thumb-child')+'</div></div>'+
 '<div data-testid="msg-container"><div data-testid="link-preview-container">'+photo('wa-photo-link')+'</div></div>'+
 '<div data-testid="media-viewer">'+photo('wa-photo-viewer')+'</div>'+
 '<div role="listitem"><button>'+bg('wa-photo-gallery')+'</button></div>'+
 '<div class="x1conndi" id="wa-photo-details-thumb">'+photo('wa-photo-details-child')+'</div>'+
 '<div data-testid="msg-container"><div data-testid="chat-avatar" id="wa-photo-group-avatar">'+photo('wa-photo-group-avatar-child')+'</div>'+
 '<div class="x1okw0bk x1g6eq07"><div class="x1n2onr6 x1c9tyrk xeusxvb x1pahc9y x1ertn4p" id="wa-photo-contact-avatar">'+photo('wa-photo-contact-avatar-child')+'</div></div>'+
 '<span class="selectable-text" id="wa-photo-text-emoji">Message '+photo('wa-photo-emoji').replace('<img','<img class="emoji"')+'</span></div>'+
 '<header><div role="button"><div class="x1n2onr6 x16ye13r x5lhr3w" id="wa-photo-header-placeholder">AB</div></div></header>'+
 '<div class="x78zum5"><div class="x6s0dn4 x78zum5 x1c4vz4f x2lah0s x1y332i5 x18d9i69 xexx8yu xbmws1g"><div id="wa-photo-sidebar-placeholder">AB</div></div></div>'+
 '<div role="dialog"><div class="_ak8h" id="wa-photo-popup-avatar">AB</div></div>'+
 '<div data-id="draft-photo"><div contenteditable="true">'+photo('wa-photo-editor')+'</div></div>';
 await evaluate('(()=>{const root=document.createElement("section");root.id="wa-photo-regression";root.innerHTML='+JSON.stringify(content)+';document.getElementById("main").append(root);const c=document.getElementById("wa-photo-canvas").getContext("2d");c.fillStyle="red";c.fillRect(0,0,100,60);})()');
 const media=['metadata','data-id','background','canvas','video','quoted','sticker','thumb','thumb-child','link','viewer','gallery','details-thumb','details-child'].map(id=>'wa-photo-'+id);
 const avatars=['group-avatar','group-avatar-child','contact-avatar','contact-avatar-child','header-placeholder','sidebar-placeholder','popup-avatar'].map(id=>'wa-photo-'+id);
 const texts=['wa-photo-caption','wa-photo-quote-text'];
 const empty=Object.fromEntries(ELEMENTS.map(key=>[key,false]));
 for(const category of ['media','avatars','messages']) {
  await save({enabled:true,revealOnHover:false,elements:{...empty,[category]:true}});
  for(const id of media)assert.equal(await isBlurred(wc,id),category==='media',id+' follows Media independently of '+category);
  for(const id of avatars)assert.equal(await isBlurred(wc,id),category==='avatars',id+' follows Avatars independently of '+category);
  for(const id of texts)assert.equal(await isBlurred(wc,id),category==='messages','caption follows Messages');
  for(const id of ['wa-photo-menu','wa-photo-editor'])assert.equal(await isBlurred(wc,id),false,'controls and actual editor stay clear');
  if(category!=='messages')assert.equal(await isBlurred(wc,'wa-photo-emoji'),false,'emoji is not an avatar or photo');
 }
 await save({enabled:true});
 for(const id of ['wa-photo-metadata','wa-photo-background','wa-photo-canvas','wa-photo-viewer']){
  await evaluate('document.getElementById('+JSON.stringify(id)+').scrollIntoView({block:"center"})');
  await hover(wc,id);assert.equal(await isBlurred(wc,id),false,'hover reveals '+id);
  assert.equal(await isBlurred(wc,'wa-photo-caption'),true,'media hover keeps caption private');
  assert.equal(await isBlurred(wc,'wa-photo-group-avatar'),true,'media hover keeps avatar private');
  await move(wc,2,2);assert.equal(await isBlurred(wc,id),true,'media reblurs after pointer leaves');
 }
 await save({enabled:true,revealOnHover:false});
 await hover(wc,'wa-photo-viewer');assert.equal(await isBlurred(wc,'wa-photo-viewer'),true,'hover off stays private');
 await evaluate('(()=>{const n=document.getElementById("wa-photo-data-id").cloneNode(true);n.id="wa-photo-late";document.querySelector("#wa-photo-regression [data-id]").append(n);})()');
 assert.equal(await isBlurred(wc,'wa-photo-late'),true,'new photo blurs without reload');
 await save({enabled:false});
 for(const id of [...media,...avatars,'wa-photo-late'])assert.equal(await isBlurred(wc,id),false,'panel off restores '+id);
 await evaluate('document.getElementById("wa-photo-regression").remove();window.scrollTo(0,0)');
 await save({enabled:true});
 console.log('WHATSAPP PHOTO BLUR PASS: metadata/data-id images, background/canvas/video, quoted thumbnail, sticker, link/gallery/viewer/detail media, avatar placeholders and group/contact avatars, category separation, hover/reblur/off, editor guard and dynamic photos.');
};
