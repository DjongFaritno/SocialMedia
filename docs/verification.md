# Verifikasi rilis DuoChat v0.1.9

## Pemeriksaan wajib sebelum publikasi

Workflow [Build desktop installers](../.github/workflows/desktop-build.yml) membangun semua paket pada runner OS masing-masing. Job publish membutuhkan ketiga job platform lulus terlebih dahulu.

- Windows x64: pemeriksaan sintaks, tes unit, build NSIS, validasi header PE, dan smoke aplikasi packaged.
- macOS universal Intel/Apple Silicon: build DMG/ZIP, validasi trailer DMG dan executable universal, pemeriksaan signature ad-hoc dan entitlements mikrofon/kamera, lalu smoke aplikasi packaged. Runner macOS menjalankan executable Apple Silicon; Intel disertakan dalam universal bundle tetapi membutuhkan uji pada hardware Intel.
- Linux x64: build AppImage/deb, validasi ELF/AppImage dan Debian archive, generate skrip Fedora dengan checksum AppImage, validasi sintaks shell, dan smoke aplikasi packaged dalam Xvfb.
- Seluruh aset release mendapatkan SHA256SUMS.txt. Installer Fedora memverifikasi hash AppImage dari build yang sama.
- Pemeriksaan dokumentasi menolak tautan release versi lain dan installer/checksum yang tertinggal di folder downloads.

## Cakupan pengujian

Tes unit mencakup origin resmi, geometri panel, pemulihan pengaturan, identitas browser, tema/header, izin media/notifikasi per layanan, penggabungan permintaan mikrofon bersamaan, kamera ditolak tanpa menghalangi audio, serta pencabutan izin.

Smoke memakai halaman fixture dan folder userData sementara. Ia memeriksa dua panel aktif, sesi terpisah, IPC, koordinat, isolasi Node/preload, tema, hide/show header, versi dan kredit About, serta menutup About lewat tombol Tutup. Smoke Linux CI melewati screenshot opsional karena virtual display; pemeriksaan fungsi aplikasi tetap dijalankan.

Flag --no-sandbox hanya digunakan pada runner Linux/container pengujian, tidak pada launcher atau konfigurasi installer pengguna.

## Batas verifikasi

Login, transfer file, panggilan suara/video, dan notifikasi nyata perlu diuji dengan akun dan perangkat pengguna sesuai [pengujian penerimaan](acceptance.md). Tes mock izin macOS tidak membuktikan perilaku dialog OS pada setiap perangkat. Paket Mac menggunakan signature ad-hoc, belum Developer ID/notarization; Windows belum ditandatangani.

## Unduhan

[Release v0.1.9](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.9) memuat paket ketiga OS dan checksum. [Website DuoChat](https://djongfaritno.github.io/duochat/) mengikuti rilis lengkap terbaru secara otomatis.

## Regresi notifikasi service worker

Fixture HTTPS Telegram disajikan lewat protocol handler lokal pada sesi pengujian sendiri, tanpa akun maupun koneksi Telegram. Service worker melakukan navigator.permissions.query untuk notifikasi: hasil granted ketika izin layanan aktif, lalu denied setelah dicabut. Uji ini memeriksa jalur izin Electron, bukan kemunculan banner notifikasi pesan nyata pada OS pengguna.

## Jalur notifikasi Telegram

Fixture Electron dengan preload Telegram memverifikasi bahwa API notifikasi persisten tidak diiklankan, Notification biasa tetap tersedia, dan branch fallback Telegram memilih constructor notifikasi halaman. Preload tidak mengekspos Node atau IPC ke halaman. Navigasi fixture yang sama ke origin WhatsApp mempertahankan kemampuan browser aslinya. Constructor pada tes pemilihan branch direkam; tes tidak membuktikan kemunculan banner macOS. Banner dan klik/suara notifikasi nyata tetap membutuhkan pengujian akun/perangkat pengguna.

## Optimasi aset dan single-instance

Tes Linux menjalankan dua proses aplikasi dengan userData yang sama. Proses kedua harus keluar tanpa membuat jendela, proses pertama menerima second-instance, jendela tersembunyi ditampilkan kembali, dan ID ketiga WebContents tidak berubah. Ikon window/header/About berukuran kecil dikemas bersama aplikasi. [Audit sebelum/sesudah](memory-audit.md) menjelaskan hasil fixture dan batas perbandingan RAM.
