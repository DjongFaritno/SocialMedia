# Layanan DuoChat 0.4.0-beta.2

Tiga belas pilihan: WhatsApp, Telegram, Discord, X, Instagram, Threads, Messenger, Facebook, Google Chat, WeChat, Slack, Microsoft Teams, LinkedIn.

| Tambahan | Halaman awal | Batas login |
| --- | --- | --- |
| Messenger | https://www.facebook.com/messages/ | Profil terpisah dari pilihan Facebook. |
| Facebook | https://www.facebook.com/ | Login dan fitur mengikuti Meta. |
| Google Chat | https://chat.google.com/ | Google dapat menolak browser dalam aplikasi. |
| WeChat | https://web.wechat.com/ | QR dari ponsel; akses web bergantung akun. |
| Slack | https://app.slack.com/client/ | Workspace Slack dibuka untuk autentikasi saja; IdP perusahaan eksternal belum diizinkan. |
| Microsoft Teams | https://teams.cloud.microsoft/v2/ | Situs Teams kerja/pribadi didukung; kebijakan tenant bisa membatasi login/perangkat. |
| LinkedIn | https://www.linkedin.com/feed/ | Feed dan pesan versi web; login pihak ketiga di luar origin LinkedIn tidak dipindahkan ke DuoChat. |

Setiap akun punya sesi tersendiri. Akun tambahan dimuat saat dipilih, dua panel aktif, opsi Tetap aktif mempertahankan akun latar belakang. Login di browser luar tidak menyalin sesi ke DuoChat.

Blur tersedia dengan adapter elemen pada ketiga belas layanan. ON/OFF tetap per panel; kategori, kekuatan dan hover satu pengaturan bersama. Google Chat belum memiliki selector preview daftar chat yang terverifikasi, sehingga kategori itu tidak diklaim didukung. Detail kategori tersedia pada Atur blur → Cakupan per layanan. [Referensi dan batas QC](blur-services.md).

Auth Google/Microsoft/Slack workspace tidak menerima izin kamera/mikrofon/notifikasi dari layanan chat. Halaman layanan tetap sandbox tanpa Node atau bridge internal. Login, panggilan dan notifikasi akun nyata belum diverifikasi untuk semua penyedia/OS.

Referensi: [Slack web login](https://slack.com/help/articles/212681477-Sign-in-to-Slack), [Teams web](https://support.microsoft.com/en-us/teams/meetings/use-microsoft-teams-on-the-web), [LinkedIn Messaging](https://www.linkedin.com/help/linkedin/answer/a564261), [Google Chat](https://support.google.com/chat/answer/7653601?hl=en), [Google embedded-browser policy](https://developers.googleblog.com/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/), [WeChat Web](https://web.wechat.com/).
