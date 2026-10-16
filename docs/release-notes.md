DuoChat 0.3.0-beta.8 — cakupan foto WhatsApp dan QC blur kedua panel.

- Memperbaiki teks pesan WhatsApp yang terlewat: pesan read-only tidak lagi dianggap kolom ketik, dan selector diperluas untuk metadata pesan serta markup Lexical.
- Tes tambahan mencakup pesan masuk/keluar, kutipan/balasan, caption, dan pesan baru tanpa reload.
- Blur interaktif langsung pada elemen layanan, menggantikan blur gambar snapshot.
- Atur sekali untuk semua panel dan akun: pesan/postingan, preview, nama, foto profil, media, dan kolom ketik.
- Hover atau fokus keyboard untuk membuka elemen sementara; tingkat blur 4–20 px.
- Kolom ketik tetap jelas secara default. Blur tidak menutup panel, jadi layanan tetap dapat dipakai.
- Pengaturan tersimpan dan mengikuti akun yang dibuka berikutnya. Adapter khusus WhatsApp/Telegram dan aturan awal Discord, X, Instagram, Threads; cakupan ditampilkan pada dialog.
- Penutup sementara dan kunci password/Touch ID tetap terpisah. Kunci otomatis saat mulai, OS lock/sleep atau idle tetap tersedia.
- Mempertahankan perbaikan login Instagram melalui Facebook di dalam sesi DuoChat.

Elemen yang tidak dikenali atau berubah setelah update situs dapat terlewat. Fixture otomatis menguji mekanisme di keenam layanan; akun nyata, sensor Touch ID, panggilan dan banner OS masih perlu diuji. Blur/kunci tidak mengenkripsi data profil. Lihat panduan privasi.

Windows x64: Setup.exe. macOS universal: DMG/ZIP ad-hoc, belum dinotarize Apple. Linux x64: AppImage/deb. Installer PR adalah kandidat uji, belum pembaruan publik.

by Codex · prompt by TjongFaritno
https://djongfaritno.github.io/


Blur dinyalakan terpisah lewat tombol di panel kiri atau kanan. Pilihan elemen, kekuatan blur, dan hover tetap satu pengaturan bersama. Mengganti akun tidak mengubah status blur panel tersebut. Pengaturan lama yang aktif dimigrasikan menjadi aktif pada kedua panel.

Instagram dan Threads: gambar/video dapat dibuka sementara saat hover di atas kontrol media, termasuk media dengan pointer-events nonaktif. Pemeriksaan posisi elemen berjalan lokal saat interaksi, tanpa membaca atau mengirim isi pesan. Overlay dialog lain tidak membuka media di belakangnya.


Privasi: checklist buka kunci dengan Windows Hello (Windows 11+) atau Touch ID, serta opsi terpisah untuk meminta verifikasi saat DuoChat dibuka. Password DuoChat tetap tersedia. Pembatalan tidak membuka kunci dan tidak mengulang prompt otomatis. [Panduan](../docs/privacy.md) · [Riset](../docs/biometric-research.md).


Kutipan reply Telegram Web A dan K di dalam pesan masuk/keluar kini mengikuti kategori blur: teks kutipan memakai **Isi pesan & postingan**, nama pengirim memakai **Nama**, dan thumbnail memakai **Media**. Hover hanya membuka bagian yang ditunjuk; opsi hover-off tetap dihormati. Tombol navigasi reply dan kolom ketik tetap dapat digunakan. Pengaturan tetap bersama, sementara Blur ON/OFF tetap per panel.


Nama kontak, grup, dan Saved Messages di daftar chat Telegram Web A kini mengikuti checklist **Nama kontak, grup & pengguna**. Ringkasan nama chat dalam arsip juga mengikuti kategori Nama, terpisah dari preview pesan dan foto profil. Label arsip, waktu, dan kontrol tetap jelas saat hanya nama dipilih. Hover membuka bagian yang ditunjuk, lalu blur kembali saat pointer pergi. Baris chat yang muncul tanpa reload ikut terlindungi.


QC media: foto WhatsApp berbasis metadata/data-id, canvas, background, kutipan, stiker, thumbnail, galeri dan viewer mendapat cakupan tambahan. Avatar (termasuk placeholder) tetap terpisah dari Media; emoji bukan foto profil. Hover media melalui kontrol overlay diuji pada keenam layanan. Threads membedakan tautan profil dari foto yang menaut ke postingan. Pengujian terkemas mencakup tiap kategori sendiri, kedua sisi panel, dua akun WhatsApp, empat kombinasi ON/OFF, pengaturan bersama, swap akun, reload dan media baru. Cakupan otomatis memakai fixture lokal; perubahan DOM layanan atau variasi akun nyata tetap dapat memerlukan penyesuaian.
