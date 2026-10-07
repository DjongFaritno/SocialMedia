# Pasang DuoChat di macOS

DuoChat bisa dipakai di Mac Intel dan Apple Silicon lewat installer universal yang sama. Paket awal ini belum ditandatangani/notarized oleh Apple, jadi saat pertama dibuka macOS akan meminta persetujuanmu.

## Unduh dan pasang

1. Login ke GitHub, lalu buka [Release DuoChat v0.1.4](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.1.4).
2. Unduh **DuoChat-0.1.4-macOS-universal.dmg**.
3. Buka DMG, lalu seret **DuoChat** ke folder **Applications**.
4. Buka DuoChat dari **Applications**, bukan dari dalam DMG. Setelah selesai menyalin, DMG boleh di-eject.

## Kalau muncul “DuoChat” Not Opened

Mac lagi minta persetujuan dulu. Ikuti langkah ini untuk DuoChat yang kamu unduh dari repository ini:

1. Pada dialog **“DuoChat” Not Opened**, klik **Done**. Jangan pilih **Move to Trash**, karena itu akan memindahkan aplikasi ke Sampah.
2. Buka **Apple menu  → System Settings → Privacy & Security**.
3. Gulir ke bagian **Security**. Cari pemberitahuan bahwa DuoChat diblokir, lalu klik **Open Anyway**.
4. Jika muncul dialog **Open “DuoChat”?**, pilih **Open Anyway** lagi untuk mengonfirmasi.
5. Jika diminta autentikasi, gunakan **Touch ID**, atau klik **Use Password…** lalu masukkan nama pengguna dan password administrator Mac. Ini password Mac, bukan password GitHub atau akun chat.
6. Selesaikan konfirmasi yang ditampilkan, lalu buka DuoChat dari **Applications** jika aplikasi belum terbuka.

Urutan dialog konfirmasi dan autentikasi bisa sedikit berbeda antarversi macOS. Tidak perlu menonaktifkan Gatekeeper atau perlindungan macOS secara global.

Jika tombol **Open Anyway** belum terlihat, coba buka DuoChat sekali lagi dari Applications sampai peringatan muncul, pilih Done, lalu kembali ke Privacy & Security. Jika Mac dikelola kantor dan tombol tidak tersedia, hubungi administrator perangkat.

## Mulai pakai

- Login ke WhatsApp dan Telegram melalui panel masing-masing. Santai, cukup sekali lalu sesi akan tersimpan.
- Pilih **Izin** pada panel layanan untuk kamera, mikrofon, dan notifikasi. Jika macOS meminta izin kamera/mikrofon, pilih izinkan agar panggilan bisa memakai perangkat tersebut.
- Klik **Layar penuh** untuk fullscreen. Pintasan **F11** atau **Fn+F11** juga bisa dipakai jika tombol tersebut tidak diambil alih macOS.
- **Cmd+Shift+H** menyembunyikan atau menampilkan header. Tombol **Tampilkan header** tetap tersedia di bawah.
- Pilih **Dark**, **White**, atau **Auto** di bagian bawah untuk tema.

Kalau ingin memeriksa file unduhan, `SHA256SUMS.txt` tersedia di halaman Release. Dengan Terminal berada di folder unduhan, jalankan:

```sh
shasum -a 256 DuoChat-0.1.4-macOS-universal.dmg
```

Cocokkan hasilnya dengan baris DMG di `SHA256SUMS.txt`.

by Codex · prompt by Faritno

[Mampir ke website Faritno](https://djongfaritno.github.io/)
