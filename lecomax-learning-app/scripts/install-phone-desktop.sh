#!/data/data/com.termux/files/usr/bin/bash
# Run inside Termux after the official NetHunter Rootless installation.
set -euo pipefail
cd "$HOME"
command -v nethunter >/dev/null
nethunter -r 'apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends novnc python3-websockify tigervnc-standalone-server dbus-x11'
test -x kali-arm64/usr/bin/startxfce4
umask 077
mkdir -p kali-arm64/home/kali/.vnc
if [ ! -s kali-arm64/home/kali/.vnc/passwd ]; then
  nethunter 'openssl rand -base64 6' > lecomax-kali-password.txt
  test -s lecomax-kali-password.txt
  nethunter 'vncpasswd -f' < lecomax-kali-password.txt > kali-arm64/home/kali/.vnc/passwd
fi
cat > kali-arm64/usr/local/bin/lecomax-desktop <<'DESKTOP'
#!/bin/bash
set -e
export USER=kali
export HOME=/home/kali
mkdir -p "$HOME/.vnc"
cat > "$HOME/.vnc/lecomax-xstartup" <<'SESSION'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec dbus-launch --exit-with-session startxfce4
SESSION
chmod 700 "$HOME/.vnc/lecomax-xstartup"
vncserver :1 -localhost yes -SecurityTypes VncAuth -rfbauth "$HOME/.vnc/passwd" -geometry 1280x720 -depth 24 -xstartup "$HOME/.vnc/lecomax-xstartup"
exec python3 -m websockify --web=/usr/share/novnc 127.0.0.1:6080 127.0.0.1:5901
DESKTOP
chmod 700 kali-arm64/usr/local/bin/lecomax-desktop
cat > "$PREFIX/bin/lecomax-kali" <<'LAUNCHER'
#!/data/data/com.termux/files/usr/bin/bash
set -e
if curl -fsS --max-time 2 http://127.0.0.1:6080/vnc.html >/dev/null 2>&1; then
  echo 'Kali desktop is already running. Open phone Kali in L’ECOMAX.'
  exit 0
fi
nohup nethunter /usr/local/bin/lecomax-desktop > "$HOME/lecomax-kali.log" 2>&1 < /dev/null &
echo 'Starting Kali. Keep Termux running, then open phone Kali in L’ECOMAX.'
echo 'View your local desktop password: cat ~/lecomax-kali-password.txt'
LAUNCHER
chmod 700 "$PREFIX/bin/lecomax-kali"
echo 'Phone desktop configured; run lecomax-kali to start.'
