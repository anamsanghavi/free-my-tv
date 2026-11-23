#!/bin/bash
# Local addition: your photos as Free My TV's screensaver and wallpaper. Runs on your Mac only.
#   bash webos/screensaver.sh "<folder with your photos>" <how many, e.g. 200> <TV IP>
set -e
cd "$(dirname "$0")/.."
SRC="$1"; COUNT="${2:-200}"; IP="$3"
[ -n "$SRC" ] && [ -n "$IP" ] || { echo 'Usage: bash webos/screensaver.sh "<folder with your photos>" <how many, e.g. 200> <TV IP>'; exit 1; }
VENV="$HOME/.freemytv-photos"
if [ ! -x "$VENV/bin/python" ]; then
  echo "One-time setup (about a minute) ..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q pillow pillow-heif
fi
"$VENV/bin/python" webos/my_photos.py "$SRC" "$COUNT"
rm -f FreeMyTV-webos.ipk
python3 webos/build.py
python3 webos/install.py "$IP"
rm -f FreeMyTV-webos.ipk   # it holds your photos; the next install rebuilds it
echo "Done. Wallpaper now; the screensaver starts after 5 idle minutes."
