# Learn Next.js by understanding L'ecomax

**Start tomorrow with [your simple 45-minute daily plan](./my-daily-learning-plan.md).** Use this longer guide only when a daily exercise points here.

This is your beginner route through your own project. Start with one small win. You do not need to understand the whole shop today.

Your package.json declares Next.js 15, React 19, TypeScript and Tailwind CSS 3. The project also uses Supabase. Examples here use the App Router, the routing system your site uses. New tutorials may use newer versions: learn the idea before copying their configuration.

## How to use this guide

Try a 25-minute session: 5 minutes reading, 15 minutes doing, 5 minutes explaining what happened in your own words. Repeat a lesson when necessary. Speed comes from practice; there is no fixed deadline for mastery.

For every mission:

1. Predict what will happen.
2. Write or change something small.
3. Look at the result.
4. Explain why it happened.
5. Deliberately make one small mistake, then fix it.

Keep a notebook with three lines: “I expected…”, “I observed…”, “I learned…”. Give yourself a point for each explanation you can make without looking at the answer.

## Your site, in plain words

Imagine a shop:

| Technology | Job | Shop analogy |
| --- | --- | --- |
| HTML / JSX | Describes headings, images, buttons and forms | The shelves and signs |
| CSS / Tailwind | Controls appearance and layout | The decoration and arrangement |
| JavaScript | Adds behavior and calculations | What happens when someone presses a button |
| TypeScript | Checks expected kinds of values while developing | Labels saying what belongs in each box |
| React | Builds the screen from reusable components | Reusable shelf units |
| Next.js | Organizes pages and runs server-side application code | The shop and its back office |
| Supabase | Provides database and related services | Stored records |

A component is a function that describes a piece of the screen. A route is an address such as `/boutique`. A server is a computer that responds to requests. Your browser displays the page and handles interactions.

## Your real file map

| File | What to look for |
| --- | --- |
| `app/page.tsx` | The home page; imports pieces such as HeroBanner and ProductRail |
| `app/layout.tsx` | The shared outer structure, fonts and providers |
| `app/globals.css` | Shared styling |
| `app/boutique/page.tsx` | The `/boutique` page |
| `app/produit/[slug]/page.tsx` | A product page whose address contains a variable product identifier |
| `components/HeroBanner.tsx` | A reusable part of the home page |
| `components/CartContext.tsx` | Shared cart data and operations such as add, remove and setQty |
| `lib/db-server.ts` | Server-side database helpers |
| `app/api/orders/route.ts` | Server request handling for orders |
| `app/admin/how-it-was-built/AcademySection.tsx` | Your existing learning academy |
| `app/admin/how-it-was-built/course/content/en/` | Existing English course content |

Do not read every line in order. Choose one visible feature, find its component, and follow only the functions it uses.

## The learning ladder

Each level ends with something you can demonstrate. Spend as many sessions as you need on it.

| Level | Learn | Mission | Ready to continue when… |
| --- | --- | --- | --- |
| 1 | Files, editor, terminal, browser, local versus live site | Find the home-page file | You can explain where a change is made and where it appears |
| 2 | HTML: headings, paragraphs, links, images, buttons, forms | Describe a product card with HTML | You use a button for an action and a link for navigation |
| 3 | CSS: spacing, colors, box model, flex, grid, responsive layout | Style that card for phone and desktop | You can fix a card that overflows its container |
| 4 | JavaScript: values, variables, functions, conditions | Calculate price × quantity | You can predict the result before running the code |
| 5 | Arrays, objects, map, filter, async/await, try/catch | Filter a small fake product list | You distinguish a loading state, an empty result and a failed request |
| 6 | Git: status, diff, commits, branches | Review and save your own small change | You know exactly which files your commit contains |
| 7 | React: JSX, components, props, events, state | Build the counter below | You can explain why changing state updates the screen |
| 8 | TypeScript: strings, numbers, object types, optional values | Give a product an explicit type | You understand why a string cannot be used as a numeric price |
| 9 | Next.js: pages, layouts, Link, dynamic routes | Build two practice pages and connect them | You can predict a URL from its file path |
| 10 | Server and Client Components, loading and errors | Separate product data from an interactive quantity selector | You know which code needs browser interaction |
| 11 | Route Handlers, requests, responses, validation | Send a fake contact form to a practice endpoint | You inspect its status and response in the Network panel |
| 12 | SQL, Supabase, authentication and permissions | Read sample products from a separate test database | You explain why the server must check permissions |
| 13 | Cart, checkout, stock and payment lifecycle | Trace one test order end to end | You never trust a browser-supplied price or a payment success screen alone |
| 14 | Debugging, accessibility and meaningful tests | Reproduce a bug, fix it and verify the original scenario | You can describe evidence for the fix |
| 15 | Deployment, environment variables, logs and rollback | Deploy a separate practice project | You can distinguish local, preview and production |
| 16 | Metadata, images, performance, caching and revalidation | Measure and improve one slow practice page | You can explain what was measured and whether it improved |
| 17 | Independent capstone | Build a small shop with fake products, cart, forms and tests | You can rebuild a feature and explain its tradeoffs without copying blindly |

Later topics include Server Actions, Suspense and streaming, cache invalidation, pagination, webhooks, duplicate-request handling, monitoring and database migrations. Learn them when a project gives you a concrete reason to use them.

## Mission 1: read a tiny page

This is a teaching example, not a replacement for your existing home page:

```tsx
export default function PracticePage() {
  return (
    <main>
      <h1>My first shop</h1>
      <p>I am learning how my site works.</p>
    </main>
  );
}
```

Read it like a sentence:

- `function PracticePage()` names a function.
- `return` gives React the screen description.
- `<main>` contains the main page content.
- `<h1>` is the main heading.
- `<p>` is a paragraph.
- `export default` lets Next.js use this function as the page.

The HTML-like part is called JSX. In this TypeScript project, files containing JSX use `.tsx`.

Predict: what happens if you change only the words inside `<h1>`? Answer: the heading changes; the paragraph does not.

In a separate practice project, putting this code in `app/practice/page.tsx` creates `/practice`. Your existing `app/page.tsx` creates `/`. Do not replace the real shop homepage with this example.

**Mini challenge:** add a second paragraph. Then explain the difference between the filename and the heading text.

## Mission 2: make a button work

Use this as a page in your practice project:

```tsx
"use client";

import { useState } from "react";

export default function PracticePage() {
  const [quantity, setQuantity] = useState(1);
  const price = 120;

  return (
    <main>
      <h1>Practice product</h1>
      <p>Quantity: {quantity}</p>
      <p>Total: {price * quantity} MAD</p>
      <button onClick={() => setQuantity((current) => current + 1)}>
        Add one
      </button>
    </main>
  );
}
```

`useState(1)` gives the component a remembered value starting at 1. `quantity` reads it. `setQuantity` changes it and asks React to update the screen. Curly braces insert JavaScript values into JSX. `onClick` supplies the function to run on a click.

`"use client"` marks a client boundary: this component needs interactive browser behavior. It does not mean Next.js never generates initial HTML for it on the server. Pages and layouts are Server Components by default in the App Router.

Predict the total after two clicks: **360 MAD**. The quantity starts at 1 and becomes 3.

**Mini challenge:** add a “Remove one” button without allowing quantity below 1. Hint: `Math.max(1, current - 1)`. Then add a reset button. This example is local practice state; it does not change your real cart or create orders.

Your real `components/CartContext.tsx` uses the same basic idea, expanded to a list of products shared across components. Its `CartProvider` holds `items` in state. Read that declaration first; leave inventory and storage details for later.

## Mission 3: follow your homepage

Open `app/page.tsx` and find these imports: `HeroBanner`, `CategoryTiles`, `ProductRail` and `getDbProducts`.

An `import` means “use something defined in another file.” In this project, `@/` means the project root, as configured in `tsconfig.json`.

Pick `HeroBanner`. Open its component file and find the JSX it returns. Identify one text element and one styling class. You have now connected a visible part of the shop to its source.

Next, search for where `getDbProducts` is called in the homepage. Follow it into `lib/db-server.ts`. Your goal is to explain this flow:

```text
Visit homepage → page obtains data → components receive values → browser displays the result
```

That is a simplified map, not a description of every cache or fallback in the application. Add those details as you read the actual functions.

## Mission 4: debug the screen in your screenshot

Debugging means finding why the observed behavior differs from the intended behavior.

The original source contained a useful real example (now corrected in the local code):

- `app/admin/how-it-was-built/unlock/page.tsx` limits input to 4 digits and rejects anything else.
- `app/api/admin/how-built-pin/route.ts` reads the server variable `HOW_BUILT_PIN` and rejects missing values or values shorter than 8 characters.
- The API returns status **503** with the garbled message shown in your screenshot for that configuration failure.

Those input rules could not both succeed. A four-digit value failed the server configuration check; a value with at least eight characters could not be entered through the old form. The updated form accepts at least eight characters and reports missing configuration before submission. The screenshot alone does not tell us the deployed variable's value. See [learning access setup](./learning-access-setup.md) for configuration.

This is a mismatch between the browser and server rules. A correction should align the form with the stronger server requirement, preserve the owner check, and show readable configuration errors. A valid server configuration is also necessary. Do not put the real access code in lesson content or browser code.

The reusable debugging method:

1. **Reproduce:** write the exact action and result.
2. **Locate:** is the failure in layout, browser behavior, network, server or data?
3. **Inspect:** open browser DevTools → Network, repeat the action, select the request, read Status and Response. Browser logs live in Console; local server logs appear in the development terminal.
4. **Hypothesize:** write one possible cause supported by what you saw.
5. **Change one thing:** fix the smallest relevant piece.
6. **Verify:** repeat the original action and try invalid input too.

For this example, inspect the POST to `/api/admin/how-built-pin`. A 401, 403, 429 and 503 have different causes in that handler. Read the response and matching source branch before deciding what to change.

## Common bugs to practice

| Symptom | First check | Small exercise |
| --- | --- | --- |
| Page returns 404 | Folder path and the presence of `page.tsx` | Predict three file-to-URL mappings |
| Click does nothing | Event handler and whether state changes | Compare passing a function with calling it during render |
| State never updates on screen | Is it React state or an ordinary variable? | Replace a plain counter with useState |
| TypeScript reports an error | Read the first error and expected type | Compare `120` with `"120"` |
| Request fails | Network status, response, then server logs | Distinguish a rejected request from an empty list |
| Hydration warning | Does the initial browser output match server HTML? | Investigate time, random values or browser-only values used during rendering |
| Phone layout overflows | Fixed widths and long unbroken text | Try a narrow browser window |

## Commands, explained

Run commands from the relevant project directory. For L'ecomax:

```sh
git status --short
git diff
npm run dev
```

The first shows changed files. The second shows edits. The third starts the local development server and, in this repository, first runs the course generator. Read the local URL printed in the terminal. Stop the server with Ctrl+C. Starting it does not publish your edits.

For checks, this repository provides `npm run lint`, `npm run validate:course` and `npm run build`. The course validation command also regenerates course files. A build checks production compilation; it does not prove every user flow works. Run relevant tests and inspect the changed behavior too.

There are already many unrelated changes in this working directory. Before practicing here, learn to identify your own changes with Git. A separate practice project makes early experiments easier to understand.

## Use the existing academy without getting overwhelmed

Your academy already contains English, French and Arabic modules. Follow this order first:

1. Learning tools and how the web works.
2. HTML, CSS and JavaScript foundations.
3. React fundamentals and state.
4. TypeScript, then Next.js App Router.
5. Server data, database basics and practical debugging.

Skip business and marketing modules while you focus on coding. Use the code explorer to answer one question at a time. If a lesson introduces five unfamiliar terms, write them down and learn the smallest example first.

## Official references

- [React Foundations](https://nextjs.org/learn/react-foundations): preparation for Next.js; assumes HTML, CSS and JavaScript knowledge.
- [Next.js 15 documentation](https://nextjs.org/docs/15/app): version-aware reference for this project's declared major version.
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): the current official explanation of the boundary.

Your first success today: explain what a component is, locate the homepage, and predict the counter's output. Understanding those three things is a real start.

## Continue: databases and APIs

Open [Supabase and APIs, step by step](./learn-supabase-and-apis.md). Build a tiny product database, connect it to a Next.js API, and display the results. Includes SQL exercises, permission rules, debugging checkpoints and a guided tour of your real category API.
