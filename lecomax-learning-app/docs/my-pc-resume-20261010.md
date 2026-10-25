# My PC continuation

Feature source: `app/pc.tsx`, `components/PcDesktop.tsx`, More → My PC.
Target Android release: 1.0.7 / versionCode 9.

PC helper: run repository-root `Start My PC.cmd`; stop with `Stop My PC.cmd`.
Its current address and pairing code are in ignored `.pc-remote/CONNECT.txt`.
Never copy that code into source-controlled reports. Sessions last four hours.
Portable UltraVNC official archive checksum verified; VNC TCP binds 127.0.0.1:5908.
Bridge binds 192.168.1.11:6081. Authenticated real VNC negotiation passed and
reported a 1920x1080 Windows desktop. No keyboard/mouse or visual acceptance yet.
Browser automation inventory was empty.

User explicitly approved the exact persistent firewall exception for phone
192.168.1.12 → PC 192.168.1.11 TCP 6081, Node executable, all profiles. The initial
automatic review rejection was resolved by that explicit approval; the first
application attempt lacked administrator access. The subsequent Windows UAC
invocation succeeded. `.pc-remote/firewall-result.txt` records the result.
The phone then received HTTP 200 and the actual pairing HTML over Wi-Fi.

Checks passed: TypeScript, focused ESLint, 6 history tests, address-validator test,
native My PC interaction test, and 2 bridge integration tests (10 total).
The first address test lacked URL in its VM, and fetch ignored the test's Host
override; both test-harness issues were corrected. Runtime debugging fixed Windows
INI checksum serialization and the required `ultravnc.portable` marker.

Android build is running in `C:\lc-python-20261010\app\android`, with output at
`artifacts/windows-pc-build9.log`. Do not assume it succeeded until the final log
and APK are checked. Build environment: Java at `%USERPROFILE%\.jdks\ms-21.0.11`,
SDK at `%LOCALAPPDATA%\Android\Sdk`, Python at
`%LOCALAPPDATA%\Python\pythoncore-3.14-64\python.exe`, production API https://lecomax.com.
Gradle task: `:app:assembleRelease -PreactNativeArchitectures=arm64-v8a`.
The installed APK is still build 8 until delivery is verified. Copy the completed
build 9 into phone `/sdcard/Zakaria/lecomax-learn-1.0.7-build9.apk`, checksum it,
and let the user install it as previously requested. No public deployment.

Immutable source history currently includes `windows-pc-live-20261010` and
`windows-pc-connection-verified-20261010`; preserve them and append subsequent
validation. The build copy was synchronized with the initial feature report;
later verification reports require a later rebuild to appear in that APK.
