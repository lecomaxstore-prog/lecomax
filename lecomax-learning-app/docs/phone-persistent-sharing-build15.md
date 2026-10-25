# Persistent Tailscale sharing — build 15

Android version 1.0.13 / versionCode 15 removes application-imposed inactivity and total-duration limits from approved direct Tailscale sessions. The sharing foreground service is independent of the app screen and uses `stopWithTask=false`. Leave the sharing phone's app with Home, switch apps, or remove its task from Recents without deliberately ending the service.

The existing Stop sharing button and ongoing Android notification stop the service and invalidate its token. Disconnect on the viewer also ends the session when the server is reachable. A hidden or unreachable viewer pauses screen delivery and input; returning with the same in-memory token resumes without approval or another code. The viewer retries network failures without a deadline. During a temporary VPN outage the host retains its listener on the original Tailscale address and resumes when that address returns.

Unapproved pairing still expires after ten minutes. Approval remains required. No public-interface listener, automatic capture permission, reboot restart or credential persistence is introduced. External relay mode is unchanged.

Android can terminate capture when the device locks, capture permission is revoked, the process is killed, the app is force-stopped, or the phone reboots. The existing rotation stop remains. These events require a new screen-sharing prompt. A different Tailscale address requires restarting sharing; the app does not control the Tailscale VPN. If the viewer process or WebView is destroyed, its in-memory token is lost; stop and start sharing again to pair. If viewer Disconnect is tapped while offline, stop sharing on the host to revoke the retained session.

## Physical acceptance still required

1. Install build 15 on both phones, connect Tailscale, start sharing on the second phone, pair and approve.
2. Press Home on the sharing phone, use another app, then remove Learn from Recents. Confirm its sharing notification remains and the viewer still operates.
3. Background the viewer longer than two minutes. Confirm returning resumes without another code; no hidden-viewer input or frames should be delivered.
4. Disconnect and reconnect the VPN with the same address. Confirm the session resumes.
5. Stop using the host notification and then repeat with the host in-app button. Confirm old viewer credentials stop working.
6. Check screen lock, force-stop and rotation separately; verify the app explains that capture must be started again.

No connected physical device was available during implementation. Simulated time advancement in JVM/browser tests is not a real overnight device test.
