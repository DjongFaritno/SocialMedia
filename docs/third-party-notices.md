# Third-party notices

## WhatsApp selector references

A small number of current WhatsApp sidebar selector patterns in src/blur.cjs were adapted from [Privacy for WhatsApp Web (Auto Blur WA)](https://github.com/aryomuzakki/privacy-whatsapp-web-auto-blur). The interactive engine, configuration and UI are DuoChat implementations.

Original Copyright (c) 2024 Lukas Lenhardt - lukaslen.com

Fork & Maintenance Copyright (c) 2026 M Aryo Muzakki - muzakki.id

MIT License

Copyright (c) 2018-2024 Lukas Lenhardt - lukaslen.com
Copyright (c) 2026 M Aryo Muzakki - muzakki.id

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Telegram markup references

Reply selectors were checked against Telegram Web A [EmbeddedMessage](https://github.com/Ajaxy/telegram-tt/blob/master/src/components/common/embedded/EmbeddedMessage.tsx) (embedded-text-wrapper, message-title, embedded-thumb) and Telegram Web K [ReplyContainer](https://github.com/morethanwords/tweb/blob/master/src/components/chat/replyContainer.ts), [DivAndCaption](https://github.com/morethanwords/tweb/blob/master/src/components/divAndCaption.ts), and [message render](https://github.com/morethanwords/tweb/blob/master/src/components/chat/messageRender.ts) (reply-subtitle, reply-title, reply-media). Reviewed 16 October 2026. DuoChat uses class identifiers to target CSS and independently written synthetic fixtures; Telegram runtime code is not bundled by this change.
