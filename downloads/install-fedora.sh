#!/usr/bin/env bash
# Install DuoChat for the current Fedora user; no sudo or FUSE required.
set -euo pipefail
expected_sha='2d173b50ca8849080437687ef6b7725994cdcdc45816777e3bfd4d6c4e314990'
app_name='DuoChat-0.1.3.AppImage'

if [[ "$(id -u)" == 0 ]]; then
  printf 'Jalankan sebagai pengguna biasa, tanpa sudo.\n' >&2
  exit 1
fi
if [[ "$(uname -m)" != x86_64 ]]; then
  printf 'Installer ini hanya mendukung Linux x86_64.\n' >&2
  exit 1
fi
if [[ ! -r /etc/os-release ]]; then
  printf 'Tidak dapat memeriksa distribusi Linux.\n' >&2
  exit 1
fi
. /etc/os-release
if [[ "${ID:-}" != fedora ]]; then
  printf 'Skrip ini ditujukan untuk Fedora; sistem terdeteksi: %s.\n' "${ID:-unknown}" >&2
  exit 1
fi
for tool in sha256sum mktemp realpath chmod mkdir mv; do
  if ! command -v "$tool" >/dev/null; then
    printf 'Perintah yang dibutuhkan belum tersedia: %s\n' "$tool" >&2
    exit 1
  fi
done
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
download_dir="$(xdg-user-dir DOWNLOAD 2>/dev/null || printf '%s/Downloads' "$HOME")"
app_file="${1:-}"
if [[ -z "$app_file" ]]; then
  for candidate in "$script_dir/$app_name" "$download_dir/$app_name"; do
    if [[ -f "$candidate" ]]; then app_file="$candidate"; break; fi
  done
fi
if [[ ! -f "$app_file" ]]; then
  printf 'File %s belum ditemukan.\nUnduh dari GitHub, simpan bersama skrip ini, lalu jalankan ulang.\n' "$app_name" >&2
  exit 1
fi
app_file="$(realpath -- "$app_file")"
actual_sha="$(sha256sum -- "$app_file")"
actual_sha="${actual_sha%% *}"
if [[ "$actual_sha" != "$expected_sha" ]]; then
  printf 'Checksum tidak cocok. File belum lengkap atau bukan installer yang sesuai.\nUnduh ulang AppImage melalui Download raw file di GitHub.\n' >&2
  exit 1
fi
install_parent="$HOME/.local/opt/duochat"
install_dir="$install_parent/0.1.3"
if [[ -e "$install_dir" ]]; then
  printf 'DuoChat 0.1.3 sudah ada di %s. Instalasi tidak ditimpa.\n' "$install_dir"
  exit 1
fi
mkdir -p -- "$install_parent"
staging="$(mktemp -d "$install_parent/.install-XXXXXX")"
trap 'rm -rf -- "$staging"' EXIT
chmod +x -- "$app_file"
printf 'Memeriksa dan mengekstrak DuoChat…\n'
(cd -- "$staging" && "$app_file" --appimage-extract >extract.log 2>&1) || {
  cat -- "$staging/extract.log" >&2
  exit 1
}
if [[ ! -x "$staging/squashfs-root/AppRun" ]]; then
  printf 'Ekstraksi AppImage tidak menghasilkan launcher yang valid.\n' >&2
  exit 1
fi
mv -- "$staging/squashfs-root" "$install_dir"
application_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p -- "$application_dir"
# Escape paths according to the desktop entry Exec field rules.
exec_path="${install_dir//\\/\\\\}"
exec_path="${exec_path//\"/\\\"}"
exec_path="${exec_path//\$/\\\$}"
desktop_backtick='`'
exec_path="${exec_path//"$desktop_backtick"/"\\$desktop_backtick"}"
exec_path="${exec_path//%/%%}"
icon_path="$install_dir/duochat-desktop.png"
cat > "$application_dir/duochat.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=DuoChat
Comment=WhatsApp dan Telegram dalam satu ruang kerja
Exec="$exec_path/AppRun"
Icon=$icon_path
Terminal=false
Categories=Network;InstantMessaging;
StartupWMClass=duochat-desktop
DESKTOP
chmod 644 -- "$application_dir/duochat.desktop"
if command -v update-desktop-database >/dev/null; then
  update-desktop-database "$application_dir" >/dev/null 2>&1 || true
fi
printf '\nDuoChat terpasang. Cari DuoChat di menu aplikasi Fedora.\n'
printf 'Atau jalankan: "%s/AppRun"\n' "$install_dir"
printf 'Login dan panggilan perlu diuji langsung dengan akunmu.\n'
