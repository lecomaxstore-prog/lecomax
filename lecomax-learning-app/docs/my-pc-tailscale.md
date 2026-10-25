# 4G/5G access with Tailscale

This is the supported path for using the current My PC bridge away from home.

1. Install Tailscale on the Windows PC from https://tailscale.com/download and sign in to the same account used on the phone.
2. Install Tailscale on the Android phone and sign in to that account. Keep Tailscale connected while using 4G/5G.
3. On Windows, open PowerShell in this repository and run `Start My PC.cmd --host=<PC-Tailscale-IP>` (or run `node scripts/start-pc-remote.mjs --host=100.x.x.x`). The Tailscale IPv4 address is shown by `tailscale ip -4`.
4. Read `.pc-remote/CONNECT.txt` and enter the address and pairing code in L’ECOMAX Learn ? My PC. Use the `100.x.x.x` address, not the home Wi-Fi address.
5. Keep the PC awake. Tap Disconnect when finished, or run `Stop My PC.cmd` on Windows.

The bridge is still HTTP, but the traffic is inside Tailscale’s encrypted private network. The bridge remains restricted to private/Tailscale addresses, pairing is required, sessions expire, and no router port forwarding is needed. Never expose TCP 6081 to the public internet.

If the phone cannot connect, check that both devices appear online in Tailscale, that Windows Firewall permits Node on the Tailscale interface, and that the host was started with the Tailscale address. The helper is not an unattended Windows service; the PC must be logged in and the helper must be running.
