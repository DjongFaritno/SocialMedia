# DuoChat — prototipe desktop

WhatsApp Web dan Telegram Web dalam satu jendela Electron. Kedua panel hidup bersamaan; ukuran awal 65:35 bisa diubah melalui slider atau pembatas, dan tersimpan bersama ukuran jendela.

## Installer Linux

Lihat [folder downloads](downloads/README.md). AppImage disimpan melalui Git LFS. Jika meng-clone repo untuk mengambil installer, pasang Git LFS dan jalankan `git lfs pull`. Source code dapat dijalankan tanpa mengambil installer.

## Menjalankan

Pasang Node.js 24 LTS dan npm. Buka terminal di folder proyek:

```sh
npm ci
npm start
```

Login langsung ke layanan pada panel masing-masing. WhatsApp: tautkan perangkat melalui QR di ponsel. Telegram: gunakan QR atau nomor telepon. Tekan **Izin** pada masing-masing panel untuk mengizinkan kamera, mikrofon, dan notifikasi; OS mungkin meminta izin tambahan. Setelah mengubah izin, coba lagi atau muat ulang panel bila diperlukan.

Gunakan slider atau pembatas untuk mengubah ukuran. Pembatas mendukung tombol panah kiri/kanan dan Home untuk kembali ke 65:35. **Muat ulang** memuat kembali layanan tanpa menghapus sesi. **↗** membuka layanan di browser setelah konfirmasi.

## Status dan batas versi 0.1

- Panel memakai layanan web asli, bukan tampilan chat buatan.
- Sesi login memakai partisi persisten terpisah. Cookie/data disimpan oleh Electron di folder data aplikasi OS, bukan di repo; folder ini tetap berisi data sensitif. Logout menggunakan menu resmi layanan.
- Kamera/mikrofon/notifikasi ditolak sampai diaktifkan lewat tombol Izin. Pencabutan izin memblokir permintaan berikutnya; tutup panggilan/muat ulang untuk menghentikan akses yang sudah berlangsung.
- Kedua panel tidak dipause saat jendela tidak aktif. Menutup jendela utama keluar dari aplikasi; belum ada tray atau start otomatis.
- Tautan luar membuka browser dengan konfirmasi. Popup dari origin resmi layanan diizinkan dengan sandbox dan sesi layanan yang sama.
- Dukungan panggilan suara/video ditentukan layanan web dan perangkat/OS. Belum terverifikasi dengan akun nyata. Tidak ada implementasi panggilan sendiri atau pemaksaan fitur aplikasi resmi.
- Panggilan dalam panel tetap menggunakan UI layanan. Jendela panggilan terpisah hanya tersedia jika layanan membuka popup; tidak ada pemisahan video buatan.
- Screen sharing, indikator unread gabungan, pembaruan otomatis, dan distribusi bertanda tangan belum tersedia.
- Aplikasi tidak menggabungkan isi pesan, tidak memiliki server penyimpan pesan, dan tidak meminta kredensial di luar UI resmi layanan.

## Pemeriksaan dan build

```sh
npm run check
npm test
npm run smoke
npm run pack
npm run dist
```

`smoke` memakai dua halaman fixture lokal, tidak mengakses akun atau membuktikan panggilan. Ia memeriksa pembuatan dua panel, pemisahan sesi, IPC, tata letak, dan isolasi Node, lalu menghasilkan `artifacts/shell.png` (shell UI saja; capturePage tidak menyertakan panel native).

Build installer pada OS target: Windows menghasilkan NSIS, macOS DMG, Linux AppImage/deb. Dukungan target dikonfigurasi; verifikasi masing-masing OS wajib sebelum distribusi. Build publik macOS/Windows membutuhkan signing/notarization. Lihat [matriks pengujian](docs/acceptance.md).

Data aplikasi biasanya ada di `%APPDATA%/duochat-desktop`, `~/Library/Application Support/duochat-desktop`, atau `~/.config/duochat-desktop`. Cadangkan hanya jika perlu; jangan membagikan folder sesi.
