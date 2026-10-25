# My PC on trusted Wi-Fi

My space → My PC displays and controls the Windows desktop currently visible on
the PC. It is separate from Kali. Keep the PC awake and signed in, with both
devices on the same trusted Wi-Fi. Version 1.0.7 build 9 introduces this screen.

Run `Start My PC.cmd` in the repository. Enter its private address and pairing code
in the app. Tap to click, use the keyboard controls to type, and switch Zoom/Fit
to pan a larger desktop. Rotating the phone gives more space. Disconnect or
background the app to close its viewer. `Stop My PC.cmd` ends PC sharing entirely.
Sharing also stops after four hours; restarting rotates the pairing code.

The helper uses the official portable UltraVNC 1.8.3.0 x64 server as the current
Windows user. It is not installed as a service and does not start with Windows.
UAC prompts and the lock screen may not be controllable; approve those locally.
File transfer, screen blanking and automatic clipboard synchronization are not
enabled. The PC's own mouse and keyboard remain usable.

The local HTTP/WebSocket connection is not encrypted. Use only trusted Wi-Fi;
do not forward router ports or expose this server to the internet. The bridge
binds to the selected private IPv4 address on TCP 6081. UltraVNC is configured
loopback-only on TCP 5908 with a fresh random password. Only the paired browser
receives that password. Pairing is rate-limited; one browser session is retained,
with HttpOnly SameSite cookies and strict Host/Origin checks. No credentials are
committed; `.pc-remote/` contains local binaries and temporary session secrets.

The launcher does not modify the firewall. On this PC the user approved a
persistent rule named `LECOMAX My PC - Zakaria phone`: Node only, inbound TCP 6081,
local address 192.168.1.11, remote phone 192.168.1.12, all profiles (the Wi-Fi is
marked Public). `scripts/enable-my-pc-phone.ps1` applies exactly this rule with
Windows administrator approval. No router forwarding is configured. If DHCP
changes either address, this rule will no longer match; review the new addresses
before changing its scope. The rule can be removed in Windows Firewall by name.

Dependency: https://uvnc.com/downloads/ultravnc/172-ultravnc-1-8-3-0.html
Portable archive: https://uvnc.eu/download/1800/UltraVNC_1830.zip
SHA256: 11163a0b9b86321bf6403eb0cf84b81f7230ce32e6291377e1fe5beb987f7e4f
Extract into `.pc-remote/ultravnc/`, preserving x64 binaries and licensing files.
The browser client uses the app's existing @novnc/novnc package.

No website deployment or public remote access is required.
