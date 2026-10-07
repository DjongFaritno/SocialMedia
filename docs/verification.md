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
