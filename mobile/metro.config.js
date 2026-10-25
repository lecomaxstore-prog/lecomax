const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const API_PROXY_TARGET = (process.env.EXPO_PUBLIC_API_PROXY_TARGET || "https://lecomax.com")
  .replace(/\/$/, "");

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => (request, response, next) => {
    if (!request.url?.startsWith("/api/")) {
      return metroMiddleware(request, response, next);
    }

    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", async () => {
      try {
        const method = request.method || "GET";
        const body = method === "GET" || method === "HEAD"
          ? undefined
          : Buffer.concat(chunks);
        // Opt-in preview for the brand registry before its API is deployed.
        const target = request.url.split("?")[0] === "/api/products/brands"
          ? (process.env.EXPO_BRANDS_PROXY_TARGET || API_PROXY_TARGET).replace(/\/$/, "")
          : API_PROXY_TARGET;
        const upstream = await fetch(`${target}${request.url}`, {
          method,
          body,
          headers: {
            accept: request.headers.accept || "application/json",
            ...(request.headers.authorization
              ? { authorization: request.headers.authorization }
              : {}),
            ...(request.headers["content-type"]
              ? { "content-type": request.headers["content-type"] }
              : {}),
            ...(request.headers["idempotency-key"]
              ? { "idempotency-key": request.headers["idempotency-key"] }
              : {}),
            ...(request.headers["x-lecomax-client"]
              ? { "x-lecomax-client": request.headers["x-lecomax-client"] }
              : {}),
          },
          redirect: "manual",
        });
        const payload = Buffer.from(await upstream.arrayBuffer());
        response.statusCode = upstream.status;
        upstream.headers.forEach((value, key) => {
          if (!["connection", "content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
            response.setHeader(key, value);
          }
        });
        response.setHeader("content-length", String(payload.length));
        response.end(payload);
      } catch (error) {
        console.error("[mobile-api-proxy]", error instanceof Error ? error.message : error);
        response.statusCode = 502;
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ error: "API L’ECOMAX indisponible." }));
      }
    });
    return undefined;
  },
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
