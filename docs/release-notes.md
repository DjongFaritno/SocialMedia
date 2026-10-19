DuoChat 2.0.2 — pengaturan kembali kelihatan.

- Linux pada sesi Wayland dengan DISPLAY tersedia memakai XWayland secara default, mengikuti hasil diagnosis pengguna bahwa About dapat tampil lewat backend tersebut. Pilihan backend eksplisit tetap dihormati.
- Dialog Tambah akun, Kelola akun, Atur blur dan Privasi menyembunyikan permukaan panel chat sementara tanpa memutus sesi. Latar overlay Linux dibuat opak; posisi/lapisan overlay disiapkan sebelum menerima input, dan rendering overlay tidak ditunda saat tersembunyi.
- Menutup dialog memulihkan hanya panel yang aktif dan tidak ditutup oleh pengaturan privasi. Sidebar ringkas tetap menampilkan kedua chat.
- QC baru menguji hasil render dan screenshot dialog, klik/input/scroll/Escape, About berulang, serta proses panel yang tetap sama. Matrix Linux menguji X11, native Wayland headless, dan default XWayland tanpa flag disable-gpu. Pengujian otomatis memakai grafis virtual; perbaikan pada driver/GNOME Fedora pengguna masih perlu dikonfirmasi.

Perbaikan Google Chat 2.0.1 tetap disertakan. Gratis, tanpa iklan, tanpa langganan. Paket Windows x64, macOS universal, Linux AppImage/deb dan installer Fedora. Status signing dan cara update tiap OS tetap mengikuti rilis sebelumnya.

by Codex · prompt by TjongFaritno
