DuoChat 0.1.8 memperbaiki pemilihan jalur notifikasi Telegram. Electron belum mengimplementasikan notifikasi persisten service worker. Pada halaman Telegram, kemampuan tersebut kini tidak diiklankan sehingga Telegram memakai fallback new Notification() miliknya sendiri, termasuk klik notifikasi dan suara. WhatsApp tidak diubah. Izin per layanan dan pengaturan notifikasi Telegram/OS tetap berlaku.

DuoChat brings WhatsApp Web and Telegram Web into one adjustable desktop workspace.

- Linux x64: download the AppImage (or .deb on Debian/Ubuntu). Fedora users can download install-fedora.sh together with the AppImage, then run bash install-fedora.sh without sudo.
- Windows x64: download the Setup.exe and run the installer.
- macOS Intel or Apple Silicon: download the universal DMG, open it, and drag DuoChat into Applications. A ZIP of the app is also available.
- F11: fullscreen; Ctrl+Shift+H (Cmd+Shift+H on Mac): hide/show header.
- Dark, White, Auto themes; About includes the version and Faritno's website.

## macOS: membuka aplikasi pertama kali

Paket ini ditandatangani ad-hoc untuk konsistensi identitas aplikasi lokal, belum memakai sertifikat Developer ID atau notarization Apple. Untuk DuoChat yang diunduh dari repository ini:

1. Buka DMG, seret DuoChat ke **Applications**, lalu buka dari Applications.
2. Saat muncul **“DuoChat” Not Opened**, pilih **Done**, bukan Move to Trash.
3. Buka ** → System Settings → Privacy & Security**; gulir ke **Security** dan klik **Open Anyway** untuk DuoChat.
4. Pada dialog **Open “DuoChat”?**, pilih **Open Anyway** lagi jika diminta.
5. Konfirmasikan dengan **Touch ID**, atau **Use Password…** dan password administrator Mac.
6. Buka DuoChat dari Applications jika belum terbuka, lalu login ke kedua layanan.

Urutan konfirmasi/autentikasi dapat berbeda sesuai versi macOS. Tidak perlu menonaktifkan perlindungan OS secara global. [Panduan macOS lengkap](https://github.com/DjongFaritno/SocialMedia/blob/main/docs/install-macos.md).

Windows builds are unsigned too, so an OS trust prompt may appear.

Build validation includes package format checks and launching the packaged app with local fixtures. Login, notifications, file transfers, and voice/video calls still require testing with real accounts on your device. Browser preferences affect service themes when those services use System/Auto.

by Codex · prompt by TjongFaritno
https://djongfaritno.github.io/
