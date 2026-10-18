# Dukungan layanan

Kandidat 0.4.0-beta.1 menyediakan sepuluh pilihan layanan. Ini pembungkus situs resmi, bukan implementasi protokol layanan.

| Layanan baru | Halaman | Batas dukungan |
| --- | --- | --- |
| Messenger | https://www.facebook.com/messages/ | Halaman pesan Facebook; profil terpisah dari akun Facebook lain di DuoChat. |
| Facebook | https://www.facebook.com/ | Feed dan fitur web yang disediakan Meta. |
| Google Chat | https://chat.google.com/ | Eksperimental; Google dapat menolak autentikasi pada browser dalam aplikasi. |
| WeChat | https://web.wechat.com/ | Eksperimental; scan QR dari ponsel, hanya jika akun diizinkan memakai versi web. |

Keempat layanan baru belum memiliki adapter blur elemen yang diverifikasi. Tombol panel menampilkan **Blur belum tersedia**; aktivasi via IPC juga ditolak. Gunakan **Tutup sementara** atau **Kunci DuoChat** untuk menyembunyikan seluruh tampilan. Pilihan blur bersama tersimpan dan kembali berlaku saat panel diganti ke layanan yang mendukungnya.

Situs tetap berada dalam sandbox tanpa Node atau bridge DuoChat. Origin login Google hanya boleh dinavigasi oleh profil Google Chat dan tidak menerima izin mikrofon, kamera atau notifikasi Chat. Tautan keluar meminta konfirmasi. Browser luar memiliki sesi terpisah; DuoChat tidak menyalin cookies atau melewati kebijakan login penyedia. SSO perusahaan ke domain lain belum ditambahkan.

Panggilan, notifikasi OS, fitur media dan login akun nyata perlu dicoba di perangkat pengguna. Fixture lokal memverifikasi perilaku DuoChat, tidak membuktikan penyedia menerima login atau menyediakan seluruh fitur desktop/mobile.

Rujukan resmi:

- [Pesan Facebook](https://www.facebook.com/help/1071984682876123).
- [Perubahan Messenger web](https://www.facebook.com/help/messenger-app/804132271957789) (halaman bantuan dapat meminta login).
- [Akses Google Chat](https://support.google.com/chat/answer/7653601?hl=en).
- [Kebijakan Google tentang embedded webviews](https://developers.googleblog.com/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/).
- [WeChat Web](https://web.wechat.com/). Portal tidak dapat diperiksa otomatis dalam sesi pengembangan ini; kelayakan akun belum dikonfirmasi.

Prioritas berikutnya yang disarankan: Slack, Microsoft Teams, LinkedIn. Belum diimplementasikan dalam kandidat ini.
