# DuoChat Linux x64

File `DuoChat-0.1.4.AppImage` disimpan melalui Git LFS. Download melalui halaman file GitHub menggunakan tombol Download. Jika cloning, pasang Git LFS lalu jalankan `git lfs pull`.

Setelah diunduh:

```sh
chmod +x DuoChat-0.1.4.AppImage
./DuoChat-0.1.4.AppImage
```

Jika FUSE tidak tersedia:

```sh
./DuoChat-0.1.4.AppImage --appimage-extract-and-run
```

Installer ini prototipe. Login, notifikasi nyata, telepon dan video call masih perlu diuji dengan akun sendiri. Paket Windows/macOS sudah dibangun dan diuji membuka aplikasi melalui GitHub Actions. Jangan menambahkan `--no-sandbox` untuk penggunaan sehari-hari.

## Instalasi Fedora

Unduh `install-fedora.sh` dan `DuoChat-0.1.4.AppImage` dari folder ini menggunakan tombol Download raw file. Simpan keduanya dalam folder yang sama. Buka terminal di folder tersebut dan jalankan:

```sh
bash install-fedora.sh
```

Skrip memverifikasi checksum, mengekstrak AppImage agar tidak membutuhkan FUSE, memasang di `~/.local/opt/duochat/0.1.4`, dan membuat pintasan di menu aplikasi. Jalankan tanpa sudo. File aplikasi yang sudah ada tidak ditimpa. Aplikasi mempertahankan pengaturan sandbox standar. Skrip diperiksa sintaksnya; instalasi di Fedora belum diverifikasi dari lingkungan cloud ini.

### Pembaruan dari versi sebelumnya

Tutup DuoChat sebelum menjalankan skrip terbaru. Versi 0.1.4 dipasang ke folder terpisah dan pintasan menu diarahkan ke versi baru. Folder data aplikasi, sesi Telegram/WhatsApp, dan tata letak memakai lokasi yang sama. Versi lama tetap tersimpan untuk rollback.

Versi 0.1.4 menyediakan fullscreen F11, sembunyikan/tampilkan header Ctrl+Shift+H, serta tema Dark/White/Auto. Pengaturan tema dan header tersimpan. Pilihan Tema dan tombol pemulihan header tersedia di bagian bawah.

About menampilkan versi aplikasi, kredit by Codex · prompt by Faritno, deskripsi singkat, dan link website Faritno. Buka lewat menu DuoChat atau tombol About di bagian bawah, termasuk saat header disembunyikan.

Logo baru tersedia pada launcher Linux, header dan About. File logo PNG asli tersedia di `src/assets/duochat-icon.png`.

## Windows dan macOS

Installer tersedia di [GitHub Release v0.1.4](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.4). Repository private: login ke akun GitHub yang memiliki akses.

- Windows x64: `DuoChat-0.1.4-Windows-x64-Setup.exe`; unduh dan jalankan installer.
- macOS Intel/Apple Silicon: `DuoChat-0.1.4-macOS-universal.dmg`; buka DMG dan seret DuoChat ke Applications. ZIP aplikasi juga tersedia.
- `SHA256SUMS.txt` tersedia untuk pemeriksaan integritas.

Paket prototipe belum menggunakan tanda tangan digital/notarization. OS dapat menampilkan peringatan kepercayaan. Di macOS, jika diblokir gunakan System Settings → Privacy & Security → Open Anyway setelah memastikan sumber dan checksum. Login/panggilan layanan perlu diuji dengan akun nyata pada perangkat masing-masing.

### Panduan macOS langkah demi langkah

Saat muncul **“DuoChat” Not Opened**, pilih **Done**, lalu buka **System Settings → Privacy & Security → Open Anyway**. Konfirmasikan **Open Anyway** lagi pada dialog berikutnya dan gunakan **Touch ID** atau **Use Password…** jika diminta. Baca [panduan macOS lengkap](../docs/install-macos.md) untuk urutan instalasi dan cara mulai memakai aplikasi.
