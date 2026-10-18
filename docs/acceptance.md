# Pengujian penerimaan

Jalankan setiap skenario pada Windows, macOS, dan Linux menggunakan akun sendiri dan partner panggilan. Catat versi OS, versi aplikasi, perangkat audio/video, dan hasil. Status awal semua skenario akun: **belum diuji**.

| Skenario | Hasil yang harus terlihat |
| --- | --- |
| Login kedua layanan | Login melalui UI resmi berhasil, tidak keluar akibat login layanan lain |
| Tutup/buka aplikasi | Sesi dan lebar panel tetap tersimpan |
| Ubah ukuran jendela/panel | Tidak tumpang tindih; keyboard dan slider dapat dipakai |
| Kirim/terima pesan | Kedua panel menerima pesan dari akun partner |
| File | Pilih file, kirim ke partner, unduh file, batalkan dialog simpan |
| Izin ditolak | Situs tidak mendapat kamera/mikrofon/notifikasi |
| Izin diaktifkan | Kamera/mikrofon/notifikasi dapat diminta situs dengan izin OS |
| WhatsApp: panggilan suara keluar/masuk | Audio dua arah dan notifikasi panggilan berfungsi |
| WhatsApp: video keluar/masuk | Video dan audio dua arah berfungsi |
| Telegram: panggilan suara keluar/masuk | Audio dua arah dan notifikasi panggilan berfungsi |
| Telegram: video keluar/masuk | Video dan audio dua arah berfungsi |
| Panggilan WA + Telegram | Saat panggilan aktif, baca/balas Telegram dan kirim file; panggilan tetap aktif |
| Panggilan Telegram + WA | Saat panggilan aktif, baca/balas WA dan kirim file; panggilan tetap aktif |
| Kamera/mikrofon ganti perangkat | Pilih perangkat melalui UI layanan atau OS; panggilan tetap bekerja |
| Telegram notifikasi latar belakang | Aktifkan notifikasi di Telegram, pindah fokus atau minimalkan DuoChat, lalu kirim pesan dari akun lain; notifikasi tampil. Cabut izin layanan dan pastikan notifikasi diblokir |
| Aplikasi diminimalkan | Pesan/notifikasi diterima, panggilan tetap berjalan |
| Gangguan jaringan | Pesan error/reconnect terlihat; muat ulang pulih saat koneksi kembali |
| Popup layanan | Popup tetap sandbox, sesi sama; panel lainnya dapat dipakai |
| Tautan luar | Konfirmasi sebelum browser terbuka; protokol tak dikenal ditolak |

Jika menu panggilan tidak tersedia di layanan web, tandai **tidak didukung**. Jangan menandai lulus hanya karena izin media aktif. Opsi membuka browser bukan pengganti penerimaan panggilan dalam DuoChat.

## Catatan verifikasi otomatis

Tes unit mencakup batas origin, geometri panel, dan pemulihan pengaturan rusak. Smoke desktop menggunakan fixture lokal, tanpa login atau panggilan. Build/tes akun pada dua OS lainnya tidak dapat digantikan pengujian Linux.

## Tampilan

Uji F11/Esc saat fokus berada di setiap panel. Header/menu harus menghilang, panggilan/chat tetap aktif, dan ukuran panel menyesuaikan. Uji Ctrl+Shift+H serta tombol Tampilkan header di bagian bawah. Tutup/buka aplikasi untuk memeriksa preferensi header/tema. Uji Dark/White/Auto; jika layanan memakai tema manual, pilih System/Auto dari pengaturan layanan untuk mengikuti browser.

## Multiakun dan layanan baru — 0.4.0-beta.2

| Skenario | Hasil yang harus terlihat |
| --- | --- |
| Upgrade profil lama | WhatsApp/Telegram tetap memakai sesi lama; rasio, tema, izin tersimpan |
| Dua WhatsApp | Dua nomor berbeda dapat login bersamaan tanpa saling keluar |
| Ganti akun/tukar sisi | Akun pindah panel; sesi tidak bercampur |
| Akun tambahan dijeda | Halaman ditutup; akun bisa dipulihkan tanpa menghapus sesi |
| Tetap aktif | Notifikasi/panggilan tetap berjalan sesuai dukungan layanan saat tidak terlihat |
| Hapus satu akun | Hanya profil terpilih dihapus, akun lain tetap login |
| Hover sidebar | Ringkas menyembunyikan sidebar; hover menampilkan overlay tanpa menggeser panel; Esc menutupnya |
| Layanan baru | Uji login/restart/upload/download/notifikasi Discord, X, Instagram, Threads, Messenger, Facebook, Google Chat, WeChat, Slack, Teams dan LinkedIn pada setiap OS |

Status akun nyata untuk skenario baru: belum diuji. Tes fixture tidak membuktikan panggilan atau notifikasi layanan baru.

Blur: ulangi setiap kategori sendiri di panel kiri dan kanan, hover-off/on, pesan reply, nama, foto profil, foto/video, swap akun dan reload. Google Chat belum mencakup preview daftar chat; cek kategori pada Atur blur. [Matriks QC](blur-qc.md).
