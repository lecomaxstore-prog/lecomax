import "server-only";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";

export function publicNetworkAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a !== 0 && a !== 10 && a !== 127 && a < 224 &&
      !(a === 100 && b >= 64 && b <= 127) && !(a === 169 && b === 254) &&
      !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && [0, 168].includes(b)) &&
      !(a === 198 && [18, 19].includes(b));
  }
  // Only native global-unicast IPv6. Exclude mapped, transition and documentation ranges.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) &&
    !/^2001:(?:0:|db8:)/i.test(address) && !/^2002:/i.test(address);
}

export async function fetchProductHtml(value: string): Promise<string> {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") throw new Error("INVALID_URL");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(item => !publicNetworkAddress(item.address))) throw new Error("PRIVATE_ADDRESS");
  // Connect to the address just validated. A second DNS resolution could rebind
  // an attacker-controlled hostname to an internal service.
  return new Promise((resolve, reject) => {
    const req = request({
      hostname: addresses[0].address, family: addresses[0].family, port: 443,
      servername: isIP(host) ? undefined : host,
      path: `${url.pathname}${url.search}`, method: "GET",
      headers: { Host: url.host, Accept: "text/html", "User-Agent": "LecomaxProductImporter/1.0" },
    }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      if (response.statusCode !== 200 || !response.headers["content-type"]?.includes("text/html")) {
        response.resume(); req.destroy(new Error("INVALID_RESPONSE")); return;
      }
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 2_000_000) { req.destroy(new Error("RESPONSE_TOO_LARGE")); return; }
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    const timer = setTimeout(() => req.destroy(new Error("FETCH_TIMEOUT")), 10_000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end();
  });
}
