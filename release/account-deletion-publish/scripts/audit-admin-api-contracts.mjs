import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const adminRoots = [path.join(root, "app", "admin"), path.join(root, "components", "admin")];
const sourceExtensions = new Set([".ts", ".tsx"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(target);
  }
  return files;
}

const routeFiles = await walk(path.join(root, "app", "api"));
const routes = new Map();
for (const filename of routeFiles.filter((file) => path.basename(file) === "route.ts")) {
  const source = await readFile(filename, "utf8");
  const route = "/" + path.relative(path.join(root, "app"), path.dirname(filename)).split(path.sep).join("/");
  const methods = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) methods.add(match[1]);
  routes.set(route, methods);
}

function normalizeEndpoint(endpoint) {
  const pathname = endpoint.split("?")[0].replace(/\$\{[^}]+\}/g, "[id]").replace(/\/$/, "");
  return pathname || "/";
}

function findRoute(endpoint) {
  if (routes.has(endpoint)) return endpoint;
  const parts = endpoint.split("/");
  for (const route of routes.keys()) {
    const routeParts = route.split("/");
    if (parts.length !== routeParts.length) continue;
    if (routeParts.every((part, index) => part.startsWith("[") || part === parts[index])) return route;
  }
  return null;
}

const calls = [];
for (const filename of (await Promise.all(adminRoots.map(walk))).flat()) {
  if (filename.includes(`${path.sep}how-it-was-built${path.sep}`)) continue;
  const source = await readFile(filename, "utf8");
  for (const match of source.matchAll(/fetch\(\s*([`'"])(\/api\/[^`'"]+)\1\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/g)) {
    const endpoint = normalizeEndpoint(match[2]);
    const options = match[3] ?? "";
    const method = /method\s*:\s*["'](GET|POST|PUT|PATCH|DELETE)["']/i.exec(options)?.[1]?.toUpperCase() ?? "GET";
    calls.push({ file: path.relative(root, filename).split(path.sep).join("/"), endpoint, method });
  }
}

const missing = [];
for (const call of calls) {
  const route = findRoute(call.endpoint);
  if (!route) missing.push({ ...call, problem: "route missing" });
  else if (!routes.get(route)?.has(call.method)) missing.push({ ...call, route, problem: `${call.method} handler missing` });
}

const uniqueMissing = [...new Map(missing.map((item) => [`${item.file}:${item.endpoint}:${item.method}`, item])).values()];
console.log(JSON.stringify({ ok: uniqueMissing.length === 0, checkedCalls: calls.length, routeCount: routes.size, failures: uniqueMissing }, null, 2));
if (uniqueMissing.length) process.exit(1);
