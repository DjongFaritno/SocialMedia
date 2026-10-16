const assert = require('node:assert/strict');
const { ELEMENTS } = require('./blur.cjs');
const image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const photo = '<img alt="fixture media" src="' + image + '">';
function fixture(kind, variant) {
 const id = kind + '-' + variant, quote = variant === 'quote';
 if (kind === 'a') return '<div class="Message ' + (variant === 'out' ? 'own' : '') + '"><div class="message-content"><div class="content-inner"><div class="message-subheader"><div class="EmbeddedMessage ' + (quote ? 'is-quote' : '') + '" role="button" tabindex="0" id="' + id + '-jump"><span class="embedded-thumb" id="' + id + '-media">' + photo + '</span><div class="message-text"><p class="embedded-text-wrapper ' + (quote ? 'multiline' : '') + '" id="' + id + '-text">Quoted private message <b>with formatting</b></p><div class="message-title" id="' + id + '-name"><span class="embedded-sender-wrapper"><span class="embedded-sender">Private reply sender</span></span></div></div></div></div><div class="text-content" id="' + id + '-body">Response text</div></div></div></div>';
 return '<div class="bubble ' + (variant === 'out' ? 'is-out' : 'is-in') + '"><div class="bubble-content"><div class="reply quote-like ' + (quote ? 'reply-multiline' : '') + '" role="button" tabindex="0" id="' + id + '-jump"><div class="reply-border"></div><div class="reply-content"><div class="reply-media" id="' + id + '-media">' + photo + '</div><div class="reply-title" id="' + id + '-name"><span class="peer-title">Private reply sender</span></div><div class="reply-subtitle" id="' + id + '-text">Quoted private message <b>with formatting</b></div></div></div><div class="message" id="' + id + '-body">Response text</div></div></div>';
}
module.exports = async ({wc,save,move,hover,isBlurred}) => {
 const evaluate = code => wc.executeJavaScript(code);
 const ids = ['a','k'].flatMap(kind => ['in','out','quote'].map(variant => kind + '-' + variant));
 const content = '<style>#telegram-replies .Message,#telegram-replies .bubble{margin:8px 0;padding:6px;min-height:110px}#telegram-replies .EmbeddedMessage,#telegram-replies .reply{display:block;width:260px;min-height:76px;padding:6px;border:1px solid gray}#telegram-replies p{margin:0}#telegram-replies .message-title,#telegram-replies .reply-title,#telegram-replies .embedded-text-wrapper,#telegram-replies .reply-subtitle{display:block;min-height:22px}#telegram-replies .embedded-thumb,#telegram-replies .reply-media{display:block;width:24px;height:24px}#telegram-replies img{width:24px;height:24px}#telegram-replies .text-content,#telegram-replies .message{min-height:24px}</style>' + ['a','k'].flatMap(kind=>['in','out','quote'].map(variant=>fixture(kind,variant))).join('') + '<button id="reply-control">Reply action</button>';
 await evaluate('(()=>{const root=document.createElement("section");root.id="telegram-replies";root.innerHTML=' + JSON.stringify(content) + ';document.body.append(root);for(const node of root.querySelectorAll("[id$=-jump]"))node.onclick=()=>document.body.dataset.replyJump=node.id;})()');
 const outside = '<div class="MessageInput"><div class="EmbeddedMessage"><p class="embedded-text-wrapper" id="composer-reply">Composer reply preview</p></div></div><div class="EmbeddedMessage"><p class="embedded-text-wrapper" id="outside-reply">Outside message scope</p></div>';
 await evaluate('document.body.insertAdjacentHTML("beforeend",' + JSON.stringify(outside) + ')');
 const visit = async id => { await evaluate('document.getElementById(' + JSON.stringify(id) + ').scrollIntoView({block:"center"})'); await hover(wc,id); };
 await save({enabled:true}); await move(wc,2,2);
 for(const id of ids) for(const part of ['text','name','media','body']) assert.equal(await isBlurred(wc,id+'-'+part),true,'Telegram '+id+' blurs '+part);
 for(const id of ['reply-control','composer-reply','outside-reply','editor']) assert.equal(await isBlurred(wc,id),false,'Telegram leaves '+id+' usable');
 for(const id of ['a-in','k-quote']) {
  await visit(id+'-text');assert.equal(await isBlurred(wc,id+'-text'),false,'hover reveals quoted text');
  assert.equal(await isBlurred(wc,id+'-name'),true,'hover does not reveal reply sender');
  assert.equal(await isBlurred(wc,id+'-media'),true,'hover does not reveal thumbnail');
  assert.equal(await isBlurred(wc,id+'-body'),true,'hover does not reveal response');
  const point=await evaluate('(()=>{const r=document.getElementById('+JSON.stringify(id+'-text')+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  assert.equal(await evaluate('document.body.dataset.replyJump'),id+'-jump','reply navigation remains clickable');
  await move(wc,2,2);assert.equal(await isBlurred(wc,id+'-text'),true,'reply reblurs after pointer leaves');
 }
 await save({enabled:true,revealOnHover:false});
 for(const id of ['a-out','k-out']) { await visit(id+'-text');assert.equal(await isBlurred(wc,id+'-text'),true,'hover preference disabled'); }
 const empty=Object.fromEntries(ELEMENTS.map(key=>[key,false]));
 for(const category of ['messages','names','media','previews']) {
  await save({enabled:true,revealOnHover:false,elements:{...empty,[category]:true}});
  for(const id of ids) for(const [part,expected] of [['text','messages'],['name','names'],['media','media']]) assert.equal(await isBlurred(wc,id+'-'+part),category===expected,'Telegram '+id+' keeps '+part+' separate from '+category);
 }
 await save({enabled:true,revealOnHover:false});
 await evaluate('(()=>{for(const kind of ["a","k"]){const original=document.getElementById(kind+"-in-jump"),node=original.cloneNode(true);node.id=kind+"-dynamic-jump";for(const child of node.querySelectorAll("[id]"))child.id=child.id.replace(kind+"-in",kind+"-dynamic");original.after(node);}})()');
 for(const kind of ['a','k']) for(const part of ['text','name','media']) assert.equal(await isBlurred(wc,kind+'-dynamic-'+part),true,'new reply receives blur immediately');
 await evaluate('document.getElementById("editor").closest("[contenteditable=true]").focus()');
 await wc.insertText(' reply check');
 assert.match(await evaluate('document.getElementById("editor").closest("[contenteditable=true]").textContent'),/reply check/);
 await save({enabled:false});
 for(const id of [...ids,'a-dynamic','k-dynamic']) for(const part of ['text','name','media']) assert.equal(await isBlurred(wc,id+'-'+part),false,'disabling panel blur restores reply');
 await save({enabled:true});
 console.log('TELEGRAM REPLY BLUR PASS: Web A/K incoming/outgoing/quote markup, independent text/sender/thumbnail categories, Chromium hover/reblur and click navigation, hover-off, dynamic replies, preserved composer and full disable.');
};
