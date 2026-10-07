# Hasil verifikasi prototipe — 7 Oktober 2026

- Node.js 24.19.0; Electron 44.6.0; electron-builder 26.15.3; Linux x64.
- Pemeriksaan sintaks: lulus.
- Tiga tes unit origin, geometri, pemulihan pengaturan: lulus.
- Smoke desktop di Xvfb: dua view benar-benar memuat fixture, sesi berbeda, perubahan proporsi melalui IPC, koordinat panel, isolasi API Node/preload: lulus.
- Screenshot desktop utuh: `artifacts/smoke.png`, berisi fixture pengujian, bukan akun WhatsApp/Telegram.
- Container tidak mendukung sandbox Chromium standar. Smoke dijalankan dengan `--no-sandbox` khusus pengujian fixture; tidak dimasukkan ke konfigurasi/start aplikasi. Hasil ini tidak membuktikan sandbox proses pada komputer pengguna. Node integration tetap dimatikan, context isolation tetap aktif.
- Paket Linux unpacked dan AppImage berhasil dibuat.
- WhatsApp/Telegram tidak diuji dengan akun nyata karena tujuan layanan tidak tersedia pada kebijakan jaringan cloud. Login, notifikasi nyata, unggah/unduh, suara/video, dan interaksi kedua panel selama panggilan belum terverifikasi.
- Windows/macOS: konfigurasi target tersedia; build dan uji perangkat belum dijalankan.

Smoke memakai folder userData sementara sendiri agar tidak mengubah sesi/pengaturan pengguna.

## Pembaruan 0.1.1

- Mesin runtime diverifikasi: Electron 44.6.0, Chromium 152.0.7977.130.
- User-Agent dibersihkan dari token Electron/aplikasi, mempertahankan versi Chromium dan platform asli.
- Empat tes unit lulus, termasuk identitas browser Linux/Windows/macOS.
- Smoke desktop memverifikasi `navigator.userAgent` dan session User-Agent di kedua panel, tidak mengandung token Electron/aplikasi, serta sesuai versi mesin asli.
- Hasil halaman/login WhatsApp sesungguhnya belum terverifikasi di lingkungan cloud.

## Pembaruan 0.1.2

- Enam tes unit lulus, termasuk geometri panel ketika header tersembunyi dan validasi pengaturan tema.
- Smoke Linux/Xvfb: fullscreen masuk/keluar, header otomatis tersembunyi, header dapat dipulihkan di fullscreen, menu disembunyikan, Ctrl+Shift+H dari fokus Telegram memulihkan header: lulus.
- Tema Dark/White mengubah media query `prefers-color-scheme` pada kedua panel; Auto mengembalikan sumber tema ke sistem: lulus.
- Sesi dan web contents dipertahankan selama perubahan tampilan; halaman fixture tidak dimuat ulang.
- Tema manual milik WhatsApp/Telegram dapat mengesampingkan preferensi browser; tampilan akun nyata belum diuji di cloud.
- Smoke memakai `--no-sandbox` hanya untuk fixture di container sebagaimana catatan sebelumnya, bukan konfigurasi installer.

## Pembaruan 0.1.3

Smoke About: versi yang tampil sesuai app.getVersion(), kredit pembuat dan URL website sesuai permintaan, tidak ada akses Node, IPC About hanya dapat dipakai jendela About: lulus. Dialog mengikuti tema browser dan dapat dibuka melalui tombol About di bawah saat header tersembunyi. Tautan membuka URL tetap di browser OS. Navigasi dan popup dalam dialog ditolak.

## Pembaruan 0.1.4

Build AppImage memakai logo DuoChat sendiri melalui konfigurasi icon electron-builder, bukan ikon Electron bawaan. Logo ditampilkan pada header dan About serta diberikan pada BrowserWindow utama/About. Smoke aplikasi dan inspeksi tampilan About lulus.

## Build Windows/macOS — 7 Oktober 2026

[GitHub Actions run 37611373652](https://github.com/DjongFaritno/SocialMedia/actions/runs/37611373652) membangun source commit `927a11b620506729848bfa1053bfd936f8e3e26b`:

- Windows Server 2025 x64: pemeriksaan sintaks/unit, build NSIS, header PE dan ukuran installer, serta menjalankan aplikasi packaged dengan fixture lokal: lulus.
- macOS 15 Apple Silicon: pemeriksaan sintaks/unit, DMG/ZIP universal, trailer DMG, format executable universal, serta smoke aplikasi packaged: lulus. Smoke berjalan pada Apple Silicon; executable Intel disertakan tetapi tidak dijalankan pada hardware Intel dalam run ini.
- Installer serta SHA256SUMS sudah terunggah ke prerelease [v0.1.4](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.4).
- Build tanpa sertifikat signing/notarization. Kepercayaan OS, instalasi di perangkat pengguna, login, notifikasi nyata, dan panggilan masih memerlukan pengujian pengguna.
