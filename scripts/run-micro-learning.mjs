import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const base = process.env.LEARNING_BASE_URL || "http://localhost:3000";
const url = new URL(base);
if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("This runner is for localhost only. Use a production scheduler for a deployed site.");
const schedulerSecret = process.env.LEARNING_CRON_SECRET || process.env.CRON_SECRET;
if (!schedulerSecret) throw new Error("Set LEARNING_CRON_SECRET in .env.local and restart the development server first.");

let stopped = false;
process.on("SIGINT", () => { stopped = true; process.exit(0); });
process.on("SIGTERM", () => { stopped = true; process.exit(0); });
console.log("Learning scheduler running; due lessons are determined by database settings.");
while (!stopped) {
  try {
    const response = await fetch(new URL("/api/cron/micro-learning", url), {
      headers: { authorization: `Bearer ${schedulerSecret}` }, signal: AbortSignal.timeout(55_000),
    });
    console.log(new Date().toISOString(), response.status, await response.text());
  } catch (error) { console.error("Scheduler request failed:", error.message); }
  await new Promise(resolve => setTimeout(resolve, 60_000));
}
