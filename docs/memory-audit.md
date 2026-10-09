# Audit memori DuoChat 0.1.8

Tanggal: 9 Oktober 2026. Audit kode dan pengukuran lokal Linux x64 dengan Electron 44.6.0 / Chromium 152.0.7977.130.

## Kesimpulan

DuoChat memiliki beban dasar Chromium serta tiga halaman: antarmuka DuoChat, WhatsApp, dan Telegram. Jumlah proses lebih besar dari jumlah halaman karena ada proses browser, grafis, jaringan, dan proses pendukung. Angka delapan proses saja bukan bukti ada delapan aplikasi atau kebocoran memori.

Pengujian menggunakan antarmuka DuoChat asli dan dua halaman layanan **tiruan minimal tanpa login**. Ini memisahkan beban dasar aplikasi dari chat, media, worker, panggilan, serta perilaku layanan sebenarnya. Hasil ini tidak menentukan pembagian RAM dari angka sekitar 1 GB pada screenshot Windows pengguna.

Setelah 30 siklus buka-tutup About dan 30 kali navigasi ulang per layanan, jumlah halaman tetap tiga dan jumlah proses yang dilaporkan Electron tetap enam. Ada dua zygote tambahan di pohon proses Linux. About ditutup dan dihancurkan; kedua panel dipakai ulang; riwayat navigasi masing-masing tetap satu entri. Tidak ditemukan penumpukan halaman pada skenario ini.

Memori bertambah setelah pengujian berulang dan sebagian besar kenaikannya turun sendiri saat idle. Jumlah proses yang tetap tidak membuktikan seluruh memori bebas dari kebocoran. Pengujian beberapa menit ini belum bisa menilai pertumbuhan selama berjam-jam pada akun nyata.

## Hasil pengukuran

| Kondisi | Halaman hidup | PSS pohon proses (MiB) | Jumlah working set Electron (MiB) |
| --- | ---: | ---: | ---: |
| Idle awal, dua fixture | 3 | 238.9 | 636.5 |
| Setelah 30 siklus About | 3 | 299.1 | 702.0 |
| Setelah 30 reload per layanan | 3 | 296.2 | 698.7 |
| Diminimalkan 20 detik | 3 | 250.9 | 660.1 |
| Idle 60 detik setelah aktivitas | 3 | 251.0 | 660.4 |
| Setelah GC diagnostik proses utama | 3 | 251.5 | 661.2 |
| Setelah GC diagnostik renderer | 3 | 254.0 | 679.0 |
| Shell saja setelah panel ditutup | 1 | 213.9 | 449.2 |

Laporan akhir mencakup 147.7 detik. Memori PSS awal sekitar 239 MiB, naik hingga sekitar 299 MiB pada aktivitas berulang, kemudian turun sendiri ke sekitar 251 MiB. Masih ada selisih sekitar 12 MiB terhadap baseline; asal selisih ini belum diidentifikasi. GC paksa diagnostik tidak memberikan penurunan tambahan pada run ini, sehingga tidak ada dasar untuk menambah fitur GC paksa ke aplikasi.

PSS Linux membagi halaman memori bersama secara proporsional. Jumlah RSS/working set menghitung sebagian halaman bersama berulang kali. Kedua metrik ini tidak boleh langsung disamakan dengan kolom Memory pada Windows Task Manager. Angka dalam tabel menggunakan MiB (1.048.576 byte).

Pengukuran shell saja dilakukan di akhir setelah kedua renderer layanan ditutup. Browser dan proses grafis masih dapat menyimpan cache; ini bukan baseline startup terpisah. GC diagnostik adalah intervensi pengujian untuk mencari memori yang menunggu pelepasan, bukan fitur atau perilaku aplikasi normal.

## Temuan kode dan prioritas

| Temuan | Implikasi | Rekomendasi |
| --- | --- | --- |
| Dua WebContentsView dengan sesi terpisah, ditambah renderer antarmuka | Ada biaya mesin browser untuk setiap halaman; layanan nyata memuat aplikasi dan media sendiri | Pertahankan sesi terpisah dan ukur per renderer pada akun nyata sebelum memilih optimasi |
| `backgroundThrottling: false` pada kedua layanan | Timer/animasi tidak mendapat throttling normal saat latar belakang; satu view dapat mempertahankan rendering untuk seluruh jendela | Uji pengaturan saat diminimalkan; prioritaskan CPU/baterai. Wajib uji pesan masuk, notifikasi, suara, dan panggilan di Windows/macOS/Linux; jangan menjanjikan penurunan RAM dari pengaturan ini |
| Belum ada `requestSingleInstanceLock()` | Peluncuran kedua dapat membuka salinan aplikasi lengkap, dengan dua layanan lagi | Prioritas optimasi sederhana: fokuskan jendela yang sudah ada pada peluncuran berikutnya. Ini mencegah penggandaan beban, bukan mengurangi RAM satu instance |
| About dibuat saat diminta, dipakai ulang jika masih terbuka, dan referensinya dilepas saat ditutup | Tidak ada jendela About yang terus dibuat pada setiap klik saat jendela masih terbuka | Lifecycle About lolos uji 30 siklus; lanjutkan profiling alokasi jika perlu |
| Handler renderer dipasang satu kali; tidak ada interval polling di antarmuka DuoChat | Tidak terlihat pekerjaan berkala buatan DuoChat yang memuat ulang chat atau menambah DOM saat diam | Hindari menambah polling untuk fitur diagnostik/indikator |
| Ikon PNG 1254×1254 (~1,16 MiB berkas; ~6 MiB satu bitmap RGBA) | Ada alokasi untuk gambar, termasuk saat jendela baru dibuat; belum dibuktikan sebagai penyebab utama RAM | Ukuran aset UI lebih kecil atau nativeImage yang dipakai ulang layak diuji. Jangan mengklaim penghematan besar tanpa A/B |
| Izin menggunakan map dengan paling banyak dua jenis perangkat, dan permintaan selesai dihapus | Tidak terlihat antrean izin yang tumbuh tanpa batas pada kode tersebut | Pertahankan perbaikan izin/notifikasi yang sudah berjalan |

Menghapus cache di disk bukan cara yang terbukti mengurangi RAM proses aktif. Mematikan akselerasi grafis juga tidak otomatis lebih hemat: rendering dapat berpindah ke CPU. Membatasi heap JavaScript secara paksa dapat membuat layanan gagal. Tidurkan atau muat ulang panel otomatis hanya jika perilakunya diterima pengguna dan panggilan/notifikasi tetap teruji.

## Reproduksi dan batas audit

Dari root repository, setelah dependensi terpasang:

```sh
npx electron scripts/memory-audit.cjs --output=artifacts/memory-audit.json
```

Skrip memakai direktori userData sementara yang baru dan mencegat HTTPS kedua sesi agar hanya mengembalikan halaman tiruan lokal. Akun, chat, dan profil pengguna tidak dipakai. Laporan hanya menyimpan label proses, PID, hitungan halaman/riwayat, waktu, CPU, dan statistik memori; tidak mengirim data ke server.

Audit di lingkungan Linux cloud memakai Xvfb dan flag `--no-sandbox --disable-gpu` khusus pengujian. Launcher aplikasi pengguna tidak diubah. Pengukuran grafis virtual tidak mewakili GPU perangkat pengguna. Pengujian popup layanan/panggilan tidak berhasil direproduksi secara andal dengan fixture sehingga tidak dinyatakan lolos.

`npm run check`, `npm test`, dan pemeriksaan sintaks skrip audit lolos. Pengukuran akhir harus memiliki `status: completed`; checkpoint `in-progress` bukan laporan lengkap.

Untuk memastikan asal RAM sekitar 1 GB pada Windows, pengukuran berikutnya perlu memisahkan proses WhatsApp, Telegram, antarmuka, dan proses pendukung pada akun nyata selama idle, penggunaan media, panggilan, minimisasi, serta pemulihan. Prioritaskan tren private working set/private bytes pada Windows dan pertumbuhan setelah aktivitas berhenti. Audit ini belum menetapkan sumber dominan maupun menjanjikan persentase penghematan.

Audit menambahkan skrip pengukuran dan laporan lokal. Perilaku aplikasi serta installer rilis 0.1.8 tetap seperti sebelumnya.

## Optimasi pada 0.1.9

Peluncuran kedua memakai lock profil yang sama dan mengaktifkan jendela utama, termasuk menampilkan kembali jendela yang tersembunyi. Tes dua proses Electron nyata memverifikasi proses kedua keluar, event second-instance diterima, dan ID ketiga halaman tetap sama.

Header/About kini memakai PNG 128 px, ikon jendela PNG 256 px yang didekode sekali sebagai nativeImage bersama. PNG asli tetap menjadi sumber ikon installer/platform. Throttling layanan tetap seperti sebelumnya agar perilaku panggilan/notifikasi tidak berubah tanpa pengujian akun nyata.

| Pengukuran fixture Linux PSS (MiB) | Sebelum | Sesudah |
| --- | ---: | ---: |
| Idle awal | 238.9 | 225.4 |
| Setelah 30 siklus About | 299.1 | 270.9 |
| Setelah 30 reload per layanan | 296.2 | 288.4 |
| Idle 60 detik setelah aktivitas | 251.0 | 240.4 |

Perbandingan berasal dari masing-masing satu run lengkap pada lingkungan yang sama. Ada variasi GC/cache dan aktivitas mesin; ini bukan benchmark akun nyata maupun jaminan penurunan persentase RAM Windows. Baseline awal turun sekitar 13,5 MiB; beban utama kedua layanan web pada akun pengguna belum diukur. Uji notifikasi Telegram/worker, tema, header, About, isolasi sesi, dan single-instance lulus setelah perubahan.
