# Blur layanan tambahan

Adapter beta.2 memperluas enam layanan sebelumnya ke Messenger, Facebook, Google Chat, WeChat, Slack, Microsoft Teams dan LinkedIn. CSS dipasang hanya pada origin konten resmi, bukan origin autentikasi. Tidak membaca isi chat, menyalin cookies, atau menambahkan bridge ke situs.

## Referensi struktur

Selector disusun ulang untuk kategori DuoChat, bukan memasang atau menyalin ekstensi lain.

- Messenger: [HideMeChat utilities](https://github.com/yvantot/HideMeChat/blob/main/js/content/utilities.js) mendokumentasikan data-scope messages_table, dir=auto, data-virtualized, nama/preview dan media. Class minified hanya fallback tambahan.
- Facebook: [struktur feed Pages](https://github.com/browser-use/browser-harness/blob/main/agent-workspace/domain-skills/facebook/pages.md) memakai role article, data-ad-preview/data-ad-comet-preview dan tautan heading. Facebook juga memakai adapter pesan Messenger.
- Google Chat: [chat-read](https://github.com/yangwhale/CloseCrab/blob/main/skills/browser-cli/scripts/chat-read) membedakan jsname bgckF/Zc1Emd untuk isi pesan dari data-topic-id/data-name untuk pengirim. [gchat-themes](https://github.com/upman/gchat-themes/blob/master/src/ruleSwaps.ts) memberi referensi Z4BnXb, t5F5nf dan nama sidebar. Struktur nF6pT/rogmqd adalah fallback layout lama. Preview daftar chat belum ditargetkan karena bukti struktur belum memadai.
- WeChat: [userscript sumber](https://greasyfork.org/el/scripts/389533-make-wechat-to-dingtalk/code) memakai bubble_cont/plain dan header nickname. Aturan beta memakai struktur Web WeChat lama; akun yang tidak diizinkan memakai web tetap tidak bisa login.
- Slack: [Slack Privacy Extension CSS](https://github.com/33j33/Slack-Privacy-Extension/blob/main/extension/styles.css) memberi referensi rich text, file dan attachments. Selector data-qa dan kelas UI dipakai untuk kategori terpisah.
- Teams: [Compact Channels stylesheet](https://gist.github.com/collinkostichuk-unity3d/233b540847629abdcb55b56d7d9ef8aa) dan [exporter sumber](https://greasyfork.org/en/scripts/537462-teams-chat-exporter/code) mendokumentasikan message-body/content, author dan avatar. Aturan list, editor dan attachment tetap bergantung varian klien.
- LinkedIn: [laporan selector Stylus](https://github.com/openstyles/stylus/issues/1986) mencatat event body, composer, participant names dan feed commentary. Aturan feed/media mencakup keluarga kelas update-components dan messaging.

## QC dan batasnya

Fixture adalah markup struktural representatif, bukan salinan data akun. Chromium menguji selector valid dan efek computed style, setiap kategori sendiri, kategori nonaktif, editor, konten baru, hover/reblur, sibling controls pada gambar/video/poster, modal lain, dua sisi panel, empat kombinasi ON/OFF, pengaturan bersama, dua profil WhatsApp, swap dan reload. Semua layanan terdaftar harus masuk matriks; layanan baru tanpa fixture/adapter akan menggagalkan QC.

Referensi kode bukan jaminan DOM layanan tidak berubah. Variasi DOM aktual, shadow DOM/iframe, bahasa, eksperimen A/B, login, panggilan dan notifikasi OS belum diverifikasi di akun nyata pada sesi ini. Adapter tambahan tetap ditandai awal di UI. Periksa layar sebelum membagikan; Tutup sementara dan Kunci menutup native view sepenuhnya.
