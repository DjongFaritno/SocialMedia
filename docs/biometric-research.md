# Windows Hello dan Touch ID untuk DuoChat

Riset 16 Oktober 2026, berdasarkan dokumentasi produk dan platform.

| Referensi | Pola yang relevan | Penerapan DuoChat |
| --- | --- | --- |
| [Bitwarden](https://bitwarden.com/help/biometrics/) | Opsi biometrik di pengaturan, verifikasi saat mengaktifkan, dan pilihan terpisah untuk perilaku setelah restart. | Dua checklist: metode buka kunci dan prompt saat membuka aplikasi. |
| [1Password Windows Hello](https://support.1password.com/windows-hello/) dan [Touch ID](https://support.1password.com/touch-id-mac/) | Autentikasi perangkat melengkapi password aplikasi. | Password DuoChat selalu tersedia; pembatalan tidak membuka kunci. |
| [Keamanan 1Password](https://support.1password.com/windows-hello-security/) | OS melaporkan hasil; aplikasi tidak menerima wajah/sidik jari. Produk ini juga melindungi rahasia terenkripsi. | DuoChat hanya memakai hasil verifikasi untuk membuka tampilan; tidak mengklaim enkripsi vault seperti password manager. |

## Pilihan implementasi

Windows memakai [IUserConsentVerifierInterop::RequestVerificationForWindowAsync](https://learn.microsoft.com/en-us/windows/win32/api/userconsentverifierinterop/nf-userconsentverifierinterop-iuserconsentverifierinterop-requestverificationforwindowasync), dengan HWND jendela DuoChat. Dokumentasi menyebut build minimum 22000: implementasi ini ditujukan untuk Windows 11+. API memerlukan konteks desktop yang benar; bukan prompt web/passkey untuk akun layanan.

Binding C++/WinRT N-API berjalan pada worker, sehingga event loop Electron tidak diblokir. Binding hanya menerima handle jendela milik proses DuoChat yang terlihat/aktif dan hanya hasil Verified yang diterima. Tidak menggunakan PowerShell, shell command, autentikasi browser, atau executable unduhan saat pengguna membuka kunci. Binary dibangun dari source pada CI Windows, memakai header Electron dan delay-load hook sesuai [panduan native module Electron](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules/).

macOS memakai [canPromptTouchID dan promptTouchID Electron](https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesprompttouchidreason-macos). [Apple LocalAuthentication](https://developer.apple.com/documentation/localauthentication) menyatakan data autentikasi dasarnya tidak diakses aplikasi. Tidak ada pemindaian atau penyimpanan fingerprint oleh DuoChat.

Windows Hello dapat memakai wajah, fingerprint, atau PIN Hello sesuai pilihan OS. Pilihan ini bukan janji fingerprint saja. Touch ID menggunakan kemampuan yang dilaporkan macOS. Linux dan Windows yang tidak didukung tetap memakai password.

## Alur pengguna

1. Aktifkan Windows Hello/Touch ID di pengaturan komputer.
2. Buka Privasi, buat password DuoChat sebagai cadangan.
3. Centang buka kunci dengan Windows Hello/Touch ID, simpan, lalu selesaikan verifikasi OS. Pembatalan atau kegagalan tulis tidak mengaktifkan preferensi.
4. Jika ingin prompt otomatis, centang kunci saat dibuka dan minta verifikasi saat DuoChat dibuka.
5. Pada peluncuran berikutnya, panel tetap tertutup sampai autentikasi berhasil. Prompt otomatis hanya sekali. Jika dibatalkan, tetap di layar kunci dengan pilihan password dan tombol coba biometrik lagi.

Metode biometrik yang lama tetap aktif, tetapi instalasi lama tidak otomatis memilih prompt saat startup. Perubahan pengaturan pada kunci yang sudah dibuat tetap memerlukan password DuoChat saat ini. Lock/suspend baru membatalkan hasil autentikasi yang masih menunggu melalui pemeriksaan epoch.

## Batas dan validasi

Ini adalah pengunci tampilan, bukan enkripsi ulang cookies/chat atau penyimpanan kunci berbasis TPM/Keychain. Kebijakan tersebut tetap sama seperti pengunci password DuoChat.

Unit test memakai provider palsu untuk hasil berhasil, batal, status tidak tersedia, permintaan bersamaan, restart, kegagalan penyimpanan, dan lock saat prompt masih berlangsung. CI Windows membangun dan memuat binding sebenarnya di aplikasi terkemas serta memeriksa availability dan penolakan HWND invalid tanpa menampilkan prompt.

CI tidak memiliki sidik jari/wajah/PIN pribadi. Verifikasi sukses pada perangkat Windows Hello, Touch ID fisik, dialog foreground, pembatalan OS, dan restart aplikasi wajib diuji di perangkat sebelum rilis publik.
