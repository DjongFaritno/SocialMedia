# Privasi di DuoChat

Buka **Privasi** di footer atau menu DuoChat. Pasang password minimal 8 karakter, lalu pilih kapan aplikasi dikunci. Password tidak sama dengan password akun chat atau komputer. Fitur ini mati secara default untuk instalasi lama.

- **Kunci** di footer atau **Ctrl/Cmd+Shift+L** menutup kedua panel dengan layar pengunci. Saat belum punya password, tombol membuka pengaturan.
- **Saat dibuka** mengunci sebelum jendela aplikasi ditampilkan.
- **Saat komputer dikunci / sleep** memakai event lock-screen pada Windows/macOS dan suspend/resume. Linux tidak menyediakan event lock-screen yang sama lewat Electron; gunakan kunci manual, idle, atau suspend/resume. Dukungan event dan idle bergantung sesi desktop OS.
- **Idle** mengikuti waktu komputer tidak digunakan, bukan hanya waktu DuoChat tidak diklik. Pilihan: manual, 1, 5, 15, atau 30 menit. Pemeriksaan setiap 5 detik.
- **Touch ID** ditampilkan hanya jika macOS melaporkan dukungan. Aktifkan lewat Privasi; password tetap tersedia jika dibatalkan atau sensor tidak bisa dipakai. Windows Hello dan fingerprint Linux belum diintegrasikan.
- Ikon **◌** di kepala panel menutup panel itu dengan penutup polos. **Tampilkan panel** membukanya lagi. Ini penutup sementara tanpa password; gunakan Kunci untuk autentikasi. Penutup mengikuti sisi kiri/kanan sampai dibuka kembali, termasuk saat berganti akun, dan direset saat aplikasi ditutup. Belum ada blur gambar percakapan.

Panel layanan dan popup milik akun disembunyikan saat ditutup/dikunci. Halaman tidak dimuat ulang atau dihentikan, jadi sesi tetap tersambung. Panggilan yang sudah berjalan tidak sengaja dihentikan oleh kunci; suara tetap dapat terdengar. Menutup aplikasi tetap menghentikan semua akun. Kunci menolak permintaan izin baru, notifikasi baru melalui izin Chromium, popup baru, dan perubahan akun melalui IPC. Notifikasi yang sudah masuk ke Notification Center OS tidak dapat ditarik kembali oleh fitur ini. Suara pesan berasal dari situs dan tidak otomatis dimatikan.

## Password dan batas perlindungan

Password disimpan sebagai verifier scrypt dengan salt acak, bukan teks asli. Verifier hanya dibaca proses utama dan tidak dikirim lewat snapshot UI. Percobaan password salah diberi jeda bertingkat sampai 30 detik. Mengubah pengaturan/password atau mematikan kunci memerlukan password saat ini. Tidak ada password bawaan, password master, atau fitur lupa password.

Fitur ini melindungi tampilan dari orang yang memakai jendela DuoChat. Ia tidak mengenkripsi cookies, cache, database chat layanan, file unduhan, atau direktori profil. Pemilik akses file/proses komputer tetap dapat mengubah atau menghapus pengaturan. Gunakan akun OS, kunci perangkat, dan enkripsi disk untuk perlindungan data saat tersimpan. Screen sharing, thumbnail OS, notifikasi lama, dan aplikasi remote perlu diperhatikan terpisah.

Pengaturan kunci berada di **privacy.json** dalam direktori userData Electron, terpisah dari settings.json. File ditulis atomik dengan izin 0600 pada sistem yang mendukungnya. Jika file rusak, DuoChat menolak membuka percakapan; pulihkan cadangan yang valid. Jangan menghapus seluruh profil atau sesi chat untuk memperbaiki file ini.

## Pengujian

Unit test memeriksa hashing, password salah, jeda percobaan, perubahan password, pengaturan rusak, kegagalan tulis, idle, penutup panel, serta pembatalan dan balapan autentikasi Touch ID. Smoke aplikasi terkemas memeriksa UI privasi, visibilitas WebContentsView dan popup asli, batas IPC saat terkunci, unlock, dan sesi/proses layanan yang tetap sama. Runner tidak membuktikan sensor Touch ID, panggilan akun nyata, atau banner notifikasi OS pengguna.

Tidak ada renderer atau engine baru untuk privasi. Layar kunci memakai overlay yang sudah digunakan aplikasi. Scrypt memerlukan memori sementara saat memeriksa password; penambahan RAM aktual belum diukur.

Referensi implementasi: [Electron Touch ID](https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesprompttouchidreason-macos), [Electron powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor).
