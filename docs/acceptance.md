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
| Aplikasi diminimalkan | Pesan/notifikasi diterima, panggilan tetap berjalan |
| Gangguan jaringan | Pesan error/reconnect terlihat; muat ulang pulih saat koneksi kembali |
| Popup layanan | Popup tetap sandbox, sesi sama; panel lainnya dapat dipakai |
| Tautan luar | Konfirmasi sebelum browser terbuka; protokol tak dikenal ditolak |

Jika menu panggilan tidak tersedia di layanan web, tandai **tidak didukung**. Jangan menandai lulus hanya karena izin media aktif. Opsi membuka browser bukan pengganti penerimaan panggilan dalam DuoChat.

## Catatan verifikasi otomatis

Tes unit mencakup batas origin, geometri panel, dan pemulihan pengaturan rusak. Smoke desktop menggunakan fixture lokal, tanpa login atau panggilan. Build/tes akun pada dua OS lainnya tidak dapat digantikan pengujian Linux.

## Tampilan

Uji F11/Esc saat fokus berada di setiap panel. Header/menu harus menghilang, panggilan/chat tetap aktif, dan ukuran panel menyesuaikan. Uji Ctrl+Shift+H serta tombol Tampilkan header di bagian bawah. Tutup/buka aplikasi untuk memeriksa preferensi header/tema. Uji Dark/White/Auto; jika layanan memakai tema manual, pilih System/Auto dari pengaturan layanan untuk mengikuti browser.
