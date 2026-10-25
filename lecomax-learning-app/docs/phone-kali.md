# Kali running on the Android phone

The native Kali screen has separate phone-local and PC Wi-Fi connections.
Phone mode requires Termux with an installed ARM64 NetHunter Rootless environment.
It does not install an operating system from the app or replace Android.

After the official NetHunter installation, run `scripts/install-phone-desktop.sh`
inside Termux. It installs the noVNC bridge and creates `lecomax-kali`.

1. Open Termux and run `lecomax-kali`.
2. Keep Termux running. Open L'ECOMAX Learn → Kali → Open phone Kali.
3. Enter the desktop password. View it privately in Termux with
   `cat ~/lecomax-kali-password.txt`.

VNC listens only on localhost port 5901 and requires a password. The noVNC bridge
listens only on localhost port 6080. No phone LAN ports are intentionally exposed.
The app confines this WebView to that origin and disables file access.

Android can stop Termux in the background. If the desktop disconnects, open
Termux, run `lecomax-kali`, then reconnect in the learning app. Closing the
WebView disconnects its viewer; it does not shut down Kali. The initial setup
does not configure automatic startup after a phone reboot.

This is NetHunter Rootless: Android remains the host kernel. Root-only hardware
features are not enabled by this installation. Additional operating systems
have not been installed. Keep free space available for Android and Kali updates.
