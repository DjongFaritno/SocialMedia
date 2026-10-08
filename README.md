# DuoChat — prototipe desktop

WhatsApp Web dan Telegram Web dalam satu jendela Electron. Kedua panel hidup bersamaan; ukuran awal 65:35 bisa diubah melalui slider atau pembatas, dan tersimpan bersama ukuran jendela.

## Installer Linux

Paket terbaru tersedia di [Release v0.1.7](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.7), termasuk AppImage, .deb, dan installer Fedora. [Folder downloads](downloads/README.md) hanya berisi panduan. Semua installer dan checksum berada di GitHub Releases. Source code dapat dijalankan tanpa mengunduh installer atau mengambil file Git LFS.

## Menjalankan

Pasang Node.js 24 LTS dan npm. Buka terminal di folder proyek:

```sh
npm ci
npm start
```

Login langsung ke layanan pada panel masing-masing. WhatsApp: tautkan perangkat melalui QR di ponsel. Telegram: gunakan QR atau nomor telepon. Tekan **Izin** pada masing-masing panel untuk mengizinkan kamera, mikrofon, dan notifikasi; OS mungkin meminta izin tambahan. Setelah mengubah izin, coba lagi atau muat ulang panel bila diperlukan.

Gunakan slider atau pembatas untuk mengubah ukuran. Pembatas mendukung tombol panah kiri/kanan dan Home untuk kembali ke 65:35. **Muat ulang** memuat kembali layanan tanpa menghapus sesi. **↗** membuka layanan di browser setelah konfirmasi.

## Status dan batas versi 0.1.7

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

## Identitas browser

Panel layanan menggunakan identitas browser Chromium standar dengan versi mesin yang sebenarnya, tanpa token aplikasi/Electron. Perubahan ini menangani dugaan penyebab halaman WhatsApp yang meminta Chrome 100+ meskipun mesin aplikasinya Chromium 152. Tes lokal memeriksa identitas browser di kedua panel. Akses langsung ke WhatsApp dari cloud belum tersedia, sehingga login tetap perlu diuji pada perangkat pengguna.

## Tampilan

- **F11**: masuk/keluar fullscreen. Menu dan header DuoChat otomatis disembunyikan saat masuk fullscreen.
- **Esc**: keluar fullscreen.
- **Ctrl+Shift+H** (macOS: Cmd+Shift+H): sembunyikan/tampilkan header. Bekerja saat fokus berada di WhatsApp/Telegram; pilihan jendela biasa tersimpan.
- Tombol **Tampilkan header** di bawah tetap tersedia saat header tersembunyi. Pembatas kedua panel tetap bisa digeser.
- Pilihan **Tema** di bawah: Dark, White, Auto. Auto mengikuti tema OS; pilihan tersimpan. Preferensi warna browser juga diteruskan ke kedua layanan. Jika layanan memilih tema manual sendiri, ubah pengaturan temanya menjadi System/Auto untuk mengikuti DuoChat.
- Keluar fullscreen mengembalikan pilihan header jendela biasa. Fullscreen tidak dipaksakan saat membuka aplikasi berikutnya.

## About

Buka menu DuoChat → About DuoChat atau tombol About di bagian bawah. Versi diambil langsung dari aplikasi. Kredit: **by Codex · prompt by TjongFaritno**. Link website: https://djongfaritno.github.io/.

“WhatsApp di kiri, Telegram di kanan. Biar ngobrol tetap nyambung tanpa bolak-balik jendela. Atur tampilannya sesukamu, lalu lanjut chat dengan santai.”

## Logo

Dua gelembung chat mint dan biru di atas hijau tua menggambarkan dua percakapan dalam satu ruang kerja. Logo asli PNG: [src/assets/duochat-icon.png](src/assets/duochat-icon.png). Dipakai pada ikon aplikasi, header, dan About; electron-builder menghasilkan ukuran ikon platform dari PNG tersebut.

## Windows dan macOS

Workflow [Build desktop installers](.github/workflows/desktop-build.yml) membangun Windows x64 NSIS, macOS universal DMG/ZIP, dan Linux x64 AppImage/deb pada runner OS masing-masing. Setelah pemeriksaan paket dan smoke aplikasi lulus, workflow membuat GitHub prerelease dengan installer serta SHA256SUMS.

Build ini belum ditandatangani/notarized. Windows dapat menampilkan SmartScreen; macOS dapat meminta persetujuan melalui System Settings → Privacy & Security → Open Anyway. Verifikasi sumber dan checksum sebelum membuka. Tidak perlu menonaktifkan perlindungan OS secara global.

Untuk build lokal: `npm ci`, lalu `npm run dist:windows` pada Windows atau `npm run dist:mac` pada macOS. Smoke GitHub Actions memakai fixture lokal; login dan panggilan tetap perlu diuji di perangkat pengguna.

Release memakai tag `v<version>`. Sebelum menerbitkan perubahan berikutnya, naikkan versi di package.json agar tag versi yang sudah diterbitkan tidak dipakai ulang untuk commit lain.

## Instalasi dan penggunaan macOS

Lihat [panduan macOS lengkap](docs/install-macos.md). Jika muncul **“DuoChat” Not Opened**, pilih **Done**, lalu buka **System Settings → Privacy & Security → Open Anyway**. Konfirmasikan **Open Anyway** pada dialog berikutnya dan autentikasi memakai **Touch ID** atau **Use Password…** jika diminta.
