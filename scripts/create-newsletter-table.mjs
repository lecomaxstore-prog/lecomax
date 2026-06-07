import { readFileSync } from "fs";

const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of raw.split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.split("//")[1].split(".")[0];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: `
      CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        email text NOT NULL UNIQUE,
        name text,
        active boolean NOT NULL DEFAULT true,
        source text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
    `,
  }),
});

const body = await res.text();
console.log("Status:", res.status);
console.log("Body:", body);
