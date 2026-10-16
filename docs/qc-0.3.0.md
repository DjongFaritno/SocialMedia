# DuoChat 0.3.0 — QC dan publikasi

Ditinjau 16 Oktober 2026. Rilis publik: [v0.3.0](https://github.com/DjongFaritno/SocialMedia/releases/tag/v0.3.0).

- Commit rilis/tag: 4ecdf622cc6f15ed41f2fc7ab4b63695166d50a8.
- [Workflow publikasi berhasil](https://github.com/DjongFaritno/SocialMedia/actions/runs/38878796762).
- GitHub latest menunjuk v0.3.0, draft=false, prerelease=false.
- 12 aset berstatus uploaded; termasuk seluruh installer, installer Fedora, SHA256SUMS, metadata updater tiga OS dan blockmap.
- SHA-512 installer pada metadata serta ukuran/SHA-256 seluruh aset setelah upload diverifikasi sebelum publikasi.
- Tag publik diverifikasi menunjuk commit yang sama dengan build.
- Website mengambil rilis melalui API GitHub; perubahan URL manual tidak diperlukan.

| Pemeriksaan | Hasil dan cakupan |
| --- | --- |
| Windows x64 | 62 unit test lulus; validasi paket dan smoke aplikasi terkemas lulus |
| macOS universal | 62 unit test lulus; paket/signature ad-hoc/entitlements diverifikasi; smoke aplikasi terkemas lulus pada runner |
| Linux x64 | 62 unit test lulus; smoke sebelum dan sesudah packaging, AppImage/deb dan script Fedora lulus |
| Blur | Keenam layanan di kiri dan kanan, dua akun WhatsApp, tiap kategori sendiri, semua kombinasi ON/OFF, shared settings/strength, swap akun, reload, media baru |
| WhatsApp | Readonly/metadata messages, foto/canvas/background, quote/sticker/galeri/viewer dan avatar terpisah; author grup/reply terpisah dari kategori pesan, hover/reblur dan author baru |
| Telegram | Struktur Web A/K: daftar nama, ringkasan arsip dan reply text/sender/media; hover dan kontrol navigasi |
| Media | Gambar/video/poster di bawah kontrol overlay, hover-off, modal lain tidak membuka media di belakangnya, cleanup helper, Threads linked-post versus avatar |
| Privasi | Pengaturan, password salah/benar, pembatalan biometrik, hasil stale setelah OS lock, IPC guards, penutup native, popup tersembunyi/dipulihkan, sesi dipertahankan |
| Windows Hello | Komponen native dibangun/dimuat pada paket; availability dan invalid-window rejection lulus. Tidak ada enrollment sensor fisik di CI |
| Login dan izin | Fixture OAuth Facebook/Instagram berbagi sesi akun; profil lain tetap terpisah; worker notification grant/revoke dan pembatasan origin diuji di Electron |
| Updater | Versi/kelengkapan aset, unduhan SHA-512, byte rusak ditolak, tidak memasang otomatis tanpa persetujuan |
| Publikasi | Unit regression untuk draft terautentikasi, tag belum ada, aset kurang/rusak, draft lease, tag salah, dan rilis publik yang tidak boleh ditimpa |

## Batas QC

Tes layanan menggunakan fixture HTTPS lokal dengan markup yang dikenali, bukan login ke akun pribadi. Variasi DOM akun nyata, login pihak ketiga terbaru, panggilan nyata, banner notifikasi OS dan sensor Touch ID/Hello fisik tetap perlu pemeriksaan perangkat. Smoke macOS berjalan pada arsitektur runner; kedua arsitektur tersedia dalam paket universal, bukan bukti runtime pada setiap perangkat Intel/Apple Silicon.

Selective blur melindungi elemen yang dikenali, bukan jaminan semua halaman masa depan. Discord/X/Instagram/Threads masih memakai adapter awal. Kunci melindungi tampilan, bukan enkripsi profil/cookies/cache.

## Signing

Windows belum memakai sertifikat penerbit. macOS memakai ad-hoc signature, belum Developer ID/notarization. Peringatan OS masih mungkin muncul. [Persiapan code signing](code-signing.md).

## Hasil akhir

Rilis 0.3.0 publik dan eligible untuk pemilihan versi pada updater. Windows x64/AppImage mendukung unduh update dengan konfirmasi pemasangan; macOS/deb/Fedora memakai pemasangan manual. [Cakupan dan langkah uji akun nyata](blur-qc.md).
