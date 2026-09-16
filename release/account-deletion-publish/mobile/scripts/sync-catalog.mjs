import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(mobileRoot, "..");

async function readRootSiteUrl() {
  const content = await readFile(path.join(repositoryRoot, ".env.local"), "utf8").catch(() => "");
  const line = content.split(/\r?\n/).find((value) => value.trim().startsWith("NEXT_PUBLIC_SITE_URL="));
  return (process.env.EXPO_PUBLIC_API_URL || line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") || "https://lecomax.com").replace(/\/$/, "");
}

async function fetchJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  return response.json();
}

const baseUrl = await readRootSiteUrl();
const [products, categories, promotions, settings] = await Promise.all([
  fetchJson(baseUrl, "/api/products?active=true"),
  fetchJson(baseUrl, "/api/categories"),
  fetchJson(baseUrl, "/api/promotions"),
  fetchJson(baseUrl, "/api/settings"),
]);

if (!Array.isArray(products) || products.length === 0) throw new Error("The live catalog is empty.");

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: new URL(baseUrl).host,
  products: products.filter((product) => product?.active !== false),
  categories: Array.isArray(categories) ? categories.filter((category) => category?.active !== false) : [],
  promotions: Array.isArray(promotions) ? promotions.filter((promotion) => promotion?.active !== false) : [],
  settings: Array.isArray(settings) ? settings : [],
};

await writeFile(path.join(mobileRoot, "src", "data", "catalog.snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Synced ${snapshot.products.length} products, ${snapshot.categories.length} categories and ${snapshot.promotions.length} promotions from ${snapshot.source}.`);
