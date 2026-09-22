# Supabase and APIs: build your first connected shop

**New to coding? Start with [your simple daily plan](./my-daily-learning-plan.md).** It introduces these database lessons gradually, starting in Week 4.

This follows [your Next.js beginner guide](./learn-nextjs-from-zero.md). Take one mission per session. The goal is to understand the journey of one product from storage to screen.

All code below is a practice exercise, not a change to your running shop. Use a separate practice Next.js project and a separate Supabase project with fake products. Nothing here has been executed against your database.

## 1. Understand the four pieces

**Database:** stores information after a page closes. Supabase provides a PostgreSQL database.

**Table:** a collection of similar records. A products table has one row per product. Columns describe it: name, price and availability.

**API:** an interface another program can call. Think “ask for products” or “submit an order.” An endpoint is one API address, such as `/api/practice-products`.

**JSON:** a text format used to send structured values between programs:

```json
{"name":"Practice headphones","price_mad":120}
```

Our exercise has this flow:

```text
Your browser
    │ GET /api/practice-products
    ▼
Your Next.js Route Handler
    │ Supabase JavaScript library → Supabase Data API
    ▼
PostgreSQL database checks permissions and reads rows
    │ rows travel back as data
    ▼
Your API sends JSON → React displays product cards
```

There are two APIs in this diagram: your Next.js endpoint and Supabase's generated Data API. The Supabase library saves you from manually constructing its HTTP requests. Supabase can also be called from the browser with suitable permissions; we use a Next.js endpoint here to learn request handling.

**Quick check:** If you change a heading, is that a database change? No. If you save a different product price in a table, it is.

## 2. Prepare a practice app

If you already have a separate App Router practice project, use it. Otherwise, in a folder outside the real shop, run:

```sh
npx create-next-app@15 supabase-practice --ts --tailwind --eslint --app --use-npm --import-alias "@/*" --no-src-dir
cd supabase-practice
npm install @supabase/supabase-js
```

This uses Next.js major version 15 to match the shop. If prompted for additional optional features, the defaults are sufficient. The snippets assume `app/` and `lib/` at the project root and the `@/*` alias. They do not require a particular Tailwind version.

In Supabase, create a practice project, then open its SQL Editor. You will run the next SQL there, not in the JavaScript terminal. Your Supabase database password is different from an API key.

## 3. Create your first table

Run this once in the practice project's SQL Editor:

```sql
begin;

create table public.learning_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  price_mad integer not null check (price_mad >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.learning_products enable row level security;

revoke all on public.learning_products from anon, authenticated;
grant select on public.learning_products to anon, authenticated;

create policy "Read active practice products"
on public.learning_products
for select
to anon, authenticated
using (is_active = true);

insert into public.learning_products (name, price_mad, is_active)
values
  ('Practice headphones', 120, true),
  ('Practice sneakers', 250, true),
  ('Hidden draft', 99, false);

commit;
```

Read the important words:

| SQL | Meaning |
| --- | --- |
| `create table` | Make a place to store these records |
| `uuid primary key` | Give every row its own unique identity |
| `text`, `integer`, `boolean` | Words, whole numbers, true/false |
| `not null` | A value is required |
| `default` | Use this value when one is not supplied |
| `check` | Reject values that break this rule |
| `insert into` | Add records |
| `begin` / `commit` | Apply these statements together as a transaction |

We use whole MAD for an easy exercise. Real prices with fractions can use integer minor units or a carefully chosen decimal type; avoid assuming floating-point arithmetic is exact for money.

To inspect your rows in SQL Editor:

```sql
select id, name, price_mad, is_active
from public.learning_products
order by created_at, id;
```

**Expected:** three rows in SQL Editor. Later, the public API will see only the two active rows. SQL Editor normally runs with elevated database privileges, so seeing a row there does not prove a customer can see it.

## 4. Understand the permissions

A table grant permits an operation such as SELECT. Row Level Security (RLS) then limits which rows that operation can reach. Our rule lets visitors read active products. We did not give visitors permission to create, edit or delete them.

A publishable API key identifies the app; it does not identify a logged-in person. Supabase Auth supplies user identity separately. Secret keys and legacy service-role keys have elevated access and bypass RLS, so they belong only in trusted server code with its own authorization checks. [Official API key guide](https://supabase.com/docs/guides/getting-started/api-keys)

This entire exercise needs only a publishable key, including inside its server route. You do not need elevated database privileges to read public products.

**Predict:** can someone make the draft visible by changing the page code? Not through this public read policy. The database filters it out before sending the result.

## 5. Connect Next.js to Supabase

Open your practice project's Supabase Connect dialog or API Keys settings. Copy the project URL and publishable key into `.env.local` at the practice app root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Replace both placeholders. The URL and key must belong to the same project. Do not substitute a secret key. `NEXT_PUBLIC_` means Next.js may expose that value to browser code. Keep `.env.local` out of Git. Restart the development server after changing this file.

Create `lib/learning-supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function createLearningSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Practice Supabase URL or publishable key is missing.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

`process.env` reads configuration. `createClient` prepares a Supabase client; it does not create a table or immediately read rows. This client deliberately has no sign-in session. Cookie-based authentication is a later lesson, not something this helper implements.

## 6. Build your own API

Create `app/api/practice-products/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createLearningSupabase } from "@/lib/learning-supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createLearningSupabase();
    const { data, error } = await supabase
      .from("learning_products")
      .select("id, name, price_mad")
      .order("name")
      .limit(20);

    if (error) {
      console.error("Practice product query failed:", error.code, error.message);
      return NextResponse.json(
        { error: "Could not load products. Check the development terminal." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { products: data ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Practice product API failed:", error);
    return NextResponse.json(
      { error: "Could not connect. Check the development terminal." },
      { status: 500 },
    );
  }
}
```

Read the query as a sentence: “From learning_products, select these three columns, sort by name, and return at most 20 rows.” `await` waits for the result. Supabase query failures usually appear in `error`, so a try/catch alone is not enough. The catch also handles configuration errors and thrown exceptions.

`GET` handles a read request. `NextResponse.json` produces the HTTP response. We keep this exercise uncached so edits are easier to observe. Next.js uses `route.ts` for request handlers; `page.tsx` renders a page. [Next.js 15 Route Handlers](https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware)

Start the practice app:

```sh
npm run dev
```

Open the printed local address followed by `/api/practice-products`, usually `http://localhost:3000/api/practice-products`.

**Checkpoint:** you should see a `products` array with two objects, each with a generated ID, name and price. The hidden draft should be absent. Get this working before adding a screen.

## 7. Show the database products on a page

Create `app/practice/page.tsx`:

```tsx
"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  price_mad: number;
};

export default function PracticePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/practice-products", {
        cache: "no-store",
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "The request failed.");
      }
      if (!Array.isArray(body.products)) {
        throw new Error("The API returned an unexpected format.");
      }

      setProducts(body.products);
      setLoaded(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1>My connected shop</h1>
      <p>Load two practice products from my database.</p>
      <button onClick={loadProducts} disabled={loading}>
        {loading ? "Loading…" : "Load products"}
      </button>
      <p role="status">
        {loading ? "Contacting the API…" : loaded ? "Request complete." : "Ready."}
      </p>
      {error && <p role="alert">{error}</p>}
      {loaded && !loading && !error && products.length === 0 && (
        <p>No visible products yet.</p>
      )}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.name}</strong> — {product.price_mad} MAD
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Visit `/practice`, open DevTools → Network, then click **Load products**. You should see one request to your API and two products on the screen.

`fetch` sends the request. `response.json()` reads the response body. A 500 response does not automatically make fetch throw, so we check `response.ok`. `map` turns each product into one list item; `key` lets React track its identity. `finally` stops the loading indicator whether the request succeeded or failed.

TypeScript describes expected data but does not validate remote JSON at runtime. The example checks the array shape; an API you do not control deserves validation of each field too.

We load on a click to make the request easy to see. A Server Component can query Supabase directly for an initial page render; it does not need to call its own Next.js API. A custom endpoint is useful when a browser or another client needs to send a request.

## 8. Add, edit and delete practice data

CRUD means **Create, Read, Update, Delete**. Try these individually in the practice SQL Editor. Keep the ID returned by the insert:

```sql
-- CREATE
insert into public.learning_products (name, price_mad)
values ('Practice backpack', 180)
returning id, name, price_mad;

-- READ
select id, name, price_mad
from public.learning_products
where is_active = true
order by name;
```

For each of the next statements, replace `PASTE_RETURNED_UUID_HERE` with that backpack ID before running it:

```sql
-- UPDATE exactly the chosen record
update public.learning_products
set price_mad = 160
where id = 'PASTE_RETURNED_UUID_HERE'::uuid
returning id, name, price_mad;
```

Reload products. Predict the new price before looking. Then remove only the practice backpack:

```sql
-- DELETE exactly the chosen record
delete from public.learning_products
where id = 'PASTE_RETURNED_UUID_HERE'::uuid
returning id, name;
```

Without `where`, UPDATE or DELETE can affect every row. Selecting by the same ID first helps you confirm your target.

Here is how the library expresses the same operations. These are query-shape examples, not an additional route to paste into the app:

```ts
// Requires permission to insert, and to read the returned fields:
await supabase.from("learning_products")
  .insert({ name: "Practice backpack", price_mad: 180 })
  .select("id, name, price_mad").single();

// Requires appropriate update/read permissions:
await supabase.from("learning_products")
  .update({ price_mad: 160 }).eq("id", productId);

// Requires appropriate delete/read permissions:
await supabase.from("learning_products")
  .delete().eq("id", productId);
```

Always inspect the returned `error`. Our public practice client intentionally lacks write permission. Do not remove RLS to make these calls work. Admin writes require a separate authorized path. Supabase inserts do not return inserted rows by default; chaining `select` asks for them. [Insert reference](https://supabase.com/docs/reference/javascript/insert)

## 9. Understand a real write API in your shop

Read `app/api/categories/route.ts` in L'ecomax. Start with its exported `POST` function. Its main sequence is:

1. `isAdminRequest(req)` checks whether the request is authorized.
2. `readJsonLimited(req)` reads the submitted JSON with a size limit.
3. `cleanCategory(body)` validates and shapes the values.
4. `supabase.from("categories").insert(...)` creates the row.
5. It saves related media settings and refreshes relevant caches.
6. It returns JSON with HTTP status 201 for success.

That is what “connect my form to the database” involves: collect values → send request → authorize → validate → save → return result → update the screen.

The file's GET handler also reads categories, enriches them with saved media settings, and returns the result. It is more advanced than our practice route because the real shop stores related information in multiple places.

Your `lib/supabase-server.ts` already creates a server client with timeout and caching behavior. It selects `SUPABASE_SERVICE_ROLE_KEY` when available, otherwise the existing public anonymous key. Do not replace that helper with this tutorial helper: they serve different purposes. The shop's environment names also differ from this new practice app's names.

**Challenge:** find the exact line preventing an unauthenticated category POST. Why must it run before a privileged database write? Because an elevated database client cannot rely on visitor RLS policies to authorize that request.

## 10. How users can have private data

Public products and private customer records need different rules. Authentication asks “Who is this?” Authorization asks “What may this person do?”

A future private-notes exercise could use a `user_id` column linked to `auth.users(id)`. A read policy would compare the verified signed-in identity with that owner column:

```sql
-- Concept example for a future table; do not run in the current exercise.
create policy "Read my notes"
on public.learning_notes
for select to authenticated
using ((select auth.uid()) = user_id);
```

An insert policy would use `with check` to require that the new row belongs to the signed-in user. Updates need checks on both the existing row and new values. The public product policy is not appropriate for addresses or orders. [RLS reference](https://supabase.com/docs/guides/database/postgres/row-level-security)

This requires a real Auth session passed to Supabase. Merely accepting `user_id` from a form does not prove identity. Our exercise client has no such session; cookie-based Next.js Auth setup is a separate next step.

## 11. Learn relationships with an order

Imagine these tables:

| Table | Stores | Connection |
| --- | --- | --- |
| products | Items available to buy | Each product has an ID |
| orders | One purchase and its status | Each order has an ID |
| order_items | The products within a purchase | References an order and a product |

A **foreign key** requires a referenced record to exist. One order can have many order_items. Store the price agreed at purchase in each order item: changing today's catalog price must not rewrite an old invoice.

For a real checkout, the server must calculate allowed prices and stock from trusted data. Creating an order and changing stock may need a database transaction so a partial failure cannot leave inconsistent records. A Supabase database function called through `rpc` can support that design. Separate JavaScript insert requests are not automatically one transaction.

**Paper challenge:** draw an order containing two pairs of shoes and one headset. How many order_item rows would you use if each row has a quantity? Two.

## 12. Debug by following the journey

Check one layer at a time: table → permissions → API → screen.

| What you see | What to inspect first |
| --- | --- |
| Missing configuration error | `.env.local` location, exact names, then restart dev server |
| Invalid API key | URL and key belong to the same practice project; placeholders replaced |
| Relation/table not found | SQL ran in the intended project; exact table spelling and exposed schema |
| Permission denied | Table grants before row policies |
| `products: []` | Rows exist, is_active is true, read policy matches, correct project |
| API shows products, page does not | Browser Console, request URL, JSON field name and React state |
| 404 for your API | Exact `app/api/practice-products/route.ts` file and local port |
| Changes do not appear | Click Load products again; inspect response before blaming React |
| A write is rejected | Expected for our read-only client; verify authorization design |
| 500 from our route | Development terminal contains the underlying error |

Do not paste API keys or private customer records into logs or help requests. An error code, sanitized message and small reproduction are usually enough to investigate.

## 13. Finish with five mini challenges

1. **Add a product:** insert a fake active product in SQL Editor. Expected: it appears after reloading.
2. **Hide it:** set its is_active to false by ID. Expected: it remains in SQL Editor but disappears from the public API.
3. **Sort differently:** change the API order column to price_mad. Expected: cheapest first.
4. **Handle a failure:** temporarily misspell the table in the practice route. Expected: a friendly page error and useful terminal details. Restore the name afterward.
5. **Explain from memory:** describe what happens between clicking Load products and seeing the list.

You have completed this first database module when you can explain those outcomes. Next modules to explore are authenticated private data, validated write APIs, image uploads with Storage, pagination, and database migrations tracked in Git.

## References and verification

The lesson was checked against your local project structure and the linked official documentation. All four TypeScript snippets passed syntax checks. The setup SQL was tested in an isolated PGlite PostgreSQL database: it created three rows, the public role could read only two active rows, and a public insert was rejected. This does not test a hosted Supabase connection or the browser flow; those still require your separate practice setup. No live database was changed.

- [Supabase JavaScript select](https://supabase.com/docs/reference/javascript/select)
- [Supabase Next.js server-side authentication](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase database tables](https://supabase.com/docs/guides/database/tables)
