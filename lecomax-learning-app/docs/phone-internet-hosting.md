# Internet phone sharing — hosting preparation

Prepared locally; not deployed or tested on physical phones. This supplements the existing Tailscale workflow with view-only internet invitations.

## Flow

The signed-in owner opens My remote phone → Share over internet → Create internet sharing link. The Learn backend authenticates the owner and creates an invitation at `https://phone.lecomax.com`. The shared WhatsApp link contains only a one-use publisher credential, in its fragment. It never contains the viewer credential or the server key.

The recipient needs an updated Android Learn installation and Wi-Fi or mobile data. The `/phone-share` screen is available without an account; other app routes remain behind the owner gate. The recipient explicitly approves sharing and accepts Android's capture prompt. No Accessibility permission is needed for this view-only flow. Opening a link alone does not start capture.

Both phones connect outward to the relay using TLS WebSockets. No Tailscale, inbound phone ports, PC, or TURN service is required for this JPEG-frame transport. The relay can read frames; this is not end-to-end encryption. No audio or remote input is supported.

## Managed hosting option: Render

Prepared Blueprint: `phone-relay/render.yaml` (repository path `lecomax-learning-app/phone-relay/render.yaml`). It creates one paid Starter Docker web service in Frankfurt, with `/health` checks and automatic deploys disabled. Render terminates TLS; do not deploy the Caddy Compose service on Render.

Render supports [public WebSockets without a fixed connection-duration limit](https://render.com/docs/websocket). Its official [comparison lists Starter compute at $7/month](https://render.com/articles/render-vs-railway), before bandwidth and other applicable charges (checked October 13, 2026). Confirm the actual price in the dashboard before creating the service. Screen frames count as outbound bandwidth. For illustration, 100 KB per frame at two frames per second is about 0.72 GB per viewing hour; actual usage depends on image size and viewing time. This is an estimate, not a measured session.

After approving this hosting choice and paid deployment:

1. Put the reviewed relay source and Blueprint on an authorized Git branch accessible to Render. The Blueprint paths assume this full repository layout; do not publish unrelated local changes or secrets.
2. In Render, create a Blueprint from that branch and select the Blueprint path above. Enter a freshly generated lowercase 64-hex `PHONE_RELAY_KEY` when prompted. Set the same value on the existing Learn backend.
3. Review the paid plan and create the service. Add the DNS CNAME for `phone.lecomax.com` using the exact target Render shows, then wait for domain verification and TLS.
4. Check `https://phone.lecomax.com/health` and `/internet-viewer`. Deploy the backend and invitation landing files, and install the updated Android app as described below.

No Render account, paid service, Git push, DNS change or deployment has been created during preparation. The Blueprint has not been submitted to Render for remote validation. The [Blueprint reference](https://render.com/docs/blueprint-spec) documents its fields.

## Alternative: dedicated Linux host

Use a dedicated Linux Docker host. Point `phone.lecomax.com` DNS at that host. The hostname is fixed in the app, native module and backend; changing it requires coordinated source changes and a new Android build.

Copy `phone-relay/` to the host. Copy its `.env.example` to `.env`, then generate a server secret on that host:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put that value in the host's private `PHONE_RELAY_KEY` environment setting and the existing Learn backend's server-only environment. Never place this key in an Expo public variable, APK, invitation or repository. Keep `.env` private.

After deployment authorization, run from `phone-relay/`:

```sh
docker compose config --quiet
docker compose up -d --build
curl --fail https://phone.lecomax.com/health
curl --fail https://phone.lecomax.com/internet-viewer
```

Caddy publishes ports 80/443 and provisions TLS; port 8091 stays private to the containers. Run one relay replica. Sessions are memory-only and end on restart. Deploy the Learn backend's `app/api/learning-mobile/phone-invitations/route.ts` and the three `public/phone-invite.*` files to the existing site. Build and install an updated Learn Android APK on both phones. Source preparation alone does not update installed apps.

## Limits and acceptance checks

Invitations expire after ten minutes; a publisher credential is consumed at first capture connection. Sessions expire after four hours. A disconnected viewer can reconnect for up to approximately 75 seconds (60-second grace plus the sweep interval). A capture connection loss ends the session and requires fresh consent. Stop in either app or the Android notification ends sharing. Screen lock or Android capture revocation can also end it.

The relay admits at most 16 internet invitations and 48 internet sockets. Frame/message sizes and message rates are bounded. This is a private, single-owner deployment, not a public multi-tenant service.

Before calling this usable, verify real HTTPS/WebSockets, owner-only creation, logged-out recipient launch from WhatsApp, declining Android consent, Wi-Fi/mobile-data viewing, background behavior, pause/reconnect, lock/rotation, expired/reused invitations and Stop from both phones. Test that navigating away from the public invitation still requires owner login. Docker build, DNS/TLS and physical-device checks remain outstanding until an actual hosting target and new APK are available.

Local regression commands:

```sh
node --test lecomax-learning-app/tests/phone-internet-relay.test.cjs lecomax-learning-app/tests/phone-internet-flow.test.cjs lecomax-learning-app/tests/phone-invitation-web.test.cjs
node lecomax-learning-app/scripts/change-report.cjs --check
```
