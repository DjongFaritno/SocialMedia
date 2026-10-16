# Blur QC — 0.3.0-beta.8

Automated checks use isolated local HTTPS fixtures at the official service origins. They exercise the packaged Electron CSS engine, real configuration IPC and Chromium pointer input without logging into or fetching private accounts. Source-shaped variants cover known markup; passing fixtures does not certify every production layout or future DOM change.

| Scope | Automated coverage |
| --- | --- |
| WhatsApp | Metadata/data-id photos, background/canvas/video, quoted thumbnail, sticker, link/gallery/viewer/detail media; avatar placeholders and group/contact avatars; readonly messages |
| Telegram A/K | Chat-list/header names, archive peer summaries, reply text/sender/thumbnail independently, incoming/outgoing/quote variants |
| Instagram/Threads | Media behind controls, stacked poster/video, unrelated modal, click and reblur; Threads linked-post photo versus profile avatar |
| Discord/X | Message/preview/name/avatar/media/composer fixture; overlay image/video/poster, controls, hover-off and cleanup |
| Every service, left and right | Each category alone and all off; shared strength/preferences; four independent panel activation combinations; account swap, reload and dynamically added media |
| Two WhatsApp accounts | Same panel matrix with isolated sessions |
| Boundaries | Editor/composer opt-in, no remote bridge, Facebook login origin exclusion, original filters restored, helper markers removed |

Run `npm ci && npm run check && npm test`, then the desktop-build workflow. Linux first runs the interaction smoke before packaging. Windows/macOS/Linux each repeat it in the packaged application. A candidate is ready for device testing only after every job passes.

Acceptance on a real account:
1. With hover off, test incoming/outgoing photos, album, video, sticker, link preview, reply thumbnail, avatar, media viewer and the next incoming message.
2. Select only Media, only Avatars, then only Messages. Check the other categories stay clear; repeat on both panel sides and a second account.
3. Enable hover, point at one item and its play/control overlay, then leave it. A separate modal must not reveal media behind it.
4. Disable one panel, swap accounts, reload, and restart DuoChat. Check per-panel activation and shared preferences persist.
5. Repeat supported categories in Telegram, Discord, X, Instagram and Threads. Threads has no preview adapter; Discord/X/Instagram/Threads remain experimental and unknown layouts may be missed.

Use opaque panel covers or the application lock when the screen must be hidden reliably. Selective blur only covers recognized rendered elements.
