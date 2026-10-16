# Code signing DuoChat

Status rilis 0.3.0: Windows belum ditandatangani penerbit. macOS memakai ad-hoc signature, belum Developer ID dan belum notarized. SHA256SUMS memeriksa integritas berkas; ia bukan sertifikat identitas penerbit.

## macOS

1. Daftar Apple Developer Program dengan Apple Account dan identitas penerbit yang benar. Biaya standar Apple saat ditinjau 16 Oktober 2026 adalah USD 99/tahun, dengan variasi mata uang/pajak wilayah.
2. Buat sertifikat **Developer ID Application** untuk distribusi di luar Mac App Store. Simpan sertifikat dan private key di keychain/penyimpanan aman; ekspor .p12 hanya untuk pemasangan CI yang terkontrol.
3. Siapkan autentikasi notarization, misalnya App Store Connect API key, atau Apple ID + app-specific password + Team ID yang didukung electron-builder.
4. Konfigurasi builder yang dipakai DuoChat (26.15.3): ganti identity "-" dengan identitas Developer ID, aktifkan hardenedRuntime dan notarization, lalu tinjau entitlements Electron/JIT/kamera/mikrofon. Environment CSC_IDENTITY_AUTO_DISCOVERY=false dan jalur build PR saat ini juga perlu dibedakan dari build signing produksi.
5. Simpan material signing sebagai GitHub Actions Secrets (misalnya MAC_CSC_LINK/MAC_CSC_KEY_PASSWORD yang dipetakan ke CSC_LINK/CSC_KEY_PASSWORD), dan kredensial notarization sesuai metode. Membuat secret saja belum mengubah workflow saat ini.
6. Tanda tangani, notarize, staple ticket pada paket yang didukung, lalu verifikasi codesign, spctl dan stapler. Uji DMG yang baru diunduh pada Mac lain sebelum menyebutnya signed/notarized.

Sertifikat Developer ID untuk individu memakai identitas yang diverifikasi Apple; nama yang tampil tidak dapat dipilih sembarangan.

## Windows

1. Pilih identitas penerbit dan penyedia code signing publik yang menerima jenis pendaftar serta negara domisili tersebut.
2. Microsoft Artifact Signing (sebelumnya Trusted Signing) saat ditinjau membatasi **individual developer ke AS atau Kanada**. Jangan mengasumsikan pendaftar individu Indonesia bisa menggunakannya. Periksa kelayakan organisasi secara terpisah bila memakai badan usaha.
3. Alternatifnya pilih CA/layanan cloud signing yang menerima pendaftar tersebut. Sertifikat modern dapat memakai token/HSM atau cloud; jangan mengasumsikan private key dapat diekspor sebagai .pfx.
4. Setelah penyedia dipilih, sesuaikan backend signing electron-builder v26. Untuk sertifikat file yang memang didukung penyedia, gunakan WIN_CSC_LINK/WIN_CSC_KEY_PASSWORD sebagai Secrets. Untuk token/cloud, gunakan integrasi penyedia dan identitas CI berhak minimum, idealnya OIDC bila didukung.
5. Signing perlu mencakup executable aplikasi dan installer, memakai timestamp tepercaya. Jalankan Get-AuthenticodeSignature/SignTool verify dan periksa nama penerbit serta rantai kepercayaan sebelum unggah.
6. Hitung metadata updater dan checksum **sesudah** signing. Jangan menandatangani ulang aset rilis yang sudah dipublikasikan; buat versi baru.

Signature yang valid mengidentifikasi penerbit dan mendeteksi perubahan. SmartScreen masih memperhitungkan reputasi; sertifikat OV/EV atau signing baru tidak menjamin semua peringatan langsung hilang.

## CI dan rahasia

Workflow saat ini tetap build tanpa sertifikat penerbit sampai akun dan konfigurasi signing siap. Jangan mengunggah sertifikat/private key, password, token, .p12, .pfx atau .p8 ke repository, issue, PR atau chat. Masukkan langsung lewat pengaturan Secrets/layanan signing. Build PR tidak boleh menerima kredensial signing produksi, khususnya dari fork.

Rilis publik dibuat sebagai draft, semua installer/metadata/checksum diverifikasi, lalu dipublikasikan. Aset rilis publik tidak ditimpa untuk menghindari perbedaan checksum pada pengguna.

Referensi resmi:
- [Apple enrollment dan biaya](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Developer ID dan notarization](https://developer.apple.com/developer-id/)
- [Microsoft Artifact Signing dan kelayakan](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart)
- [SmartScreen untuk developer](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)
- [electron-builder v26 signing](https://www.electron.build/v26/docs/features/code-signing/)
- [electron-builder v26 notarization](https://www.electron.build/v26/docs/notarization/)
