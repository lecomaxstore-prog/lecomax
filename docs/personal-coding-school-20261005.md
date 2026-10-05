# Personal coding school — 5 October 2026

Entry: `/admin/how-it-was-built/#site`. Existing owner authentication and source-library authorization remain in place. This change is local; it does not publish a deployment.

## Audit and project map

The existing interface already supplies guided learning, an interactive site explorer, a protected file reader, twelve introductory lessons, a multilingual Academy, safe miniature labs, a build playground and capstone projects. Reusing these keeps the current visual identity and avoids a second curriculum/progress system.

Verified connections used in the new teaching material:

| Visible behavior | Actual implementation |
| --- | --- |
| Shop products | `app/boutique/page.tsx` → `lib/db-server.ts:getDbProducts` → `BoutiqueClient` → `ProductCard` |
| Product details | `ProductCard` link → `app/produit/[slug]/page.tsx:getDbProductRaw` → `ProductActions` |
| Add to cart | `ProductActions:handleAdd` → `CartContext:add/setItems` → React UI and browser localStorage |
| Buy button | `handleAdd(true)` → checks/add → `router.push('/checkout')` |
| Place order | checkout fetch → `app/api/orders/route.ts:POST` → authoritative price checks → `supabase.rpc('create_commerce_order')` → admin orders |
| Sign in | `app/connexion/page.tsx:handleSubmit` → Supabase Auth `signInWithPassword` → error/session handling |
| Search | `Header` → `SearchOverlay` → `/api/search` GET |

The shop page reads its data directly on the server, rather than fetching its own products API. The actual checkout uses a Route Handler, not a Server Action. Course examples of Server Actions must not be described as this checkout's implementation. Supabase configuration remains in its existing modules; lessons contain no secret values. Existing Vercel configuration and build scripts remain unchanged.

## Implemented teaching improvements

- Arabic is the initial learning language; an explicit French, English or Arabic choice is remembered locally. New explanations use Moroccan Darija and English identifiers. Existing translated course material remains available.
- All twelve introductory lessons have a distinct everyday analogy and a deeper architecture explanation. Every selected source excerpt has a specific explanation of removing it. Short comparisons cover JSX braces, required props, case-sensitive identifiers and App Router filenames.
- The reader offers three explanation depths, selectable lines, a copy action with failure feedback, lightweight syntax colors, and protected access to the actual full file. Short code remains scrollable and LTR within RTL lessons.
- Seven selectable journeys reveal one real code step at a time. They are authored walkthroughs, not executed commerce requests. Source anchors are tested against the actual repository.
- The glossary can search across the three languages. Entries point to relevant real files and appropriate Academy chapters; Hook and JSON have explicit project examples.
- Build mode exposes four small editable labs and the existing guided shop workshop before independent capstones. These are restricted simulations, not arbitrary JavaScript execution.
- “I don't understand” now shows a different analogy and the visual flow. The existing AI tutor instructions also require a different explanation, immediately defined vocabulary, small snippets and Darija for Arabic replies.

## Learning memory and assessment

`lecomax-site-code-learning-v1` remains the browser-local progress key. Old records migrate with empty `drafts` and `reviews`; stored data is bounded and validated. Drafts survive lesson navigation and reloads. Code answers now preserve case (`setItems` is different from `setitems`). Editing an answer invalidates its current exercise check. Historical completed lessons remain recorded during revision.

A quiz result schedules a review after 1, 2, 4, 8, 16 and then at most 30 local calendar days. A failed quiz becomes due today and resets the success streak. Two misses offer simpler guidance; two successes offer an optional transfer exercise. Starting a fresh quiz invalidates its previous score without labeling the learner as struggling. Due reviews are shown as a single next action. This is an aid to practice, not certification of independent programming skill.

## Validation

- Root TypeScript passes.
- Full test suite: 489 pass, one skipped, no failures; Android back/scroll scenarios also pass.
- Full lint passes with existing warnings elsewhere; targeted lint for changed learning files and tutor route reports no warnings or errors.
- Production build succeeds after permitting the required Google Fonts downloads. The initial restricted-network attempt failed on Inter/Sora downloads, not application code.
- Added tests cover all authored source anchors, translated removal explanations, exact-case answers, progress migration and bounds, spaced review scheduling, quiz gating, restored drafts and reading depth/line changes.
- Visual mobile/desktop verification remains outstanding: computer-use inventory returned no browsers and opening the integrated browser returned `Browser is not available: iab`. No visual pass is claimed. The existing browser smoke scripts remain available when a browser is connected.
- No live AI response or production order/payment was submitted for testing.
