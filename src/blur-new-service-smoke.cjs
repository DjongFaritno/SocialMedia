const assert = require('node:assert/strict');
const { ELEMENTS } = require('./blur.cjs');
const variants = {
  "messenger": {
    "html": "<div data-scope=\"messages_table\"><h4 role=\"heading\" id=\"extra-name\">Reply author</h4><div class=\"xi81zsa x126k92a\" id=\"extra-message\">Quoted text</div><svg width=\"24\" height=\"24\" id=\"extra-avatar\"><image width=\"24\" height=\"24\" href=\"__IMAGE__\"/></svg><img id=\"extra-media\" src=\"__IMAGE__\"></div>",
    "targets": {
      "messages": [
        "extra-message"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media"
      ]
    }
  },
  "facebook": {
    "html": "<div role=\"article\"><h4><a href=\"/profile\" id=\"extra-name\">Post author</a></h4><a href=\"/profile.php?id=extra\"><img id=\"extra-avatar\" src=\"__IMAGE__\"></a><div data-ad-comet-preview=\"message\" id=\"extra-message\">Alternate feed text</div><div><img id=\"extra-media\" src=\"__IMAGE__\"></div></div>",
    "targets": {
      "messages": [
        "extra-message"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media"
      ]
    }
  },
  "googlechat": {
    "html": "<div data-topic-id=\"extra-topic\" class=\"nF6pT\"><span data-name=\"Sender\" id=\"extra-name\">Sender</span><img id=\"extra-avatar\" src=\"__IMAGE__\"><div jsname=\"bgckF\" id=\"extra-message\">First consecutive message</div><div jsname=\"bgckF\" id=\"extra-consecutive\">Second consecutive message</div><div jsname=\"bgckF\"><span id=\"extra-quote\">Quoted text</span><img id=\"extra-thumb\" src=\"__IMAGE__\"></div><div class=\"wdoEHc\"><img id=\"extra-media\" src=\"__IMAGE__\"></div></div>",
    "targets": {
      "messages": [
        "extra-message",
        "extra-consecutive",
        "extra-quote"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media",
        "extra-thumb"
      ]
    }
  },
  "wechat": {
    "html": "<div class=\"chat_bd\"><span class=\"nickname\" id=\"extra-name\">Group sender</span><img class=\"avatar\" id=\"extra-avatar\" src=\"__IMAGE__\"><div class=\"bubble_cont\"><pre class=\"js_message_plain\" id=\"extra-message\">Alternate plain message</pre><div class=\"video\"><img id=\"extra-media\" src=\"__IMAGE__\"><video id=\"extra-video\"></video></div></div></div>",
    "targets": {
      "messages": [
        "extra-message"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media",
        "extra-video"
      ]
    }
  },
  "slack": {
    "html": "<div data-qa=\"message_container\"><button class=\"c-message__sender_button\" id=\"extra-name\">Thread author</button><div class=\"c-avatar\" id=\"extra-avatar\">AB</div><div class=\"p-rich_text_section\" id=\"extra-message\"><blockquote>Thread quote</blockquote></div><div class=\"c-message_kit__attachments\"><img id=\"extra-media\" src=\"__IMAGE__\"><video id=\"extra-video\"></video></div></div>",
    "targets": {
      "messages": [
        "extra-message"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media",
        "extra-video"
      ]
    }
  },
  "teams": {
    "html": "<div data-tid=\"channel-pane-message\"><span data-tid=\"message-author-name\" id=\"extra-name\">Channel author</span><div data-tid=\"post-message-header-avatar\" id=\"extra-avatar\"><img src=\"__IMAGE__\"></div><div id=\"message-body-extra\"><div id=\"content-extra\"><span id=\"extra-message\">Channel message</span><blockquote data-track-module-name=\"messageQuotedReply\"><span id=\"extra-quote\">Reply quote</span></blockquote></div><img id=\"extra-media\" src=\"__IMAGE__\"></div><div><img id=\"extra-attachment\" src=\"__IMAGE__\"><video id=\"extra-video\"></video></div><img itemtype=\"http://schema.skype.com/Emoji\" id=\"extra-emoji\" src=\"__IMAGE__\"></div>",
    "targets": {
      "messages": [
        "extra-message",
        "extra-quote"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media",
        "extra-attachment",
        "extra-video"
      ]
    }
  },
  "linkedin": {
    "html": "<div class=\"feed-shared-update-v2\"><div class=\"update-components-actor__avatar\" id=\"extra-avatar\"><img src=\"__IMAGE__\"></div><span class=\"update-components-actor__name\" id=\"extra-name\">Feed author</span><div class=\"update-components-text\" id=\"extra-message\">Feed post</div><div class=\"update-components-image\"><img id=\"extra-media\" src=\"__IMAGE__\"></div><video id=\"extra-video\"></video></div>",
    "targets": {
      "messages": [
        "extra-message"
      ],
      "names": [
        "extra-name"
      ],
      "avatars": [
        "extra-avatar"
      ],
      "media": [
        "extra-media",
        "extra-video"
      ]
    }
  }
};
module.exports = async ({wc,save,move,hover,isBlurred,service}) => {
 const variant=variants[service]; if(!variant)return;
 const evaluate=code=>wc.executeJavaScript(code);
 const image='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
 const markup='<section id="extra-variants">'+variant.html.replaceAll('__IMAGE__',image)+'</section>';
 await evaluate('document.body.insertAdjacentHTML("beforeend",'+JSON.stringify(markup)+')');
 const empty=Object.fromEntries(ELEMENTS.map(key=>[key,false]));
 for(const category of ['messages','names','avatars','media']){
  await save({enabled:true,revealOnHover:false,elements:{...empty,[category]:true}});
  await move(wc,2,2);
  for(const [key,ids] of Object.entries(variant.targets))for(const id of ids)assert.equal(await isBlurred(wc,id),key===category,service+' alternate '+category+' / '+id);
  if(service==='teams')assert.equal(await isBlurred(wc,'extra-emoji'),false,'standalone emoji is not attachment media/avatar');
 }
 await save({enabled:true});
 await evaluate('document.getElementById("extra-message").scrollIntoView({block:"center"})');
 await hover(wc,'extra-message');assert.equal(await isBlurred(wc,'extra-message'),false,service+' alternate message hover');
 assert.equal(await isBlurred(wc,'extra-name'),true,service+' hovered reply does not reveal author');
 await move(wc,2,2);assert.equal(await isBlurred(wc,'extra-message'),true,service+' alternate message reblur');
 await evaluate('document.getElementById("extra-variants").remove();window.scrollTo(0,0)');
 console.log('ALTERNATE SERVICE BLUR PASS: '+service+' feed/thread/quote variants, author/avatar/media separation and hover/reblur');
};
