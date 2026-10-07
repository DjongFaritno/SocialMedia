# Unduh DuoChat

Untuk unduhan yang mengikuti rilis terbaru secara otomatis, buka [website DuoChat](https://djongfaritno.github.io/duochat/). Semua versi, termasuk prerelease, tersedia di [halaman GitHub Releases](https://github.com/DjongFaritno/SocialMedia/releases).

## Rilis saat ini — v0.1.5

Paket di bawah tersedia pada [GitHub Release v0.1.5](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.5). Repository sudah publik.

| Sistem operasi | Unduhan |
| --- | --- |
| Windows x64 | [DuoChat-0.1.5-Windows-x64-Setup.exe](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/DuoChat-0.1.5-Windows-x64-Setup.exe) |
| macOS Intel / Apple Silicon | [DuoChat-0.1.5-macOS-universal.dmg](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/DuoChat-0.1.5-macOS-universal.dmg) · [ZIP aplikasi](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/DuoChat-0.1.5-macOS-universal.zip) |
| Linux x64 | [DuoChat-0.1.5.AppImage](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/DuoChat-0.1.5.AppImage) |
| Debian / Ubuntu x64 | [duochat-desktop_0.1.5_amd64.deb](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/duochat-desktop_0.1.5_amd64.deb) |
| Fedora | [install-fedora.sh](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/install-fedora.sh), dipakai bersama AppImage v0.1.5 |

[SHA256SUMS.txt](https://github.com/DjongFaritno/SocialMedia/releases/download/v0.1.5/SHA256SUMS.txt) tersedia untuk memeriksa integritas setiap unduhan.

## Windows dan macOS

Windows: unduh Setup.exe dari tabel di atas, lalu jalankan installer.

macOS: buka DMG dan seret DuoChat ke Applications. Jika muncul **“DuoChat” Not Opened**, pilih **Done**, kemudian buka **System Settings → Privacy & Security → Open Anyway**. Konfirmasikan Open Anyway lagi dan gunakan Touch ID atau Use Password… jika diminta. Ikuti [panduan macOS lengkap](../docs/install-macos.md).

Paket Mac menggunakan signature ad-hoc, belum memakai sertifikat Developer ID/notarization Apple. Installer Windows belum ditandatangani. OS dapat meminta konfirmasi keamanan.

## Linux AppImage

Unduh AppImage dari tabel di atas, buka terminal di folder unduhan, lalu jalankan:

```sh
chmod +x DuoChat-0.1.5.AppImage
./DuoChat-0.1.5.AppImage
```

Jika FUSE tidak tersedia:

```sh
./DuoChat-0.1.5.AppImage --appimage-extract-and-run
```

## Instalasi Fedora

Unduh **install-fedora.sh dan DuoChat-0.1.5.AppImage dari Release v0.1.5 yang sama**, lalu simpan bersama. Tutup DuoChat lama dan jalankan tanpa sudo:

```sh
bash install-fedora.sh
```

Skrip memverifikasi checksum AppImage, mengekstraknya agar tidak membutuhkan FUSE, memasang ke `~/.local/opt/duochat/0.1.5`, dan membuat pintasan menu aplikasi. Sesi login serta pengaturan tetap memakai folder data aplikasi yang sama. Versi sebelumnya tetap tersimpan untuk rollback. Instalasi di Fedora perlu dicoba pada perangkat Fedora pengguna.

## Setelah membuka aplikasi

- Hubungkan akun WhatsApp dan Telegram melalui panel masing-masing.
- Aktifkan **Izin** untuk kamera, mikrofon, dan notifikasi. Di Mac, periksa juga Privacy & Security → Microphone / Camera serta Notifications → DuoChat.
- **F11** untuk fullscreen; **Ctrl+Shift+H** (Mac: Cmd+Shift+H) untuk menyembunyikan atau menampilkan header.
- Pilih tema Dark, White, atau Auto di bagian bawah.
- About menampilkan versi, tombol **Tutup**, dan kredit **by Codex · prompt by TjongFaritno**.

Paket v0.1.5 lolos pemeriksaan format dan uji buka aplikasi di Windows, macOS, serta Linux. Login, panggilan, dan notifikasi nyata masih memerlukan pengujian dengan akun serta perangkat pengguna. Jangan memakai `--no-sandbox` untuk penggunaan sehari-hari.

## Arsip di folder ini — v0.1.4

File AppImage, install-fedora.sh, dan SHA256SUMS.txt yang tersimpan langsung dalam folder downloads ini adalah **arsip v0.1.4**. AppImage arsip disimpan melalui Git LFS. Jika cloning untuk mengambilnya, pasang Git LFS lalu jalankan `git lfs pull`.

Untuk pemasangan baru, gunakan paket dari tabel v0.1.5 di atas. Jangan memasangkan skrip Fedora arsip v0.1.4 dengan AppImage v0.1.5; checksum dan folder versinya berbeda.
