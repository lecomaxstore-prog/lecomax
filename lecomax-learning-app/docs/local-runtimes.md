# Real local learning runtimes

The web Teacher terminal uses real processes on the local API computer: PowerShell,
Python, Node.js and Kali Linux (Windows WSL). These runtimes are not bundled into
the Android/iOS app. Production terminal access remains disabled. Opt-in Wi-Fi
mode connects devices on a trusted private network to the runtimes on this PC.

Start the API from the repository root with `node scripts/start-teacher-lab.mjs`
and the web app from `lecomax-learning-app` with `npm run web`, with
`EXPO_PUBLIC_LEARNING_API_URL=http://127.0.0.1:3002` set in its environment. Sign in as the owner,
open Teacher, then open the terminal. The local app origin must be port 8081.

Each tab displays the detected version or setup instructions. Detection refreshes
after 30 seconds. Restart a tab to retry after installation. PowerShell prefers
`pwsh` and falls back to Windows PowerShell. Python resolves the Windows `py -3`
launcher, then Python on PATH. Node uses the server's actual Node executable.
Optional server overrides: `LECOMAX_PYTHON_EXECUTABLE` and
`LECOMAX_POWERSHELL_EXECUTABLE` (absolute executable paths).

Kali uses the official `kali-linux` WSL distribution and starts Bash in the Linux
user's home directory. Install from Windows with
`wsl --install -d kali-linux --no-launch`, then launch `wsl -d kali-linux` if
first-run setup is required. Follow https://www.kali.org/docs/wsl/wsl-preparations/.
That command installs the base distribution. To add the standard Kali applications
and graphical desktop, run inside Kali:

```sh
sudo apt update
sudo apt install kali-linux-default kali-win-kex
```

The standard toolset and desktop were selected for this PC because the everything
collection required 36.9 GB installed plus a 13 GB download while C: had only
42.7 GB free. The standard installation plan required a 2.9 GB download and
10.2 GB installed. Verification on 2026-10-09 confirmed both `kali-linux-default`
and `kali-win-kex` are installed, with no issues reported by `dpkg --audit`.
Real Kali terminal execution passed. The standalone Win-KeX window and its manual
password setup have not been visually verified. The embedded app desktop uses
its own temporary session credentials as described below. See Change History
for the detailed validation outcome.

## Live desktop inside the learning app

Teacher → Terminal → Kali Linux → **Open Kali desktop here** embeds the real
XFCE desktop using noVNC. `/kali` opens the same desktop directly. The installed
Kali applications are available from its Applications menu. The app creates a
dedicated desktop session with a temporary password; no manual Win-KeX password
entry is needed for this embedded session. Closing the view ends its applications.
Reconnect starts a fresh connection. Idle sessions expire after 15 minutes, with
a four-hour maximum lifetime. Unsaved work in desktop applications can be lost
when a session ends; files already saved in Kali persist.

The earlier package check confirmed Win-KeX but did not verify its recommended
XFCE dependency. Live testing found XFCE missing; `kali-desktop-xfce` was then
installed. Startup also uses Win-KeX's WSLg X11 socket mount preparation. The real
VNC password handshake and framebuffer transfer now pass automated tests. Visual
browser and physical phone checks are still separate and have not been performed.

## Wi-Fi setup

After approving local network access, stop the existing learning development
servers and run from the repository root:

```powershell
./scripts/start-learning-wifi.ps1 -Address 192.168.1.11
```

Use this PC's current private IPv4 address if it changes. Allow only Node TCP
ports 8081 (app), 3002 (owner API), and 3003 (authenticated desktop bridge) from
the local Wi-Fi subnet. The launch script does not change firewall rules.
No router forwarding or public tunnel is needed. The API and bridge bind to the
specified PC address; all VNC ports remain loopback-only. WebSocket connections
require a one-use ticket issued after owner authentication and tied to the exact
app origin; production access remains disabled.

On the same trusted Wi-Fi, open `http://192.168.1.11:8081/kali` and sign in. In the
updated Android app, Teacher → Lab → **Live Kali · Wi-Fi** opens the address setup
and embeds the local app in a restricted WebView. Only private IPv4 addresses on
port 8081 are accepted. The Android 1.0.5 build enables HTTP for this local WebView;
the normal production owner API continues to require HTTPS. Existing installed
versions need the new APK to receive this native configuration and screen.

This development connection uses HTTP, so credentials and desktop traffic are
not encrypted on the Wi-Fi network. Use only your trusted network. Keep Windows,
WSL, and the development servers running; sleeping or disconnecting this PC stops
access. The app's Expo development bundle may take time to load initially.

Wi-Fi exposure was not enabled during implementation: automatic approval review
requires explicit confirmation of the firewall scope. See Change History for
the latest activation and device-validation status. There is no deployment.

Launch the desktop from **Windows PowerShell**:

```powershell
wsl -d kali-linux kex --win -s
```

On first launch, set your own Win-KeX desktop password when prompted. The Teacher
Kali tab includes a button to copy this command. The desktop opens separately from
the learning app. To stop it, run `wsl -d kali-linux kex --win --stop`.
Applications are available in the Kali desktop menu or from its terminal. Installing
the standard collection does not mean every application in Kali's repositories is
installed. Some hardware-dependent tools need compatible USB devices and WSL
device access; installing a package alone does not enable those capabilities.
Official desktop instructions: https://www.kali.org/docs/wsl/win-kex/.

Try `print(6 * 7)` in Python, `console.log(6 * 7)` in Node, `$PSVersionTable` in
PowerShell, and `cat /etc/os-release` in Kali. Use PowerShell for `npm` and `pip`
commands; the Node and Python tabs are interpreter prompts, not shell prompts.
If Windows blocks the npm PowerShell wrapper, use `npm.cmd` / `npx.cmd` without
changing the machine's execution policy. In Kali, use `npm` normally and create
Python environments with `python3 -m venv .venv` before installing project packages.
The newly installed Kali distribution initially uses its default root account;
`whoami` shows the active Linux user. This is separate from your Windows account.

Sessions keep variables and their working directory until closed, restarted or
expired. Windows sessions start in a temporary directory; Kali files in the
Linux home directory persist. Commands have the local account's permissions;
the working directory is not a security sandbox. Use security exercises only
on systems you own or have permission to test. No deployment is performed by setup.
