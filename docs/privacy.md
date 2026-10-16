# Privasi di DuoChat

Buka **Privasi** di footer atau menu DuoChat. Pasang password minimal 8 karakter, lalu pilih kapan aplikasi dikunci. Password tidak sama dengan password akun chat atau komputer. Fitur ini mati secara default untuk instalasi lama.

- **Kunci** di footer atau **Ctrl/Cmd+Shift+L** menutup kedua panel dengan layar pengunci. Saat belum punya password, tombol membuka pengaturan.
- **Saat dibuka** mengunci sebelum jendela aplikasi ditampilkan.
- **Saat komputer dikunci / sleep** memakai event lock-screen pada Windows/macOS dan suspend/resume. Linux tidak menyediakan event lock-screen yang sama lewat Electron; gunakan kunci manual, idle, atau suspend/resume. Dukungan event dan idle bergantung sesi desktop OS.
- **Idle** mengikuti waktu komputer tidak digunakan, bukan hanya waktu DuoChat tidak diklik. Pilihan: manual, 1, 5, 15, atau 30 menit. Pemeriksaan setiap 5 detik.
- **Windows Hello / Touch ID** tersedia sebagai checklist di Privasi. Windows Hello memerlukan Windows 11+ dan pengaturan Hello pada akun Windows; metode wajah, sidik jari, atau PIN dipilih oleh OS. Touch ID memerlukan Mac yang mendukung dan fingerprint terdaftar. Jika tidak tersedia, checklist menjelaskan alasannya. Fingerprint Linux belum diintegrasikan.
- **Minta Windows Hello/Touch ID saat DuoChat dibuka** adalah checklist terpisah, hanya tersedia ketika metode biometrik dan kunci saat dibuka dicentang. Tidak aktif otomatis pada instalasi lama. Prompt muncul sekali setelah layar kunci siap; batal/gagal tetap terkunci dengan pilihan password dan coba biometrik lagi.
- Mengaktifkan biometrik memerlukan verifikasi OS sekali saat menyimpan. Perubahan pengaturan yang sudah ada tetap memerlukan password DuoChat saat ini. Data fingerprint/wajah/PIN tidak diterima DuoChat. [Riset dan keputusan implementasi](biometric-research.md).
- Ikon **◌** di kepala panel menutup seluruh panel sementara tanpa password. **Tampilkan panel** membukanya lagi. Penutup mengikuti sisi kiri/kanan sampai dibuka kembali dan direset saat aplikasi ditutup.
- **Atur blur** membuka konfigurasi bersama untuk semua panel/akun, termasuk akun yang dibuka nanti. Pilih pesan/postingan, preview pesan, nama kontak/grup/pengguna, foto profil, media, dan kolom ketik. Default semua dipilih kecuali kolom ketik; blur sendiri masih opt-in.
- **Blur ON/OFF** bekerja terpisah pada masing-masing panel; konfigurasi elemen, kekuatan, dan hover tetap bersama. Mengaktifkan blur tidak menutup panel atau memblokir interaksinya. Pengaturan ini tidak memerlukan password; perubahan ditolak ketika aplikasi terkunci.
- Tingkat blur: **4–20 px**. **Hover atau fokus keyboard** membuka elemen yang ditunjuk sementara. Nonaktifkan opsi ini agar elemen selalu buram sampai blur dimatikan. Kolom ketik tetap jelas secara default dan tidak menyentuh password/login.
- Aturan dipasang hanya pada origin resmi tiap layanan, bukan halaman login Facebook atau tautan luar. CSS mengikuti elemen baru saat percakapan diperbarui dan dipasang ulang setelah reload/SPA navigation. Tidak mengambil screenshot, tidak membaca pesan untuk dikirim ke proses utama, dan tidak menambah bridge Node/IPC pada halaman layanan.

### Cakupan blur

WhatsApp/Telegram memiliki aturan khusus. Discord, X, Instagram, dan Threads memiliki adapter awal; pilihan yang tidak relevan pada suatu layanan dilewati (contohnya preview daftar percakapan di Threads). Dialog menampilkan cakupan setiap layanan. Kategori merupakan kelompok elemen yang dikenali, bukan jaminan semua informasi sensitif telah disamarkan. Caption, hasil pencarian, dialog, pesan yang dirender lewat canvas/shadow DOM, variasi bahasa, atau perubahan markup situs dapat terlewat. Uji akun nyata dan periksa layar sebelum membagikannya. Gunakan penutup penuh atau kunci jika perlu menyembunyikan seluruh tampilan.

Saat blur dimatikan, stylesheet dihapus dan filter asli situs kembali. Hover mengembalikan filter asli situs sehingga spoiler bawaan tetap mengikuti aturan layanan, bukan dipaksa menjadi tajam. Tidak mengubah protokol, riwayat pesan, izin notifikasi, atau sesi login.

Panel layanan dan popup milik akun disembunyikan saat ditutup/dikunci. Halaman tidak dimuat ulang atau dihentikan, jadi sesi tetap tersambung. Panggilan yang sudah berjalan tidak sengaja dihentikan oleh kunci; suara tetap dapat terdengar. Menutup aplikasi tetap menghentikan semua akun. Kunci menolak permintaan izin baru, notifikasi baru melalui izin Chromium, popup baru, dan perubahan akun melalui IPC. Notifikasi yang sudah masuk ke Notification Center OS tidak dapat ditarik kembali oleh fitur ini. Suara pesan berasal dari situs dan tidak otomatis dimatikan.

## Password dan batas perlindungan

Password disimpan sebagai verifier scrypt dengan salt acak, bukan teks asli. Verifier hanya dibaca proses utama dan tidak dikirim lewat snapshot UI. Percobaan password salah diberi jeda bertingkat sampai 30 detik. Mengubah pengaturan/password atau mematikan kunci memerlukan password saat ini. Tidak ada password bawaan, password master, atau fitur lupa password.

Fitur ini melindungi tampilan dari orang yang memakai jendela DuoChat. Ia tidak mengenkripsi cookies, cache, database chat layanan, file unduhan, atau direktori profil. Pemilik akses file/proses komputer tetap dapat mengubah atau menghapus pengaturan. Gunakan akun OS, kunci perangkat, dan enkripsi disk untuk perlindungan data saat tersimpan. Screen sharing, thumbnail OS, notifikasi lama, dan aplikasi remote perlu diperhatikan terpisah.

Pengaturan kunci berada di **privacy.json** dalam direktori userData Electron, terpisah dari settings.json. File ditulis atomik dengan izin 0600 pada sistem yang mendukungnya. Jika file rusak, DuoChat menolak membuka percakapan; pulihkan cadangan yang valid. Jangan menghapus seluruh profil atau sesi chat untuk memperbaiki file ini.

## Pengujian

Unit test memeriksa hashing, password salah, jeda percobaan, perubahan password, pengaturan rusak, kegagalan tulis, idle, penutup panel, serta pembatalan dan balapan Touch ID. Tes blur memeriksa migrasi/persistensi, sanitasi, origin, kategori, dan pergantian CSS tanpa menumpuk stylesheet.

Smoke aplikasi terkemas menggunakan fixture HTTPS lokal untuk keenam layanan. Ia memeriksa konfigurasi tanpa password, kategori independen, hover/reblur dengan input Chromium, teks yang tetap dapat diketik, konten baru, filter asli, batas login Facebook, dua panel bersamaan, kunci aplikasi dan penutup asli. Fixture bukan sertifikasi DOM akun nyata; sensor Touch ID, panggilan nyata, dan banner OS tetap perlu pengujian di perangkat.

Tidak ada renderer atau engine baru. Blur langsung memakai CSS pada elemen halaman tanpa polling atau snapshot. Filter media/video masih bisa menambah beban GPU; RAM/GPU akun nyata belum diukur.

Referensi: [Electron insertCSS](https://www.electronjs.org/docs/latest/api/web-contents#contentsinsertcsscss-options), [referensi selector dan atribusi](third-party-notices.md), [Touch ID](https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesprompttouchidreason-macos), [powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor).


Blur dinyalakan terpisah lewat tombol di panel kiri atau kanan. Pilihan elemen, kekuatan blur, dan hover tetap satu pengaturan bersama. Mengganti akun tidak mengubah status blur panel tersebut. Pengaturan lama yang aktif dimigrasikan menjadi aktif pada kedua panel.

Instagram dan Threads: gambar/video dapat dibuka sementara saat hover di atas kontrol media, termasuk media dengan pointer-events nonaktif. Pemeriksaan posisi elemen berjalan lokal saat interaksi, tanpa membaca atau mengirim isi pesan. Overlay dialog lain tidak membuka media di belakangnya.


Kutipan reply Telegram Web A dan K di dalam pesan masuk/keluar kini mengikuti kategori blur: teks kutipan memakai **Isi pesan & postingan**, nama pengirim memakai **Nama**, dan thumbnail memakai **Media**. Hover hanya membuka bagian yang ditunjuk; opsi hover-off tetap dihormati. Tombol navigasi reply dan kolom ketik tetap dapat digunakan. Pengaturan tetap bersama, sementara Blur ON/OFF tetap per panel.
