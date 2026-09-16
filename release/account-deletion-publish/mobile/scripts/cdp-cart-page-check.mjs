import { writeFile } from "node:fs/promises";

const pages = await fetch("http://127.0.0.1:9227/json").then((response) => response.json());
const page = pages.find((candidate) => candidate.type === "page");
if (!page) throw new Error("Expo preview page was not found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data));
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 430,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Runtime.evaluate", {
  expression: `(() => {
    localStorage.setItem('lecomax:onboarding:complete', 'complete');
    localStorage.setItem('lecomax-user', JSON.stringify({
      state: {
        name: 'Zakaria',
        email: 'zakaria@example.com',
        phone: '0699289568',
        city: 'Sidi Bennour',
        address: '49 Rue Ibn Khaldoun',
        addresses: [{
          id: 'visual-check-address',
          name: 'Zakaria',
          email: 'zakaria@example.com',
          phone: '0699289568',
          city: 'Sidi Bennour',
          address: '49 Rue Ibn Khaldoun'
        }],
        selectedAddressId: 'visual-check-address'
      },
      version: 0
    }));
  })()`,
});
await send("Page.navigate", {
  url: "http://localhost:8082/product/c-chaussons-fleurs-rose-femme",
});
await new Promise((resolve) => setTimeout(resolve, 7000));
await send("Runtime.evaluate", {
  expression: `document.querySelector('[aria-label="Ajouter au panier"]')?.click()`,
});
await new Promise((resolve) => setTimeout(resolve, 2200));
await send("Page.navigate", { url: "http://localhost:8082/cart" });
await new Promise((resolve) => setTimeout(resolve, 5500));

const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile("out/cart-page-final-check.png", Buffer.from(screenshot.data, "base64"));
const responsive = [];
for (const width of [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 600 ? 844 : 1024,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await new Promise((resolve) => setTimeout(resolve, 120));
  const check = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      checkoutVisible: Boolean(document.querySelector('[aria-label="Continuer vers le paiement"]'))
    })`,
    returnByValue: true,
  });
  responsive.push({ width, ...JSON.parse(check.result.value) });
}
const result = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    hasCartItem: Boolean(document.querySelector('[aria-label^="Supprimer "]')),
    hasAddress: document.body.textContent?.includes('49 Rue Ibn Khaldoun'),
    hasErrorOverlay: Boolean(document.querySelector('[data-nextjs-dialog], .vite-error-overlay')),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  })`,
  returnByValue: true,
});
console.log(JSON.stringify({ page: JSON.parse(result.result.value), responsive }));
socket.close();
