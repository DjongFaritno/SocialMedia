# Layanan DuoChat 2.0.6

Sebelas pilihan: WhatsApp, Telegram, Discord, X, Instagram, Threads, Messenger, Facebook, WeChat, Slack, LinkedIn.

| Layanan tambahan | Halaman awal | Batas login |
| --- | --- | --- |
| Messenger | https://www.facebook.com/messages/ | Profil terpisah dari Facebook. |
| Facebook | https://www.facebook.com/ | Login dan fitur mengikuti Meta. |
| WeChat | https://web.wechat.com/ | QR dari ponsel; akses web bergantung akun. |
| Slack | https://app.slack.com/client/ | Workspace Slack untuk autentikasi saja; IdP perusahaan eksternal belum diizinkan. |
| LinkedIn | https://www.linkedin.com/feed/ | Feed/pesan versi web; login pihak ketiga tidak memindahkan sesi ke DuoChat. |

Setiap akun punya sesi sendiri. Dua panel dapat aktif bersamaan; Tetap aktif mempertahankan akun lain di latar belakang. Login di browser luar tidak menyalin sesi ke DuoChat.

Blur tersedia pada elemen yang dikenali di sebelas layanan aktif. ON/OFF per panel; kategori, kekuatan dan hover berlaku bersama. Dukungan preview berbeda per layanan; lihat Atur blur → Cakupan per layanan dan [batas QC](blur-services.md).

Google Chat dan Microsoft Teams sementara tidak tersedia pada rilis publik. Implementasinya disimpan di [branch riset terpisah](https://github.com/DjongFaritno/SocialMedia/tree/research/google-chat-ms-teams). Akun lama diarsipkan sebagai metadata nonaktif, folder sesinya dipertahankan, dan panel diganti dengan akun yang masih didukung. Akun arsip tidak dimuat walaupun sebelumnya Tetap aktif.

Referensi: [Slack web login](https://slack.com/help/articles/212681477-Sign-in-to-Slack), [LinkedIn Messaging](https://www.linkedin.com/help/linkedin/answer/a564261), [WeChat Web](https://web.wechat.com/).
