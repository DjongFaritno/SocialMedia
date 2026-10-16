const assert = require('node:assert/strict');
const { ELEMENTS } = require('./blur.cjs');
// Independently authored fixtures with the public Web A Chat/FullNameTitle/
// Archive structure and Web K peer-title structure. No Telegram runtime code.
function row(kind, variant) {
 const id = 'tg-list-' + kind + '-' + variant;
 if (kind === 'a') return '<div class="ListItem Chat ' + variant + '" id="' + id + '-row" role="link" tabindex="0"><div class="ListItem-button"><div class="status"><div class="avatar-wrapper"><div class="Avatar" id="' + id + '-avatar">AB</div></div></div><div class="info"><div class="info-row"><div class="title"><h3 class="fullName" dir="auto" id="' + id + '-name">Private chat name <b>formatted</b></h3></div><span class="muted">Mute</span><div class="separator"></div><time id="' + id + '-date">09:11</time></div><div class="subtitle"><span class="last-message" id="' + id + '-preview">Private preview</span><span class="badge" id="' + id + '-badge">3</span></div></div></div></div>';
 return '<div class="chatlist-chat" id="' + id + '-row" role="link" tabindex="0"><div class="avatar" id="' + id + '-avatar">AB</div><div class="row-title-row"><span class="peer-title" id="' + id + '-name">Private chat name</span><time id="' + id + '-date">09:11</time></div><div class="dialog-subtitle"><span class="last-message" id="' + id + '-preview">Private preview</span><span id="' + id + '-badge">3</span></div></div>';
}
module.exports = async ({wc,save,move,hover,isBlurred}) => {
 const evaluate = code => wc.executeJavaScript(code);
 const rows = ['a','k'].flatMap(kind => ['private','group','saved'].map(variant => kind + '-' + variant));
 const content = '<style>#telegram-list-regression{font:16px sans-serif}#telegram-list-regression .ListItem,#telegram-list-regression .chatlist-chat{display:block;margin:12px 0;padding:8px;min-height:90px}#telegram-list-regression .title,#telegram-list-regression .fullName,#telegram-list-regression .peer-title{display:block;min-height:24px;margin:0;width:220px}#telegram-list-regression .Avatar,#telegram-list-regression .avatar{display:block;width:30px;height:30px}#telegram-list-regression .subtitle,#telegram-list-regression .dialog-subtitle{min-height:24px}#telegram-list-regression .status{display:block}</style><button class="title" id="tg-list-search">Search</button><nav class="title" id="tg-list-tabs">All · Unread</nav>' +
 rows.map(id => row(...id.split('-'))).join('') +
 '<div class="ListItem chat-item-clickable chat-item-archive"><div class="ListItem-button"><div class="status"><div class="Avatar" id="tg-list-archive-avatar">Archive</div></div><div class="info"><div class="info-row"><div class="title"><h3 class="fullName" id="tg-list-archive-label">Archived Chats</h3></div></div><div class="subtitle"><div class="status Archive_chatsPreview_fixture" id="tg-list-archive-names"><span>Private archived group</span>, <span>Another archived contact</span></div><span id="tg-list-archive-badge">5</span></div></div></div></div>' +
 '<archive-dialog class="chatlist-chat"><div class="row-title-row" id="tg-list-k-archive-label">Archived Chats</div><div class="row-subtitle-row"><div><span class="peer-title" id="tg-list-k-archive-name">Private archived contact</span></div><span id="tg-list-k-archive-badge">5</span></div></archive-dialog>';
 await evaluate('(()=>{const root=document.createElement("section");root.id="telegram-list-regression";root.innerHTML='+JSON.stringify(content)+';document.body.append(root);root.onclick=e=>{const row=e.target.closest("[id$=-row]");if(row)document.body.dataset.listOpened=row.id;};})()');
 const names = rows.map(id=>'tg-list-'+id+'-name').concat(['tg-list-archive-names','tg-list-k-archive-name']);
 const avatars = rows.map(id=>'tg-list-'+id+'-avatar').concat(['tg-list-archive-avatar']);
 const previews = rows.map(id=>'tg-list-'+id+'-preview');
 const controls = ['tg-list-search','tg-list-tabs','tg-list-archive-label','tg-list-archive-badge','tg-list-k-archive-label','tg-list-k-archive-badge',...rows.map(id=>'tg-list-'+id+'-date')];
 const empty = Object.fromEntries(ELEMENTS.map(key=>[key,false]));
 for (const category of ['names','previews','avatars']) {
  await save({enabled:true,revealOnHover:false,elements:{...empty,[category]:true}});
  for(const id of names) assert.equal(await isBlurred(wc,id),category==='names','Telegram list '+id+' follows names independently of '+category);
  for(const id of avatars) assert.equal(await isBlurred(wc,id),category==='avatars','unchecked avatars remain clear');
  for(const id of previews) assert.equal(await isBlurred(wc,id),category==='previews','previews follow their own category');
  for(const id of controls) assert.equal(await isBlurred(wc,id),false,'list control stays clear: '+id);
  if(category==='names') for(const id of rows) assert.equal(await isBlurred(wc,'tg-list-'+id+'-badge'),false,'names do not blur unread badges');
 }
 // Match the reported configuration: names/previews/messages/media on, avatars off.
 await save({enabled:true,elements:{avatars:false}});
 await move(wc,2,2);
 for(const id of names) assert.equal(await isBlurred(wc,id),true,'reported configuration covers all list names');
 for(const id of avatars) assert.equal(await isBlurred(wc,id),false,'reported configuration preserves avatars');
 for(const id of ['tg-list-a-private-name','tg-list-k-group-name','tg-list-archive-names']) {
  await evaluate('document.getElementById('+JSON.stringify(id)+').scrollIntoView({block:"center"})');
  await hover(wc,id);
  assert.equal(await isBlurred(wc,id),false,'hover reveals pointed name');
  assert.equal(await isBlurred(wc,'tg-list-a-saved-name'),true,'hover keeps another name private');
  assert.equal(await isBlurred(wc,'tg-list-a-private-preview'),true,'hover name does not reveal preview');
  if(id==='tg-list-a-private-name'){
   const point=await evaluate('(()=>{const r=document.getElementById('+JSON.stringify(id)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
   await wc.debugger.sendCommand('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
   assert.equal(await evaluate('document.body.dataset.listOpened'),'tg-list-a-private-row','chat remains clickable');
  }
  await move(wc,2,2);assert.equal(await isBlurred(wc,id),true,'name reblurs after leaving');
 }
 await save({enabled:true,revealOnHover:false,elements:{avatars:false}});
 await hover(wc,'tg-list-archive-names');
 assert.equal(await isBlurred(wc,'tg-list-archive-names'),true,'hover-off keeps archive private');
 await evaluate('(()=>{const n=document.getElementById("tg-list-a-private-row").cloneNode(true);for(const e of [n,...n.querySelectorAll("[id]")])e.id=e.id.replace("a-private","a-dynamic");document.getElementById("telegram-list-regression").append(n);})()');
 assert.equal(await isBlurred(wc,'tg-list-a-dynamic-name'),true,'new/recycled chat row blurs without reload');
 assert.equal(await isBlurred(wc,'tg-list-a-dynamic-avatar'),false,'new row honors unchecked avatar');
 await save({enabled:false});
 for(const id of [...names,...previews,'tg-list-a-dynamic-name']) assert.equal(await isBlurred(wc,id),false,'panel off restores list');
 await save({enabled:true});
 console.log('TELEGRAM LIST BLUR PASS: Web A/K private/group/saved names, archive peer summaries, independent names/previews/avatars, reported configuration, Chromium hover/reblur/click, hover-off, dynamic rows and panel off.');
};
