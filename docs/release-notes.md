DuoChat 0.3.0-beta.1 — sebentar, ini ruang sendiri.

- Kunci aplikasi dengan password, pintasan Ctrl/Cmd+Shift+L, serta pilihan kunci saat dibuka, komputer dikunci/sleep, atau idle.
- Touch ID opsional pada Mac yang mendukung. Windows dan Linux memakai password; Windows Hello/fingerprint Linux belum tersedia.
- Penutup polos per panel: sembunyikan sementara, lalu tampilkan lagi tanpa memuat ulang akun.
- Saat terkunci, tampilan layanan dan popup disembunyikan; permintaan izin/notifikasi baru, popup baru, serta perubahan akun diblokir. Sesi dan panggilan yang sudah berjalan tetap aktif.
- Pengaturan/password hanya dapat diubah setelah verifikasi password saat ini. Password memakai verifier scrypt dengan salt acak.
- Mempertahankan multiakun, enam layanan, tema, mode ringkas, cek update, dan perbaikan login Instagram melalui Facebook di dalam DuoChat.

Kunci ini melindungi tampilan, bukan enkripsi data profil. Notifikasi yang sudah tampil di OS dan suara dari situs tidak otomatis dihapus/dimatikan. Penutup panel belum menyediakan blur. Simpan password karena pemulihan password belum tersedia. Lihat [panduan privasi](privacy.md).

Windows x64: Setup.exe. macOS Intel/Apple Silicon: DMG universal atau ZIP. Linux x64: AppImage/deb, dengan script installer Fedora.

Paket macOS masih ad-hoc, belum dinotarize Apple. Windows belum memakai sertifikat signing. Build kandidat di pull request tidak otomatis diterbitkan atau menjadi pembaruan pengguna.

Tes otomatis memakai fixture lokal. Touch ID fisik, login, banner notifikasi, serta panggilan akun nyata tetap perlu diuji pada perangkat pengguna.

by Codex · prompt by TjongFaritno
https://djongfaritno.github.io/
