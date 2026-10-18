// Service DOM adapters. Evidence and verification limits: docs/blur-services.md.
// Selectors identify structure only; no message text or account data is read.
const adapters = {
  "messenger": {
    "messages": [
      "[data-scope=\"messages_table\"] [dir=\"auto\"]:not(:has([dir=\"auto\"],img,video,canvas)):not(a *):not(:has(a)):not([role=\"heading\"]):not([role=\"heading\"] *)",
      "[data-scope=\"messages_table\"] .xi81zsa.x126k92a:not(:has(img,video))"
    ],
    "previews": [
      "[data-virtualized] a[href*=\"/messages/t/\"] span[aria-hidden=\"true\"]"
    ],
    "names": [
      "[data-virtualized] a[href*=\"/messages/t/\"] span[dir=\"auto\"]:not([aria-hidden]):not(:has([aria-hidden]))",
      "[role=\"main\"] h2",
      "[data-scope=\"messages_table\"] [role=\"heading\"]"
    ],
    "avatars": [
      "a[href*=\"/messages/t/\"] img",
      "[data-scope=\"messages_table\"] svg:has(image)",
      "[role=\"main\"] img[alt*=\"profile\" i]"
    ],
    "media": [
      "[data-scope=\"messages_table\"] img:not([alt*=\"profile\" i])",
      "[data-scope=\"messages_table\"] video",
      "[data-scope=\"messages_table\"] canvas",
      "[data-scope=\"messages_table\"] [role=\"img\"]:not(svg):not(:has(svg))"
    ],
    "composer": [
      "[role=\"main\"] [contenteditable=\"true\"][role=\"textbox\"]",
      "[role=\"dialog\"] [contenteditable=\"true\"][role=\"textbox\"]"
    ]
  },
  "facebook": {
    "messages": [
      "[data-ad-preview=\"message\"]:not(:has(img,video))",
      "[data-ad-comet-preview=\"message\"]:not(:has(img,video))"
    ],
    "previews": [],
    "names": [
      "[role=\"article\"] h3 a:not(:has(img,svg))",
      "[role=\"article\"] h4 a:not(:has(img,svg))",
      "[role=\"article\"] strong a:not(:has(img,svg))"
    ],
    "avatars": [
      "[role=\"article\"] a[href*=\"/user/\"] img",
      "[role=\"article\"] a[href*=\"/profile.php\"] img",
      "[role=\"article\"] svg:has(image)"
    ],
    "media": [
      "[role=\"article\"] img:not(a[href*=\"/user/\"] *):not(a[href*=\"/profile.php\"] *):not([alt*=\"profile\" i])",
      "[role=\"article\"] video",
      "[role=\"article\"] canvas"
    ],
    "composer": [
      "[role=\"main\"] [contenteditable=\"true\"][role=\"textbox\"]",
      "[role=\"dialog\"] [contenteditable=\"true\"][role=\"textbox\"]"
    ]
  },
  "googlechat": {
    "messages": [
      "[jsname=\"bgckF\"]:not(:has(img,video,canvas))",
      ".Zc1Emd:not(:has(img,video,canvas))",
      "[jsname=\"bgckF\"] :is(span,a):not(:has(img,video,canvas))",
      ".FMTudf"
    ],
    "previews": [],
    "names": [
      "[data-topic-id] [data-name]",
      ".Z4BnXb",
      ".t5F5nf",
      ".wR3Nid"
    ],
    "avatars": [
      "[data-topic-id] img:not([jsname=\"bgckF\"] *):not(.Zc1Emd *):not(.rogmqd *)",
      ".nF6pT img:not([jsname=\"bgckF\"] *):not(.Zc1Emd *):not(.rogmqd *)"
    ],
    "media": [
      "[jsname=\"bgckF\"] img",
      "[jsname=\"bgckF\"] video",
      "[jsname=\"bgckF\"] canvas",
      ".Zc1Emd img",
      ".nF6pT .rogmqd img",
      ".nF6pT video"
    ],
    "composer": [
      "[role=\"textbox\"][contenteditable=\"true\"]"
    ]
  },
  "wechat": {
    "messages": [
      ".bubble_cont .plain",
      ".bubble_cont .js_message_plain"
    ],
    "previews": [
      ".chat_item .msg"
    ],
    "names": [
      ".chat_item .nickname",
      ".chat_bd .nickname",
      ".title_wrap .title_name",
      ".header .info .nickname"
    ],
    "avatars": [
      ".avatar img",
      "img.avatar"
    ],
    "media": [
      ".bubble_cont .picture img",
      ".bubble_cont .video img",
      ".bubble_cont video",
      ".bubble_cont .emoticon img",
      ".bubble_cont canvas"
    ],
    "composer": [
      "#editArea[contenteditable=\"true\"]"
    ]
  },
  "slack": {
    "messages": [
      "[data-qa=\"message-text\"]",
      ".p-rich_text_section",
      ".c-message__body--automated",
      ".p-activity_ia4_page__item__message"
    ],
    "previews": [
      ".p-dm_browser__row .p-dm_browser__message_preview",
      ".p-dm_browser__message_preview"
    ],
    "names": [
      "[data-qa=\"message_sender_name\"]",
      ".c-message__sender_button",
      ".p-channel_sidebar__name",
      ".p-view_header__channel_title"
    ],
    "avatars": [
      ".c-avatar"
    ],
    "media": [
      ".c-files_container img",
      ".c-files_container video",
      ".c-files_container canvas",
      ".c-message_kit__attachments img",
      ".c-message_kit__attachments video"
    ],
    "composer": [
      "[data-slate-editor=\"true\"][contenteditable=\"true\"]",
      ".ql-editor[contenteditable=\"true\"]"
    ]
  },
  "teams": {
    "messages": [
      "[id^=\"message-body-\"] [id^=\"content-\"]:not(:has(img:not([itemtype*=\"Emoji\"]),video,canvas))",
      "[data-tid=\"message-body\"]:not(:has(img:not([itemtype*=\"Emoji\"]),video,canvas))",
      "[data-tid=\"message-content\"]:not(:has(img:not([itemtype*=\"Emoji\"]),video,canvas))"
    ],
    "previews": [
      "[data-testid=\"comfy-message\"]"
    ],
    "names": [
      "[data-tid=\"message-author-name\"]",
      "[data-tid=\"chat-title\"]",
      "[id^=\"title-chat-list-item_\"]"
    ],
    "avatars": [
      "[data-tid=\"message-avatar\"]",
      "[data-tid=\"post-message-header-avatar\"]",
      ".fui-Avatar"
    ],
    "media": [
      "[id^=\"message-body-\"] img:not([itemtype*=\"Emoji\"]):not(.fui-Avatar *)",
      "[data-tid=\"chat-pane-message\"] video",
      "[data-tid=\"channel-pane-message\"] video",
      "[data-tid=\"chat-pane-message\"] canvas"
    ],
    "composer": [
      "[contenteditable=\"true\"][role=\"textbox\"]",
      "[data-tid=\"ckeditor\"] [contenteditable=\"true\"]"
    ]
  },
  "linkedin": {
    "messages": [
      ".msg-s-event-listitem__body:not(:has(img,video,canvas))",
      ".feed-shared-update-v2__description",
      ".feed-shared-update-v2__commentary",
      ".update-components-text"
    ],
    "previews": [
      ".msg-conversation-card__message-snippet"
    ],
    "names": [
      ".msg-conversation-card__participant-names",
      ".msg-s-message-group__name",
      ".msg-overlay-bubble-header__title",
      ".update-components-actor__name",
      ".feed-shared-actor__name"
    ],
    "avatars": [
      ".msg-facepile-grid img",
      ".msg-s-message-group__avatar img",
      ".msg-s-message-group__profilelink img",
      ".update-components-actor__avatar img",
      ".feed-shared-actor__avatar img"
    ],
    "media": [
      ".msg-s-event-listitem__message-bubble img:not(.msg-s-message-group__avatar *)",
      ".msg-s-event-listitem video",
      ".feed-shared-image img",
      ".update-components-image img",
      ".feed-shared-update-v2 video",
      ".msg-s-event-listitem canvas"
    ],
    "composer": [
      ".msg-form__contenteditable[contenteditable=\"true\"]",
      "[role=\"textbox\"][contenteditable=\"true\"]"
    ]
  }
};
// Facebook includes the same messaging surfaces as the Messenger entry.
for (const key of Object.keys(adapters.messenger)) adapters.facebook[key] = [...new Set([...adapters.facebook[key], ...adapters.messenger[key]])];
module.exports = Object.freeze(adapters);
