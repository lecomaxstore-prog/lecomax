# Global remote PC architecture

The current `My PC` implementation is a local authenticated UltraVNC bridge. `scripts/start-pc-remote.mjs` starts UltraVNC on loopback, exposes a same-network HTTP/WebSocket gateway on a private IPv4 address, and the mobile `PcDesktop` screen embeds noVNC. This is intentionally not internet-safe: it has no cloud signaling, outbound host tunnel, TURN service, account authorization, or MFA.

## Implemented client boundary

`utils/pc-remote.ts` now accepts either the existing private `http://<LAN-IP>:6081` bridge or an HTTPS origin on the default port. HTTPS is only an origin allowlist entry; the app does not claim that a gateway exists or that NAT traversal works. Credentials, query strings, alternate ports, unsafe schemes, and paths remain rejected. The UI explains that a real remote gateway must provide authentication, signaling, and TURN relay.

## Required production architecture

1. A Windows host agent authenticates outbound to a cloud signaling service using a device key registered to the L’ECOMAX account. It must never accept inbound VNC or expose a router port.
2. The signaling service authorizes a short-lived session after account authentication and optional MFA, then exchanges WebRTC offers/answers and ICE candidates. It stores device presence and revocation state, not desktop credentials.
3. A TURN service provides encrypted relay fallback for symmetric NAT and restrictive mobile networks. STUN alone is insufficient.
4. The agent captures the Windows desktop, sends an encrypted WebRTC video track, and receives authenticated input data-channel messages. It must apply an allowlist for mouse/keyboard operations and stop on token expiry or revocation.
5. The mobile client uses an HTTPS API plus WebRTC, shows device presence and connection quality, and reconnects with a new short-lived session. NoVNC remains the compatibility path for trusted local HTTP only.

## Deployment still required

A production implementation needs a signaling API, TURN credentials/service, Windows capture/input agent, account/MFA integration, key rotation and audit storage. Those services are not present in this repository, so the local bridge cannot be honestly advertised as worldwide remote access yet. Do not port-forward TCP 6081 or expose the current HTTP bridge to the public internet.
