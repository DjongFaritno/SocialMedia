# Unduh DuoChat

Installer yang sudah diterbitkan tersedia di [GitHub Releases](https://github.com/DjongFaritno/SocialMedia/releases). Folder ini hanya menyimpan panduan; installer dan checksum tidak dimasukkan ke repository.

Versi pengembangan **0.3.0-beta.5** membawa multiakun dan pilihan layanan. Sebelum dipublikasikan, kandidat Windows/macOS/Linux tersedia sebagai artifact workflow [Build desktop installers](https://github.com/DjongFaritno/SocialMedia/actions). Artifact build bukan rilis publik atau update otomatis.

- Windows x64: pilih installer Setup.exe.
- macOS Intel/Apple Silicon: pilih DMG universal, lalu seret DuoChat ke Applications. [Panduan instalasi Mac](../docs/install-macos.md).
- Linux x64: pilih AppImage atau deb. AppImage perlu izin executable. Installer Fedora disediakan bersama AppImage pada rilis.

Gunakan SHA256SUMS dari rilis yang sama untuk memeriksa berkas. Versi baru dapat dicek lewat menu DuoChat, footer, atau About; mode pemasangan otomatis bergantung OS dan jenis instalasi.

[Petunjuk akun dan penggunaan](../README.md) · [Catatan big update](../docs/big-update.md)


Blur dinyalakan terpisah lewat tombol di panel kiri atau kanan. Pilihan elemen, kekuatan blur, dan hover tetap satu pengaturan bersama. Mengganti akun tidak mengubah status blur panel tersebut. Pengaturan lama yang aktif dimigrasikan menjadi aktif pada kedua panel.

Instagram dan Threads: gambar/video dapat dibuka sementara saat hover di atas kontrol media, termasuk media dengan pointer-events nonaktif. Pemeriksaan posisi elemen berjalan lokal saat interaksi, tanpa membaca atau mengirim isi pesan. Overlay dialog lain tidak membuka media di belakangnya.


Privasi: checklist buka kunci dengan Windows Hello (Windows 11+) atau Touch ID, serta opsi terpisah untuk meminta verifikasi saat DuoChat dibuka. Password DuoChat tetap tersedia. Pembatalan tidak membuka kunci dan tidak mengulang prompt otomatis. [Panduan](../docs/privacy.md) · [Riset](../docs/biometric-research.md).
