# DuoChat

Dua ruang. Akunnya terserah kamu.

DuoChat membuka dua akun layanan web berdampingan dalam satu aplikasi desktop. Versi pengembangan **0.3.0-beta.4** menambahkan multiakun WhatsApp, Telegram, Discord, X, Instagram, dan Threads. Panel memakai tampilan web resmi masing-masing layanan.

## Coba dan jalankan

Installer yang sudah diterbitkan ada di [GitHub Releases](https://github.com/DjongFaritno/SocialMedia/releases). Build kandidat dapat ditemukan pada artifact [GitHub Actions](https://github.com/DjongFaritno/SocialMedia/actions). Versi pada branch pengembangan belum otomatis tersedia sebagai rilis publik.

Untuk menjalankan source, gunakan Node.js 24 dan npm:

```sh
npm ci
npm start
```

## Akun dan dua panel

- Klik **+** di sidebar atau menu **DuoChat → Tambah akun**. Pilih layanan dan nama seperti Pribadi atau Toko kedua.
- Pilih akun dari dropdown panel kiri atau kanan. Memilih akun yang sudah tampil di sisi lain menukar kedua akun.
- Dua akun WhatsApp memiliki sesi terpisah. Login melalui UI layanan ketika akun pertama kali dibuka.
- Akun tambahan disimpan tanpa langsung membuka halaman. Akun lama yang keluar dari panel dapat dijeda atau dipertahankan aktif melalui konfirmasi.
- Buka **Kelola akun** (ikon roda gigi) untuk mengubah nama, memilih **Tetap aktif**, atau menghapus akun dari DuoChat. Nama disimpan ketika selesai diedit.
- Akun yang dijeda menutup halaman layanan, sehingga panggilan dan notifikasinya berhenti. Pilih **Tetap aktif** jika ingin melanjutkan panggilan saat berpindah akun. Akun yang terlihat selalu aktif.
- Hapus akun hanya setelah dikeluarkan dari kedua panel. Konfirmasi menghapus sesi dan data situs lokal, bukan akun atau percakapan di layanan. Minimal dua akun disimpan; maksimal 30.

Upgrade dari versi dua layanan mempertahankan partition WhatsApp/Telegram lama beserta pilihan izin, ukuran jendela, tema, dan rasio panel. Akun baru memiliki profil independen. Login tetap dapat kedaluwarsa karena kebijakan layanan.

## Tampilan dan izin

Slider/pembatas mengatur lebar panel kiri; tombol panah dan Home juga tersedia. **F11** masuk/keluar fullscreen. **Ctrl+Shift+H** (Mac: Cmd+Shift+H) mengaktifkan mode ringkas: header dan sidebar disembunyikan. Hover pada tepi kiri menampilkan sidebar sebagai overlay tanpa menggeser panel. Klik/Enter pada penanda tepi juga membuka sidebar; **Esc** menutupnya. Tombol **Tampilkan header & akun** tetap tersedia di footer.

Tema **White / Dark / Auto** mengikuti pilihan pengguna dan mengirim preferensi warna ke layanan. UI layanan dengan pengaturan tema manual dapat memerlukan pengaturan System/Auto sendiri.

Tombol **Izin** berlaku per akun untuk kamera, mikrofon, dan notifikasi. OS dapat meminta izin tambahan. Pencabutan memblokir permintaan berikutnya; tutup panggilan/muat ulang untuk menghentikan akses yang sudah berlangsung. **Muat ulang** mempertahankan sesi. **↗** membuka layanan di browser sesudah konfirmasi; browser memakai sesi tersendiri.

## Privasi

Buka **Privasi** untuk memasang password, memilih kunci saat mulai, saat komputer dikunci/sleep, atau setelah idle. **Ctrl/Cmd+Shift+L** mengunci aplikasi. Mac yang mendukung juga bisa memakai Touch ID. **Atur blur** memilih elemen yang diburamkan di semua panel dan akun: pesan/postingan, preview, nama, foto profil, media, atau kolom ketik. Hover/fokus menampilkan bagian yang ditunjuk; tingkat blur 4–20 px dapat diatur. **Blur ON/OFF** mengaktifkan atau mematikan efek di panel tersebut. Ikon **◌** menutup satu panel sepenuhnya tanpa memutus sesi. [Panduan privasi dan batas perlindungan](docs/privacy.md).

## Update, platform, dan batas

Cek update tersedia di menu, footer, dan About. Pemeriksaan otomatis memakai pengaturan yang sudah tersimpan. Unduh otomatis bersifat opt-in pada Windows x64 dan AppImage Linux x64; pemasangan meminta konfirmasi mulai ulang. macOS ad-hoc, deb, dan Fedora hasil ekstraksi memakai cek versi dan unduh manual.

Build tersedia untuk Windows x64, macOS universal, dan Linux x64 AppImage/deb. [Panduan Mac](docs/install-macos.md) menjelaskan Done → Privacy & Security → Open Anyway untuk paket yang belum dinotarize. Windows dapat menampilkan SmartScreen.

Panggilan, notifikasi, dan fitur lain mengikuti dukungan web layanan. Pilihan layanan baru tersedia, tetapi login, panggilan, dan notifikasi akun nyata pada tiap layanan/OS masih perlu diuji; fixture tidak membuktikan dukungan tersebut. Tidak ada chat UI buatan atau implementasi protokol tidak resmi. Screen sharing, unread gabungan, tray, dan start otomatis belum diimplementasikan.

Data sesi berada di direktori data aplikasi OS, bukan repository. Menutup jendela utama keluar dari aplikasi dan menghentikan semua akun. Tautan luar perlu konfirmasi; popup dari origin layanan yang diizinkan memakai sandbox dan sesi akun yang sama. Halaman layanan tidak mendapatkan Node atau API internal DuoChat.

## Pemeriksaan dan build

```sh
npm run check
npm test
npm run smoke
npm run dist:linux
# Pada OS yang bersangkutan:
npm run dist:windows
npm run dist:mac
```

Smoke memakai profil sementara dan fixture lokal. Ia memeriksa dua WhatsApp dengan cookie terpisah, pause/resume, tukar sisi, semua provider, overlay, tema, About, dan isolasi Node/IPC. Akun asli tidak digunakan. Artifact capture shell tidak menyertakan native service views.

GitHub Actions membangun dan menguji aplikasi pada ketiga OS untuk pull request. Publishing hanya dilakukan dari main setelah semua job lolos; artifact PR tidak otomatis menjadi update untuk pengguna.

Lihat [catatan big update](docs/big-update.md), [matriks penerimaan](docs/acceptance.md), dan [panduan unduh](downloads/README.md).

About menampilkan versi aplikasi, tombol Tutup, dan **by Codex · prompt by TjongFaritno**. Website: https://djongfaritno.github.io/.

Login Instagram lewat Facebook dibuka di DuoChat dengan profil akun Instagram yang sama. Login di browser luar tidak otomatis masuk ke sesi DuoChat. Jika tadi sudah login di browser, ulangi login dari panel setelah memasang beta terbaru.


Blur dinyalakan terpisah lewat tombol di panel kiri atau kanan. Pilihan elemen, kekuatan blur, dan hover tetap satu pengaturan bersama. Mengganti akun tidak mengubah status blur panel tersebut. Pengaturan lama yang aktif dimigrasikan menjadi aktif pada kedua panel.

Instagram dan Threads: gambar/video dapat dibuka sementara saat hover di atas kontrol media, termasuk media dengan pointer-events nonaktif. Pemeriksaan posisi elemen berjalan lokal saat interaksi, tanpa membaca atau mengirim isi pesan. Overlay dialog lain tidak membuka media di belakangnya.
