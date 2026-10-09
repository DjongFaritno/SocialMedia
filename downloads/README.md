# Unduh DuoChat

Untuk unduhan yang mengikuti rilis terbaru secara otomatis, buka [website DuoChat](https://djongfaritno.github.io/duochat/). Semua versi, termasuk prerelease, tersedia di [halaman GitHub Releases](https://github.com/DjongFaritno/SocialMedia/releases).

## Rilis saat ini — v0.1.10

Paket di bawah tersedia pada [GitHub Release v0.1.10](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.10). Repository sudah publik.

| Sistem operasi | Unduhan |
| --- | --- |
| Windows x64 | [DuoChat-0.1.10-Windows-x64-Setup.exe](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/DuoChat-0.1.10-Windows-x64-Setup.exe) |
| macOS Intel / Apple Silicon | [DuoChat-0.1.10-macOS-universal.dmg](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/DuoChat-0.1.10-macOS-universal.dmg) · [ZIP aplikasi](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/DuoChat-0.1.10-macOS-universal.zip) |
| Linux x64 | [DuoChat-0.1.10.AppImage](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/DuoChat-0.1.10.AppImage) |
| Debian / Ubuntu x64 | [duochat-desktop_0.1.10_amd64.deb](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/duochat-desktop_0.1.10_amd64.deb) |
| Fedora | [install-fedora.sh](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/install-fedora.sh), dipakai bersama AppImage v0.1.10 |

[SHA256SUMS.txt](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.10/SHA256SUMS.txt) tersedia untuk memeriksa integritas setiap unduhan.

## Windows dan macOS

Windows: unduh Setup.exe dari tabel di atas, lalu jalankan installer.

macOS: buka DMG dan seret DuoChat ke Applications. Jika muncul **“DuoChat” Not Opened**, pilih **Done**, kemudian buka **System Settings → Privacy & Security → Open Anyway**. Konfirmasikan Open Anyway lagi dan gunakan Touch ID atau Use Password… jika diminta. Ikuti [panduan macOS lengkap](../docs/install-macos.md).

Paket Mac menggunakan signature ad-hoc, belum memakai sertifikat Developer ID/notarization Apple. Installer Windows belum ditandatangani. OS dapat meminta konfirmasi keamanan.

## Linux AppImage

Unduh AppImage dari tabel di atas, buka terminal di folder unduhan, lalu jalankan:

```sh
chmod +x DuoChat-0.1.10.AppImage
./DuoChat-0.1.10.AppImage
```

Jika FUSE tidak tersedia:

```sh
./DuoChat-0.1.10.AppImage --appimage-extract-and-run
```

## Instalasi Fedora

Unduh **install-fedora.sh dan DuoChat-0.1.10.AppImage dari Release v0.1.10 yang sama**, lalu simpan bersama. Tutup DuoChat lama dan jalankan tanpa sudo:

```sh
bash install-fedora.sh
```

Skrip memverifikasi checksum AppImage, mengekstraknya agar tidak membutuhkan FUSE, memasang ke `~/.local/opt/duochat/0.1.10`, dan membuat pintasan menu aplikasi. Sesi login serta pengaturan tetap memakai folder data aplikasi yang sama. Versi sebelumnya tetap tersimpan untuk rollback. Instalasi di Fedora perlu dicoba pada perangkat Fedora pengguna.

## Setelah membuka aplikasi

- Hubungkan akun WhatsApp dan Telegram melalui panel masing-masing.
- Aktifkan **Izin** untuk kamera, mikrofon, dan notifikasi. Di Mac, periksa juga Privacy & Security → Microphone / Camera serta Notifications → DuoChat.
- **F11** untuk fullscreen; **Ctrl+Shift+H** (Mac: Cmd+Shift+H) untuk menyembunyikan atau menampilkan header.
- Pilih tema Dark, White, atau Auto di bagian bawah.
- About menampilkan versi, tombol **Tutup**, dan kredit **by Codex · prompt by TjongFaritno**.

Rilis v0.1.10 diterbitkan setelah pemeriksaan format dan uji buka aplikasi di Windows, macOS, serta Linux lulus. Login, panggilan, dan notifikasi nyata masih memerlukan pengujian dengan akun serta perangkat pengguna. Jangan memakai `--no-sandbox` untuk penggunaan sehari-hari.

## Isi folder downloads

Folder ini hanya memuat panduan unduhan. Semua installer dan checksum ada pada GitHub Releases agar tidak ada paket lama yang terlihat sebagai unduhan utama. Template installer Fedora berada di scripts/install-fedora.template.sh; workflow menghasilkan skrip release dengan versi dan checksum AppImage yang sesuai.

## Cek dan pembaruan otomatis

Versi ini membawa updater. Windows x64 dan AppImage Linux x64 mendukung unduh serta pemasangan setelah konfirmasi. macOS, .deb, dan Fedora hasil ekstraksi mendukung cek otomatis dengan unduhan manual. Pasang versi ini sekali jika sebelumnya memakai aplikasi tanpa updater. [Panduan pembaruan](../docs/updates.md).
