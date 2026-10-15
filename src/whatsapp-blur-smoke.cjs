// Variant fixtures use message metadata/readonly semantics rather than
// relying on the same legacy message-in/out classes as the first smoke.
const assert = require('node:assert/strict');
module.exports = async ({ wc, save, move, hover, isBlurred }) => {
 const markup = [
  '<div data-id="incoming-fixture"><div class="copyable-text" data-pre-plain-text="fixture"><span id="wa-incoming" class="selectable-text" contenteditable="false" role="textbox" aria-readonly="true" dir="ltr">Incoming message</span></div></div>',
  '<div data-id="outgoing-fixture"><div class="copyable-text" data-pre-plain-text="fixture"><span id="wa-outgoing" class="selectable-text" dir="rtl">Outgoing message</span></div></div>',
  '<div data-testid="msg-container"><blockquote><span id="wa-quote" class="selectable-text" contenteditable="false">Quoted message</span></blockquote><span id="wa-reply" data-lexical-text="true">Reply without legacy classes</span></div>',
  '<div data-id="readonly-ancestor" role="textbox" aria-readonly="true" contenteditable="false"><span id="wa-readonly" class="selectable-text">Readonly message ancestor</span></div>',
  '<div data-id="readonly-role"><div contenteditable="false"><span id="wa-readonly-role" role="textbox" class="selectable-text">Readonly role inherited from wrapper</span></div></div>',
  '<div data-testid="msg-container"><span id="wa-plain">Plain text fallback without legacy span classes</span></div>',
  '<div data-pre-plain-text="fixture" class="copyable-text"><span dir="auto" id="wa-caption">Text caption fallback</span><img id="wa-attachment" alt="Attachment"></div>',
  '<div data-testid="msg-container"><img id="wa-image" alt="Image-only message"></div>',
  '<div data-id="editor-guard"><div role="textbox" contenteditable="true" id="wa-editor"><span class="selectable-text" id="wa-draft">Draft remains readable</span><span contenteditable="false" class="selectable-text" id="wa-editor-mention">Mention inside editor</span></div></div>',
  '<div data-id="empty-editor-guard"><div contenteditable="" id="wa-empty-editor"><span class="selectable-text" id="wa-empty-draft">Editable empty attribute</span></div></div>',
  '<div data-id="plaintext-editor-guard"><div contenteditable="plaintext-only" id="wa-plaintext-editor"><span class="selectable-text" id="wa-plaintext-draft">Plaintext editor</span></div></div>'
 ].join('');
 await wc.executeJavaScript('(()=>{const e=document.createElement("section");e.id="wa-variants";e.innerHTML=' + JSON.stringify(markup) + ';document.getElementById("main").appendChild(e);})()');
 const messages = ['wa-incoming', 'wa-outgoing', 'wa-quote', 'wa-reply', 'wa-readonly', 'wa-readonly-role', 'wa-plain', 'wa-caption'];
 await save({ enabled: true, revealOnHover: false, elements: { messages: true, previews: false, names: false, avatars: false, media: false, composer: false } });
 await move(wc, 2, 2);
 for (const id of messages) assert.equal(await isBlurred(wc, id), true, id + ' must blur when messages alone are selected');
 for (const id of ['wa-attachment', 'wa-image', 'wa-draft', 'wa-editor-mention', 'wa-empty-draft', 'wa-plaintext-draft']) assert.equal(await isBlurred(wc, id), false, id + ' must remain independently clear');
 // Reveal one quote without exposing the adjacent reply.
 await wc.executeJavaScript('document.getElementById("wa-quote").scrollIntoView({block:"center"})');
 await save({ enabled: true, revealOnHover: true, elements: { media: false, composer: false } });
 await hover(wc, 'wa-quote');
 assert.equal(await isBlurred(wc, 'wa-quote'), false);
 assert.equal(await isBlurred(wc, 'wa-reply'), true);
 await move(wc, 2, 2); assert.equal(await isBlurred(wc, 'wa-quote'), true);
 // No observer/reload is required for another message received later.
 await wc.executeJavaScript('(()=>{const e=document.getElementById("wa-incoming").parentElement.parentElement.cloneNode(true);e.querySelector("#wa-incoming").id="wa-late";document.getElementById("wa-variants").appendChild(e);})()');
 assert.equal(await isBlurred(wc, 'wa-late'), true);
 await save({ enabled: true, revealOnHover: false, elements: { messages: false, media: true, names: true } });
 for (const id of messages) assert.equal(await isBlurred(wc, id), false, id + ' honors message category off');
 await save({ enabled: false });
 for (const id of [...messages, 'wa-late']) assert.equal(await isBlurred(wc, id), false, id + ' clears after disabling blur');
 await wc.executeJavaScript('document.getElementById("wa-variants").remove();window.scrollTo(0,0)');
 await save({ enabled: true });
 console.log('WHATSAPP MESSAGE BLUR PASS: incoming/outgoing, quotes/replies, readonly wrappers, metadata/Lexical/plain-text variants, independent media and editor guards, hover/reblur and dynamically arriving messages.');
};
