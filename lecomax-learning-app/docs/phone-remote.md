# Phone-to-phone sharing checkpoint

Current source update: see [build 18: responsive viewer and saved return](phone-responsive-resume-build18.md). It supersedes the older rotation-stop and memory-only session behavior described below. Capture still requires Android consent after it ends.

## Direct Tailscale mode (new Android build required)

The default mode now hosts the viewer on the sharing Android phone itself. Your PC can be switched off. Both phones must be connected to the same Tailscale network, with its access rules allowing TCP 8092 to the sharing phone. Installing Tailscale alone does not grant access to someone else's network.

1. Install the new native Android build on the phone to share. Connect Tailscale and open My remote phone → Share this phone.
2. Enable remote touch in Android Accessibility, start sharing and accept Android screen capture.
3. Copy the displayed `http://100.x.x.x:8092` address and pairing code to your main phone. In L’ECOMAX use My remote phone → View another phone → Open connection. With the embedded-viewer update for build 12, pairing and the remote screen stay inside the app. The viewer remembers the address, never the code.
4. Enter the code on the main phone and keep its viewer open. On the OTHER phone (the sharing phone), approve viewing/control in L’ECOMAX. Each session needs fresh consent; unattended access is not supported. An external browser also works, but leaving that browser ends its session; approval must happen on the other device.
5. Stop in either phone or the Android notification. In build 13, hiding the direct viewer pauses frames and controls. Return within two minutes to resume the same approved session without entering the code again. Brief network failures retry automatically. A missing heartbeat disables streaming after 15 seconds and ends the session after two minutes. Pairing expires in ten minutes; sessions last at most four hours.

Build 13 keeps the direct viewer inside the app and remembers the chosen viewer/share mode and address. The session credential stays in memory only: explicit Stop, full app/process termination, session expiry, or Android ending capture requires fresh pairing. Leaving the viewer route explicitly disconnects. The sharing phone can press Home and open other apps; its foreground service remains visible in the Android notification, including after removing the task. Android/OEM force-stop and capture revocation still end sharing. On newer Android versions locking the device can revoke capture; this is shown as a capture-ended state instead of a silent reset. Battery management may still kill the service on some devices, so physical testing on the second phone is required. The hosted relay retains its existing disconnect behavior.

The HTTP listener binds only to the detected Tailscale IPv4 VPN interface, not Wi-Fi or all interfaces. Tailscale encrypts transport between the phones; there is no external relay in this mode. The browser may label the HTTP page as not secure because it does not use browser TLS. Do not forward port 8092 or expose it publicly. Tailscale must stay connected, and Android VPN/app battery restrictions may interrupt sharing. Secure Android screens may appear black. Keep the host phone unlocked and in the same orientation.

The native service checks a `tun` interface with a `100.64.0.0/10` address. Devices where Tailscale does not expose that interface need physical compatibility investigation; the app fails closed instead of binding to a public/Wi-Fi interface. Two-phone device testing is still required, including Home/app switching, mobile data, capture cancellation, approval/rejection, remote input, lock, rotation, stopping and VPN loss. No device installation or deployment is implied by source/build checks.

## Internet invitation hosting

The new account-free recipient flow over Wi-Fi/mobile data is documented in [phone-internet-hosting.md](phone-internet-hosting.md). It is prepared locally and requires its dedicated relay, backend/public-page deployment and a new Android build. The existing key-based relay below remains a separate advanced option.

## Optional hosted relay

The relay, browser viewer, Android capture/input service and More → My remote phone screen are implemented locally. Nothing has been deployed and no release APK containing this feature has been installed or device-tested. A new native Android build is required; an OTA update or Expo Go cannot add this service.

## Hosting preparation

Use a separate Linux server with Docker Compose and a domain whose DNS points to that server. Do not run this public deployment on your Windows PC. Copy `phone-relay/` to the server. Generate a private key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` on a trusted machine. Set `PHONE_RELAY_KEY` and `PHONE_RELAY_DOMAIN` in the server environment, then run `docker compose up -d --build` in that directory. Do not commit the key or put it in a URL.

Caddy terminates HTTPS and forwards WebSocket traffic over the private container network. Only ports 80 and 443 are published. Allow these ports on the hosting firewall. `/health` returns a minimal health response. This deployment recipe is prepared but has not been executed. Run only one relay replica: sessions live in memory and end on restart. There is no account service or session persistence. The current limits suit private personal use, not a public multi-tenant service. Proxy traffic shares a per-address limit.

## Pairing

1. Install a newly built Android app on the phone to share. Open More → My remote phone.
2. Enter the relay HTTPS origin. Enable remote touch through Android Accessibility settings. Enter the private relay key; it stays in memory and is cleared from the UI after starting.
3. Start sharing and accept Android screen capture consent. Keep the phone unlocked and in the same orientation.
4. On your other phone, open that HTTPS origin in a browser. Enter the 32-character code displayed in the app within ten minutes. Do not send the host access key to the viewer.
5. Return to the sharing app and explicitly approve the requesting viewer. Only then are frames and controls relayed.
6. Stop through the app, the ongoing Android notification, or the viewer’s Disconnect button. Reject uses the same stop action. Hiding the viewer disconnects it. Disconnecting either side invalidates the code. Sessions expire after four hours.

## Boundaries and remaining validation

This is low-frame-rate JPEG screen sharing (about two frames per second) over TLS WebSockets, not WebRTC or remote PC access. There is no audio, keyboard text injection, unattended access or lock-screen control. TLS protects each hop; the relay operator can see frames and controls. Do not call this end-to-end encryption. Secure Android content may be blacked out. Rotation stops sharing rather than risking misaligned taps.

Before release, test on two physical phones: capture cancellation, accessibility disabled/enabled, rejection, approval, portrait/landscape, tap/swipe/navigation, notification stop, Android system stop, lock/unlock, network loss, expiry and process termination. Verify the accessibility disclosure and consent on the intended Android version. Android capture lifecycle reference: https://developer.android.com/media/grow/media-projection .

The Windows PC bridge and `.pc-remote/CONNECT.txt` remain separate local-network tools. No PC inbound port, router forwarding or public PC tunnel is configured by this work.
