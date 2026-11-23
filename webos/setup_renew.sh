#!/bin/bash
# Renews LG Developer Mode automatically from this Mac, so Free My TV never expires.
#   bash webos/setup_renew.sh <TV IP>        (to stop it:  bash webos/setup_renew.sh --remove)
# Every 3 hours while the Mac is awake it asks the TV to extend Developer Mode. With the TV off it just tries later.
set -e
cd "$(dirname "$0")/.."
LABEL=io.freemytv.renew
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DEST="$HOME/Library/Application Support/FreeMyTV"
if [ "$1" = "--remove" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"; rm -rf "$DEST"
  echo "Automatic renewal removed."; exit 0
fi
IP="$1"
[ -n "$IP" ] || { echo "Usage: bash webos/setup_renew.sh <TV IP>   (to stop it: bash webos/setup_renew.sh --remove)"; exit 1; }
# A copy outside Documents: macOS doesn't let background jobs read Documents without asking.
mkdir -p "$DEST" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
rm -rf "$DEST/webos" "$DEST/tools"
cp -R webos tools "$DEST/"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/python3</string><string>$DEST/webos/renew.py</string><string>$IP</string>
  </array>
  <key>StartInterval</key><integer>10800</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/freemytv-renew.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/freemytv-renew.log</string>
</dict></plist>
PL
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Trying a renewal now (the TV must be on) ..."
/usr/bin/python3 "$DEST/webos/renew.py" "$IP" || echo "That try didn't work; it will keep trying every 3 hours."
echo "Automatic renewal is set up. Log: ~/Library/Logs/freemytv-renew.log"
