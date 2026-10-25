# Quick QR pairing — Android 1.0.14 / build 16

Install this build on both phones and connect both to the same Tailscale network with access between them.

1. On the phone whose screen you want to control, open **My remote phone → Share this phone**. Enable remote touch if needed, then tap **Start screen sharing** and accept Android's capture prompt.
2. Tap **Allow QR connection**. This explicitly grants one phone that scans the displayed QR permission to view and control this screen. The QR is valid for two minutes; **Hide and cancel QR** revokes it immediately. Generate another QR if it expires.
3. On the main phone, open **My remote phone → Scan a phone** and scan the QR. No address or code entry and no second owner-approval tap are needed for this authorized QR.
4. Either phone can be the viewer: stop the existing sharing session before swapping roles, then repeat the steps with the phones exchanged.

Manual pairing still requires the sharing phone's approval. Both scanner entry points scan the **sharing phone's QR**; an idle viewer does not display a reverse-invitation QR.

## Reliability changes

- A fast tap or temporarily paused/locked screen no longer looks like an invalid credential and disconnects the viewer.
- **Retry connection** recovers a failed WebView. A joined token is retained only in native app-screen memory and restored only to the same viewer origin. Tokens are not put in URLs or persisted to device storage.
- The scanner has a flashlight and camera retry, ignores duplicate/background scans, and rejects scanning this phone's own address.
- Approved Tailscale sessions still have no inactivity/total-duration cutoff. Hidden viewers pause media/input and resume when returning.

## Remaining device checks and limits

No physical phones were connected during development. Test real QR scanning, QR cancellation/expiry, swapping roles, app switching/Recents, VPN interruption and explicit Stop on both phones. Automated time advancement is not an overnight device test.

Android can end capture on screen lock, capture revocation, process death, force-stop or reboot. Rotation still ends capture in this implementation. The VPN must return on its original address. Restarting the viewer app loses its in-memory token and requires new pairing. A lost initial join response retries automatically up to three times using the same attempt; a persistent outage can still require restarting sharing. If Disconnect is tapped while the viewer is offline, use Stop sharing on the host to revoke the retained session.

No public deployment or OTA update is performed by generating the APK. Post-build verification records are in workspace history and need a later build to appear in the installed app.
