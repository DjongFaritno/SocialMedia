# DuoChat 0.2.0-beta.1 — multiakun dan layanan

Versi kandidat ini tetap menggunakan Electron. Scope RAM dan ukuran paket tidak diubah dalam update ini.

## Perubahan

Akun kini memiliki ID tetap, layanan, nama, pilihan Tetap aktif, dan izin per akun. WhatsApp dan Telegram lama mempertahankan partition persist:whatsapp dan persist:telegram; akun baru memakai partition berdasarkan UUID. Nama akun tidak digunakan sebagai nama folder/partition.

Dua panel memilih akun secara bebas dan saling menukar ketika akun yang dipilih sudah terlihat di sisi lain. Halaman hanya dibuat untuk akun yang terlihat atau dipilih tetap aktif. Keluar dari panel menampilkan pilihan menjaga koneksi atau menjeda akun; menjeda menutup view dan popup akun. Profil persisten tetap disimpan untuk login berikutnya. Menghapus akun memerlukan konfirmasi dan membersihkan storage/cache session yang terpisah.

WhatsApp, Telegram, Discord, X, Instagram, dan Threads memiliki URL web dan daftar origin navigasi yang eksplisit. Media/notifikasi tetap membutuhkan izin akun dan origin yang dipercaya. Popup memakai profil akun yang sama. Tidak ada akses Node/IPC shell dari layanan.

Mode ringkas menyembunyikan header/sidebar. Sidebar hover dan dialog akun menggunakan WebContentsView lokal tersendiri di atas service views, karena HTML shell berada di bawah native child views. Sidebar mengambang, tanpa mengubah bounds panel. Dialog memakai overlay seluruh jendela, keyboard Esc, dan kontrol Tutup. Origin dan sender IPC overlay divalidasi sama seperti shell.

## Validasi

Tes unit mencakup migrasi, korupsi settings, profil terpisah, dua slot unik, lifecycle akun, origin, izin media/notifikasi, dan updater. Smoke Electron memakai profil baru dan fixture lokal; tidak memakai akun nyata. Cookie satu WhatsApp tidak muncul pada WhatsApp kedua dan tetap tersedia setelah pause/resume. Tema, sidebar overlay, dialog, semua provider, About, dan sandbox diperiksa.

Notifikasi Telegram service-worker/fallback serta single-instance diuji ulang. CI ketiga OS membangun paket dan menjalankan smoke kandidat sebelum publishing.

## Uji akun nyata sebelum menyebut layanan sepenuhnya didukung

Untuk setiap layanan dan OS, periksa login, persistensi sesudah restart, upload/download, notifikasi foreground/background, serta suara/video bila tersedia. Instagram/Threads/X dapat memiliki perubahan login, redirect, atau fitur web. OAuth yang menuju origin di luar daftar tidak otomatis diberi akses; periksa kebutuhan login terlebih dahulu sebelum memperluas daftar.

Uji dua WhatsApp dengan akun berbeda, ganti nama setelah login, pindah panel, pause/resume, dan menghapus satu profil tanpa memengaruhi lainnya. Panggilan harus tetap aktif bila akun memilih Tetap aktif. Akun dijeda tidak menjanjikan notifikasi. Menutup aplikasi menghentikan semua akun; belum ada tray.

Migrasi tidak menghapus profil lama. Tidak ada jaminan mengembalikan semua konfigurasi baru ketika memakai aplikasi lama lagi; cadangkan profil bila melakukan uji downgrade. Jangan membagikan sesi atau data akun pada laporan bug.

by Codex · prompt by TjongFaritno
