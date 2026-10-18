# Unduh DuoChat

Installer yang sudah diterbitkan tersedia di [GitHub Releases](https://github.com/DjongFaritno/SocialMedia/releases). Folder ini hanya menyimpan panduan; installer dan checksum tidak dimasukkan ke repository.

Versi **2.0.1** membawa 13 layanan, multiakun, Bahasa Indonesia/English, kunci aplikasi dan blur per panel. Gunakan [rilis publik terbaru](https://github.com/DjongFaritno/SocialMedia/releases/latest) untuk instalasi; artifact workflow adalah kandidat pengembangan.

- Windows x64: pilih installer Setup.exe.
- macOS Intel/Apple Silicon: pilih DMG universal, lalu seret DuoChat ke Applications. [Panduan instalasi Mac](../docs/install-macos.md).
- Linux x64: pilih AppImage atau deb. AppImage perlu izin executable. Installer Fedora disediakan bersama AppImage pada rilis.

Gunakan SHA256SUMS dari rilis yang sama untuk memeriksa berkas. Versi baru dapat dicek lewat menu DuoChat, footer, atau About; mode pemasangan otomatis bergantung OS dan jenis instalasi.

[Petunjuk akun dan penggunaan](../README.md) · [Catatan big update](../docs/big-update.md)


Blur dinyalakan terpisah lewat tombol di panel kiri atau kanan. Pilihan elemen, kekuatan blur, dan hover tetap satu pengaturan bersama. Mengganti akun tidak mengubah status blur panel tersebut. Pengaturan lama yang aktif dimigrasikan menjadi aktif pada kedua panel.

Instagram dan Threads: gambar/video dapat dibuka sementara saat hover di atas kontrol media, termasuk media dengan pointer-events nonaktif. Pemeriksaan posisi elemen berjalan lokal saat interaksi, tanpa membaca atau mengirim isi pesan. Overlay dialog lain tidak membuka media di belakangnya.


Privasi: checklist buka kunci dengan Windows Hello (Windows 11+) atau Touch ID, serta opsi terpisah untuk meminta verifikasi saat DuoChat dibuka. Password DuoChat tetap tersedia. Pembatalan tidak membuka kunci dan tidak mengulang prompt otomatis. [Panduan](../docs/privacy.md) · [Riset](../docs/biometric-research.md).


Kutipan reply Telegram Web A dan K di dalam pesan masuk/keluar kini mengikuti kategori blur: teks kutipan memakai **Isi pesan & postingan**, nama pengirim memakai **Nama**, dan thumbnail memakai **Media**. Hover hanya membuka bagian yang ditunjuk; opsi hover-off tetap dihormati. Tombol navigasi reply dan kolom ketik tetap dapat digunakan. Pengaturan tetap bersama, sementara Blur ON/OFF tetap per panel.


Nama kontak, grup, dan Saved Messages di daftar chat Telegram Web A kini mengikuti checklist **Nama kontak, grup & pengguna**. Ringkasan nama chat dalam arsip juga mengikuti kategori Nama, terpisah dari preview pesan dan foto profil. Label arsip, waktu, dan kontrol tetap jelas saat hanya nama dipilih. Hover membuka bagian yang ditunjuk, lalu blur kembali saat pointer pergi. Baris chat yang muncul tanpa reload ikut terlindungi.


QC media: foto WhatsApp berbasis metadata/data-id, canvas, background, kutipan, stiker, thumbnail, galeri dan viewer mendapat cakupan tambahan. Avatar (termasuk placeholder) tetap terpisah dari Media; emoji bukan foto profil. Hover media melalui kontrol overlay diuji pada keenam layanan. Threads membedakan tautan profil dari foto yang menaut ke postingan. Pengujian terkemas mencakup tiap kategori sendiri, kedua sisi panel, dua akun WhatsApp, empat kombinasi ON/OFF, pengaturan bersama, swap akun, reload dan media baru. Cakupan otomatis memakai fixture lokal; perubahan DOM layanan atau variasi akun nyata tetap dapat memerlukan penyesuaian.
