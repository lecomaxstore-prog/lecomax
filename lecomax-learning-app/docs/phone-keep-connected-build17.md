# Keep the phone connected - Android 1.0.15 / build 17

Install build 17 on the main/viewing phone (both phones may use this build).

1. On the second phone, start Tailscale screen sharing and allow the QR connection. Scan it on the main phone.
2. After connection, the second phone may press Home, open other apps or leave the learning app. The foreground service keeps sharing active, with its visible Stop sharing notification.
3. On the main phone, Android Back or Back / keep connection pauses viewing without ending the approved session. The main app may also be closed.
4. Reopen My remote phone > View another phone > Open connection to resume the saved connection. No new scan is needed while the original host session is still active at the same Tailscale address.
5. On the second phone, Stop sharing in the app or notification revokes access. The main phone can also explicitly Disconnect phone.

Only direct Tailscale sessions are saved in Android secure storage, bound to the exact host origin. Credentials are never placed in URLs, logs, AsyncStorage, browser storage or pairing preferences. New QR scans take priority over saved tokens. A server rejection or explicit viewer disconnect clears the saved credential. If secure storage fails, the viewer shows a warning and a later app restart may require pairing again.

## Limits and acceptance

Leaving the app is different from Android stopping capture. Screen lock, force-stop, process death, reboot, capture revocation, and the current rotation handling can end the host capture and require new consent. This change does not silently restart capture after Android revokes it. Legacy relay sessions do not gain persistent resumption. Disconnect while offline may require Stop sharing on the host.

Physical tests still required: real pairing on two phones; second-phone Home/Back/Recents and swiping the app away; main-phone close/relaunch/reopen; host Stop in app and notification; temporary VPN interruption; overnight operation. No physical phones are connected during this work. Automated restart tests simulate remount/module restart and do not prove Android OEM background behavior.

No public deployment or OTA update is performed by building the APK.
