# Reviews after delivery

Customers can review a purchased product from its review section on the website or mobile app, without creating an account. They choose phone or email, enter their order number, verify the purchase, then select a rating and write an honest review. A thank-you message confirms publication.

- The order must contain that product and be delivered.
- Phone lookup supports Moroccan local, +212 and 00212 formats; email matching ignores case and outer whitespace.
- Contact information is sent in POST bodies and is not returned in public reviews.
- The server checks the purchase again at publication; changing a client eligibility flag cannot bypass it.
- A database constraint prevents duplicate reviews for the same order/product across phone, email and account submissions.
- A persistent per-order lookup limit complements the existing per-IP API limit.
- Direct anonymous/account writes are blocked at the database permission level. Public rating reads remain available, while private email and order references cannot be selected by public clients.
- Signed-in customers retain their existing review flow.
- New delivery invitation URLs contain the order reference instead of the customer's email. App links preserve that reference.

## Release status

The Supabase migrations `20260914220000_guest_order_reviews.sql` and `20260914223000_review_api_permissions.sql` were applied on the linked project on September 14, 2026. The index, function and effective permissions were verified. Website/API and mobile changes still need their normal production releases; applying the database migrations alone does not publish the feature.

Validation: website/mobile TypeScript, website production build, Android/iOS/web exports, 19 review eligibility/publication/link tests, and the isolated SQL tests. The exports are validation artifacts, not signed store submissions. Browser/device interaction remains to be verified because this session has no connected browser.

For a final acceptance check, use a designated delivered test order to verify phone and email paths, publish one honest test review in a test environment, then confirm a second submission is rejected. Check wrong contact, undelivered order, retry after a network failure, and a delivery invitation on an installed phone. Do not publish invented customer reviews to production.

Commands:

```text
node --test tests/review-*.test.ts
node scripts/test-guest-review-sql.mjs
```
