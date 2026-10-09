# Pembaruan DuoChat

Pasang DuoChat 0.1.10 sekali untuk mendapatkan updater. Versi sebelumnya belum memiliki kode updater sehingga tidak dapat memperbarui dirinya ke versi ini.

## Cara memakai

1. Buka **menu DuoChat → Cek pembaruan…**, tombol **Cek update** di footer, atau **Cek pembaruan** di About.
2. Jika versi baru tersedia, unduh pembaruan atau buka GitHub sesuai dukungan paket.
3. Windows/AppImage menampilkan progress unduhan dan tombol **Pasang & mulai ulang** saat siap.
4. Selesaikan panggilan/unduhan aktif, lalu konfirmasikan pemasangan. Menutup aplikasi biasa tidak memasang update otomatis. Profil, login, dan pengaturan memakai direktori data yang sama.

Menu **Periksa pembaruan otomatis** aktif secara default: cek pertama sekitar 15 detik setelah dibuka, berikutnya setiap enam jam selama aplikasi berjalan. Menu **Unduh pembaruan otomatis** awalnya mati; aktifkan jika ingin pembaruan diunduh di latar belakang tanpa memilih unduh setiap kali. Pemasangan tetap menunggu konfirmasi restart.

Pemeriksaan latar belakang tidak memunculkan dialog. Tombol footer menunjukkan versi baru, progress, atau status siap pasang. Pada kegagalan jaringan, gunakan Cek pembaruan lagi. Tidak ada token GitHub, login tambahan, atau telemetry yang dibutuhkan; GitHub menerima permintaan cek/unduh dan dapat membatasi rate pemeriksaan.

## Dukungan paket

| Paket | Cek manual/otomatis | Unduh dalam aplikasi | Pasang & restart |
| --- | --- | --- | --- |
| Windows x64, NSIS Setup | Ya | Ya; otomatis opsional | Ya, setelah konfirmasi; OS dapat meminta izin installer |
| Linux x64, AppImage dijalankan langsung | Ya | Ya; otomatis opsional | Ya, jika lokasi AppImage dapat ditulis |
| macOS universal, DMG/ZIP saat ini | Ya | Buka rilis di browser | Manual |
| Debian/Ubuntu `.deb` | Ya | Buka rilis di browser | Manual lewat installer paket |
| Fedora hasil ekstraksi `install-fedora.sh` | Ya | Buka rilis di browser | Manual memakai AppImage dan skrip dari rilis yang sama |
| Source/development | Pesan penjelasan | Tidak | Tidak |

macOS memerlukan identitas Developer ID yang sesuai serta alur signing/notarization untuk updater distribusi yang andal. Paket saat ini memakai signature ad-hoc; updater tidak melewati pemeriksaan signature. Ikuti [panduan macOS](install-macos.md) untuk pemasangan manual. Fedora hasil ekstraksi bukan AppImage yang sedang berjalan, sehingga tidak diarahkan ke pemasangan otomatis AppImage.

## Rilis dan verifikasi

Updater membaca daftar rilis repository publik `DjongFaritno/SocialMedia`, memilih versi numerik tertinggi yang telah dipublikasikan dan lengkap, termasuk rilis yang ditandai prerelease/prototipe. Draft, rilis parsial, asset kosong, dan tautan asset yang tidak sesuai repository/tag diabaikan. Tidak melakukan downgrade.

Rilis harus menyertakan seluruh installer, skrip Fedora, checksum, dan metadata `latest.yml`, `latest-mac.yml`, `latest-linux.yml`. Workflow memverifikasi versi metadata, ukuran, dan SHA-512 installer sebelum rilis. Updater memakai feed dari tag rilis terpilih dan memverifikasi SHA-512 saat mengunduh. Signature publisher berlaku jika kelak dikonfigurasi; saat ini Windows masih unsigned. Metadata/hash dari HTTPS GitHub membantu verifikasi integritas, bukan pengganti signature publisher.

Tes otomatis mencakup download dengan engine nyata dan penolakan bytes rusak pada server fixture lokal. Tes tidak memasang atau mengeksekusi fixture. Pemasangan upgrade nyata antara dua rilis serta perilaku OS tetap perlu dicoba pada perangkat pengguna. Website tetap mengikuti rilis lengkap terbaru tanpa penggantian tautan manual.
