# Blur layanan tambahan

Adapter beta.2 memperluas enam layanan sebelumnya ke Messenger, Facebook, WeChat, Slack, LinkedIn. CSS dipasang hanya pada origin konten resmi, bukan origin autentikasi. Tidak membaca isi chat, menyalin cookies, atau menambahkan bridge ke situs.

## Referensi struktur

Selector disusun ulang untuk kategori DuoChat, bukan memasang atau menyalin ekstensi lain.

- Messenger: [HideMeChat utilities](https://github.com/yvantot/HideMeChat/blob/main/js/content/utilities.js) mendokumentasikan data-scope messages_table, dir=auto, data-virtualized, nama/preview dan media. Class minified hanya fallback tambahan.
- Facebook: [struktur feed Pages](https://github.com/browser-use/browser-harness/blob/main/agent-workspace/domain-skills/facebook/pages.md) memakai role article, data-ad-preview/data-ad-comet-preview dan tautan heading. Facebook juga memakai adapter pesan Messenger.
- WeChat: [userscript sumber](https://greasyfork.org/el/scripts/389533-make-wechat-to-dingtalk/code) memakai bubble_cont/plain dan header nickname. Aturan beta memakai struktur Web WeChat lama; akun yang tidak diizinkan memakai web tetap tidak bisa login.
- Slack: [Slack Privacy Extension CSS](https://github.com/33j33/Slack-Privacy-Extension/blob/main/extension/styles.css) memberi referensi rich text, file dan attachments. Selector data-qa dan kelas UI dipakai untuk kategori terpisah.
- LinkedIn: [laporan selector Stylus](https://github.com/openstyles/stylus/issues/1986) mencatat event body, composer, participant names dan feed commentary. Aturan feed/media mencakup keluarga kelas update-components dan messaging.

## QC dan batasnya

Fixture adalah markup struktural representatif, bukan salinan data akun. Chromium menguji selector valid dan efek computed style, setiap kategori sendiri, kategori nonaktif, editor, konten baru, hover/reblur, sibling controls pada gambar/video/poster, modal lain, dua sisi panel, empat kombinasi ON/OFF, pengaturan bersama, dua profil WhatsApp, swap dan reload. Semua layanan terdaftar harus masuk matriks; layanan baru tanpa fixture/adapter akan menggagalkan QC.

Referensi kode bukan jaminan DOM layanan tidak berubah. Variasi DOM aktual, shadow DOM/iframe, bahasa, eksperimen A/B, login, panggilan dan notifikasi OS belum diverifikasi di akun nyata pada sesi ini. Adapter tambahan tetap ditandai awal di UI. Periksa layar sebelum membagikan; Tutup sementara dan Kunci menutup native view sepenuhnya.
