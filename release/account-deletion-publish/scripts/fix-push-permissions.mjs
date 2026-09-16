// Fix missing GRANT on push_subscriptions table
const SUPABASE_URL = "https://yddqwgdgeljkzfsmtein.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
  GRANT ALL ON public.push_subscriptions TO service_role;
  GRANT ALL ON public.push_subscriptions TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon;
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='allow_service_role'
    ) THEN
      CREATE POLICY allow_service_role ON public.push_subscriptions TO service_role USING (true) WITH CHECK (true);
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='allow_anon_insert'
    ) THEN
      CREATE POLICY allow_anon_insert ON public.push_subscriptions FOR INSERT TO anon WITH CHECK (true);
    END IF;
  END $$;
`;

const res = await fetch(`${SUPABASE_URL}/pg`, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});
const body = await res.text();
console.log("pg endpoint status:", res.status, body);
