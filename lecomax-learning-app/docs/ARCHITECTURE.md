# Repository audit and native learning architecture

The existing learning route is `/admin/how-it-was-built`, not `/admin/how`.
The inventory in inventory.json was produced before mobile implementation.

Website: Next.js 15 App Router, React 19, strict TypeScript and Tailwind. Public
storefront routes include boutique, produit/[slug], panier and checkout. API
route handlers validate orders and prices on the server using commerce-server,
verify PayPal captures, persist to Supabase and send Resend email. Uploads use
Supabase Storage. No Cloudinary integration was found. Firebase is used for
Android push delivery. Admin sessions use signed cookies and owner checks;
customer authentication uses Supabase. middleware, API guards, database RLS and
upload validation provide distinct security boundaries. Vercel is the deployment
target. Environment names may be documented; real environment files are excluded.

The current mobile/ application is the storefront, separate from this school.
Existing user edits in both applications must remain intact.

Content sources: academy JSON (48 modules / 192 lessons / 3 languages), beginner
path, beginner Next.js and Python guides, backend guides and practice, daily
lessons/tests/code guides, hourly workshops, shop missions, learning studio,
Code Quest, inline historic page data, micro-learning curriculum and AI topics.
Dynamic AI responses belong to authenticated server history, not source lessons;
they cannot be silently exported from another user's session.

Native architecture: Expo Router routes → feature screens → reusable native UI;
generated per-module JSON loaders; local versioned progress store; indexed source
metadata with imports/importers; offline code files; secure server teacher proxy.
Content refresh is a developer build step and never runs repository code on a
phone. Generated content records source paths and hashes. Existing pedagogical
examples retain their labels; actual source snapshots are separate.

Language defaults to Arabic. Layout direction is applied at the component level
so switching Arabic/French/English does not require restarting. Code stays LTR.
AsyncStorage persists progress; secrets use SecureStore only. Teacher calls go
to the website; no provider keys are bundled. APK is for personal/internal use
because it contains a curated snapshot of this private repository.
